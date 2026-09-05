# Spec — p1-contract-calc-service

Shared contract package and calculation service. Covers `XC-1`, `XC-3`, `BE-4`, `BE-5`, `BE-8` and the calc-service half of `BE-1`, `BE-3`, `BE-9`, `BE-11` — Phase 1 of `docs/PRD-P0.md` §11.

Problem and observable success: [`tmp/user-story.md`](tmp/user-story.md). Verifiable behaviours: [`acceptance-criteria.md`](acceptance-criteria.md). Work breakdown: [`tmp/subtasks.md`](tmp/subtasks.md). Decisions below were taken with the human in [`tmp/spec-interview-log.md`](tmp/spec-interview-log.md).

## Summary

Define the request/response contract once in a new workspace package, and build a calculation service that owns all seven operations behind it. The service validates its own input, runs the maths as pure functions with no HTTP in them, and answers `POST /calculate` on its own port. The gateway and the SPA are later phases, untouched here.

## Surfaces touched

| Surface | Change |
| --- | --- |
| `packages/contracts` (`@repo/contracts`) | new — operation names, operand arity, Zod request schema, response and error types, error codes, message constants |
| `apps/calc-service` | new — pure operation modules, operation registry, Hono app, server entry, tests, README |
| `turbo.json` | `build.outputs` corrected from the Next.js leftover `.next/**` to `dist/**` (behaviour-preserving; see subtask-1) |
| root `package-lock.json` | new workspaces and their dependencies |

Not touched: the root `README.md`, `.nvmrc` (both XC-2's), `apps/sezzle-calculator`, `packages/ui`, `packages/eslint-config`, `packages/typescript-config`.

## Approach

**Chosen — one source-consumed contract package plus a build-free Hono service.**

`@repo/contracts` exports `src/index.ts` directly with no build step, as `@repo/ui` does. Node 24.20 strips types from a workspace package symlinked into `node_modules`, so `calc-service` runs as `node src/server.ts`: no bundler, no `dist/`, no `^build` edge in Turborepo. The cost: relative imports carry explicit `.ts` extensions, and both packages stay erasable-syntax-only — no enums, no parameter properties — enforced by `erasableSyntaxOnly` in their tsconfigs.

The service's three layers sit in separate files. `src/operations/*.ts` are pure functions importing nothing but each other; `src/operations/registry.ts` maps an operation name to its function; `src/calculate.ts` looks the function up, runs it, and rejects a non-finite result; `src/app.ts` only parses, calls and serialises. An eighth operation is a new module plus a registry line — no route edit (BE-8).

Validation is one schema, not seven. `calculateRequestSchema` is an operation enum plus an array of finite numbers, refined against the same `OPERAND_COUNT` map the registry uses, so arity is stated once. Each rejection maps to a hand-written sentence in UC-6's phrasing rather than Zod's issue text, so messages stay stable across Zod versions and identical in both services (BE-3).

Alternatives weighed and why not:

- **`tsc` build step emitting `dist/` + `.d.ts`** — bundler-independent, but adds a compile to every dev loop, needs `^build` wiring and correct `build.outputs`, and breaks the repo's source-consumption convention.
- **`tsx` as the runner** — full TS syntax and a mature watch mode, for a dev dependency the brief does not ask for; Node's own `--watch` covers the need.
- **Discriminated union of seven per-operation schemas** — stronger inferred types, but either the 400 messages become Zod-version-dependent and drift from UC-6, or arity ends up stated twice.
- **Hand-rolled `node:http` → `Request`/`Response` adapter** — drops the `@hono/node-server` dependency, but streaming bodies and header edge cases are infrastructure the assessment does not ask to see, needing their own tests.
- **Both workspaces under `packages/`, or a new `services/*` glob** — either works; `packages/` for shared code and `apps/` for runnable processes is the repo's existing split, and needs no glob change.

New direct dependencies: `hono` and `zod` (fixed by `docs/REQUIREMENTS.md`), and `@hono/node-server`, Hono's own Node adapter, which the Phase 2 gateway reuses.

## Error contract

Every error response, at every status, is `{ "error": { "code": string, "message": string } }` (BE-5). Codes and messages are constants exported by `@repo/contracts`, so the gateway inherits them unchanged in Phase 2.

| Status | Code | Case | Message |
| --- | --- | --- | --- |
| 400 | `VALIDATION_ERROR` | `operation` is a string naming none of the seven | `unknown operation 'foo'` |
| 400 | `VALIDATION_ERROR` | `operation` is absent, `null`, or not a string | `operation must be one of: add, subtract, multiply, divide, power, sqrt, percentage` |
| 400 | `VALIDATION_ERROR` | wrong operand count, missing `operands`, non-numeric operand, `NaN`, `Infinity` | `operation 'add' requires exactly 2 finite operands` |
| 400 | `VALIDATION_ERROR` | the same, for a one-operand operation | `operation 'sqrt' requires exactly 1 finite operand` |
| 400 | `VALIDATION_ERROR` | the body is not valid JSON | `request body must be valid JSON` |
| 422 | `DIVISION_BY_ZERO` | zero divisor | `cannot divide by zero` |
| 422 | `NEGATIVE_SQRT` | negative radicand | `cannot take the square root of a negative number` |
| 422 | `RESULT_NOT_FINITE` | result is `Infinity` or `NaN` | `result is not a finite number` |
| 500 | `INTERNAL_ERROR` | anything unexpected | `internal error` |

Three rules fix every string above, so a test asserts the sentence and never a fragment:

- **Only a supplied operation name is ever interpolated**, and only when it arrived as a string, quoted verbatim in single quotes. The absent/`null`/non-string case has nothing to quote, so it names the seven valid operations instead. Operand values are never interpolated.
- **The operand noun agrees with the count**: `operands` at 2, `operand` at 1, so `sqrt` reads `operation 'sqrt' requires exactly 1 finite operand`. The count is the operation's real arity from `OPERAND_COUNT`, never a literal.
- **The operation is validated before the operands.** A request wrong in both ways gets the operation's message, because the operand rule has no arity to check against until the operation is known.

`INTERNAL_ERROR` is new: BE-5 requires the envelope on 500s but PRD §9 names no code for one. No 500 body carries a stack trace or internal detail (UC-6 postcondition). These strings are for a reviewer with curl; the SPA writes its own user-facing copy under FE-4.

404 is deliberately left at Hono's default: its format is P1 (BE-19).

## Non-goals

The api-gateway, any frontend change, and any frontend consumption of `@repo/contracts` (Phases 2 and 3). Health endpoints (P1, BE-7). CORS — calc-service is never browser-facing (BE-10). Route versioning — the internal route is `POST /calculate`, unversioned, because the gateway is the compatibility boundary (PRD §9). Arbitrary-precision arithmetic — IEEE-754 doubles, as PRD §3 fixes. Rounding or formatting of results: the service returns the raw double. The root README, `.nvmrc`, and any architecture prose (XC-2). Persistence and history — the service is stateless.

## Resolved decisions

| Decision | Why |
| --- | --- |
| `packages/contracts` (`@repo/contracts`) + `apps/calc-service` | shared code in `packages/`, runnable processes in `apps/` — the repo's existing split, no workspace-glob change |
| Build-free source consumption; `node --watch src/server.ts` in dev | matches `@repo/ui`; Node 24 strips types across the workspace symlink, so a build step buys nothing |
| One base schema refined by an `OPERAND_COUNT` map, not a 7-way union | the arity fact is stated once and shared with the registry; messages stay hand-written and stable |
| Hand-written message sentences, no operand values interpolated | every message is a constant a test asserts exactly, matching UC-6's example wording |
| New code `INTERNAL_ERROR`, generic message | BE-5 demands the envelope on 500s; PRD §9 defines no code for one |
| A distinct sentence for an absent/`null`/non-string `operation`, listing the seven names | UC-6's `unknown operation 'foo'` presupposes a name to quote; the story lists missing fields among the 400s, so that case needs its own exact constant. Wording is the spec step's call (`tmp/user-story.md`, Notes) |
| `CALC_SERVICE_PORT`, default 3001 | service-prefixed, so Phase 2's `GATEWAY_PORT` and `CALC_SERVICE_URL` sit beside it when one shell starts both |
| `@hono/node-server` | Hono's maintained Node adapter; the gateway reuses it, so the choice is made once |
| Additive, plus the `turbo.json` `build.outputs` fix | keeps the diff reviewable; the outputs fix is a one-line behaviour-preserving correction this slice's workspace work sits on |
| Both new workspaces extend `@repo/eslint-config/base` and `@repo/typescript-config/base.json` locally | `packages/ui`'s convention; `packages/typescript-config` itself stays untouched, so each new package restates the four Node-specific compiler options rather than adding a shared `node.json` |
