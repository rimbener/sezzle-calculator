# review — p2-api-gateway (full-review, base `main`)

**Verdict: APPROVED** — round 1. Zero findings across the four lenses (spec scope & test traceability, architecture & dependencies, performance, security). Two lenses had surfaces to judge; none is `N/A`.

## What was reviewed

Diff `main...HEAD` (`git diff --stat main...HEAD`: 50 files, +2182/−47; commits `b8404db`..`35c0a61`), read as hunks against `spec.md`, `acceptance-criteria.md`, `subtasks.md`, `subtask-1..5.md`, `tdd-1..3.md` and the three slice reviews. Suites were **not** re-run (not this step's job); the trail's last recorded gate is `tdd-3.md:3` — `npx turbo run lint check-types test` 15/15 green — and no trail file reports a red suite.

Slice verdict files: `review-slice-verdict-1.md` / `-2.md` `APPROVED`; `review-slice-verdict-3.md` still reads `CHANGES_REQUESTED`, but `review-slice-3.md`'s own tail records its single finding (major, docs parity, `AGENTS.md:7`) as **resolved** by fix-slice-findings. That resolution is a prose sentence, so inspection is the only possible evidence — verified here directly: `AGENTS.md:7` now ends "the SPA does not yet call the gateway and today renders only the design-system showcase", and `apps/sezzle-calculator/src/App.tsx` (8 lines) renders `<DesignSystem />` and nothing else. The stale verdict file is a bookkeeping artefact of the slice guard, not an open finding.

## Lens 1 — spec scope & test traceability `[code]`

Every criterion in `acceptance-criteria.md` maps to at least one concrete test, checked against the test files themselves (not only the `tdd-N.md` maps):

| Criterion | Test(s) | Ruling |
| --- | --- | --- |
| AC-1 | `packages/contracts/src/errors.test.ts:19` (six codes, `ErrorCode` union), `:55` (both sentences verbatim) | covered |
| AC-2 | `packages/contracts/src/calculate.test.ts:144-176` (result schema: finite accepted, extra key dropped, NaN/±Infinity/missing/wrong type/null/non-object/envelope rejected); `errors.test.ts:72-121` (envelope schema: every known code, extra keys dropped at both levels, 12 rejection shapes) | covered |
| AC-3 | `errors.test.ts:124-141` (values + `keyof` ≡ `ErrorCode` + literal `400`/`502`); `apps/calc-service/src/status-map.test.ts:31` (repo-wide scan, exactly `packages/contracts/src/errors.ts` declares it) | covered |
| AC-4 | `apps/calc-service/src/app.test.ts` unchanged in the diff and pins status + `toStrictEqual` body for every response; root `README.md`, `turbo.json`, root `package.json`, `apps/sezzle-calculator`, `packages/ui` absent from the diff; neither SPA nor `@repo/ui` depends on the contract or a service (`package.json` grep) | covered as far as a non-running review reaches — see note on `build` |
| AC-5 | `apps/api-gateway/src/config.test.ts:16,25,39,55` | covered |
| AC-6 | `apps/api-gateway/src/calc-client.test.ts:50,68` | covered |
| AC-7 | `calc-client.test.ts:78,84,95,101` | covered |
| AC-8 | `calc-client.test.ts:118` (×11), `:144` (×2) | covered |
| AC-9 | `calc-client.test.ts:159,174,251,268` | covered |
| AC-10 | `calc-client.test.ts:192,213,230` (+ `:268` for "the whole call ends at the budget") | covered |
| AC-11 | `apps/api-gateway/src/app.test.ts:37-62` (×7) | covered |
| AC-12 | behavioural `app.test.ts:78-106`; structural `apps/api-gateway/src/no-arithmetic.test.ts:36-62` | covered |
| AC-13 | `app.test.ts:186-238` (×12), `:240-262` (×4), `:264-278` | covered |
| AC-14 | `app.test.ts:140-181` | covered |
| AC-15 | `app.test.ts:108-138`, `:281-307`; live path `apps/api-gateway/src/server.test.ts:70-77` | covered |
| AC-16 | every body assertion above is `toStrictEqual`; `:281-307` asserts no `fetch`/path/`ECONNRESET` text | covered |
| AC-17 | `app.test.ts:344-419` (×5); Hono 4 `cors` with a string origin is an exact match (`node_modules/hono/dist/middleware/cors/index.js:17`), so "another origin granted nothing" is real | covered |
| AC-18 | `server.test.ts:51-104` (×5), `:106-149` (child `node src/server.ts`); default 3000 via `config.test.ts:16` | covered |
| AC-19 | `apps/api-gateway/README.md` — public-only `:3-4`, start `:18-20`, test `:97-99`, four variables `:30-35`, curl success/400/422/502 `:45-80`; the quoted 400 and 422 sentences match `packages/contracts/src/messages.ts` (`operandsMessage`, `ERROR_MESSAGES`) and `percentage(15, 200) = 30` matches the PRD's definition | covered by docs |
| AC-20 | gate 15/15 (`tdd-3.md:3`); `turbo run dev --dry-run=json` lists both `dev` tasks; `GATEWAY_PORT` vs `CALC_SERVICE_PORT` cannot collide (`config.test.ts:55`) | covered as far as the gate reaches |
| AC-21 | `app.test.ts:309-342` (real client + fetch fake, 502/502/200, five calls, one app) | covered |

**`refactor:` entries.** Only `subtask-1.md` carries one: move `STATUS_BY_CODE` from `apps/calc-service/src/app.ts` into `@repo/contracts` — `preserves:` every calc-service response's exact status/code/message. Landed exactly as named (`apps/calc-service/src/app.ts:6` imports it; the local map and the `hono/utils/http-status` import are gone; `fail` still indexes the same table) and pinned by the unchanged `apps/calc-service/src/app.test.ts`. Subtasks 2–5 carry none.

**Scope.** Nothing in the diff past the spec: no health route, logging, 404 envelope, rate limiting or frontend change; the four env vars are exactly `spec.md` § Configuration's; the 100 ms pause is a constant as decided. `apps/calc-service/src/calculation-error.ts:6` (type-only `Exclude` widening) sits outside subtask-1's path list but is forced by `ERROR_MESSAGES` excluding the new code — not creep. **Recorded deviation, accepted:** `subtask-4.md` says `app.ts` exports a ready-made `app`; it exports `createApp` only, and `tdd-3.md` explains a ready-made `app` would read `process.env` at import time against `spec.md` § Approach / `subtask-5.md`. The spec wins; `AGENTS.md:52` documents `createApp({ calcClient, corsOrigin })` accurately.

**Note on `npm run build`.** No slice ran it (`tdd-3.md` says so). `build` exists only in `apps/sezzle-calculator`, which — with `packages/ui` — is untouched and depends on neither the contract nor a service, so nothing in this diff can have moved it. The task-level CI gate runs it; not re-run here by rule.

No finding.

## Lens 2 — architecture & dependencies `[arch]`

- Layering: gateway imports only `@repo/contracts`, `hono`/`hono/*`, `@hono/node-server`, `node:*` and siblings (`no-arithmetic.test.ts:44` enforces); calc-service imports the contract only; the contract imports `zod` only (`packages/contracts/package.json` unchanged). Neither service imports the other (BE-1). Route does parse/call/serialise only (`app.ts:80-112`); failure logic lives in `calc-client.ts`, as the spec places it.
- No new abstraction or config surface beyond the spec's: `createApp` DI seam and injected `fetch` are the spec's chosen approach; `STATUS_BY_CODE` shape `as const satisfies Record<ErrorCode, number>` is the spec's recorded decision.
- **Dependency diff — read hunk by hunk.** `package-lock.json` +38/−0, additive only: the `apps/api-gateway` workspace block (deps `@hono/node-server ^2.1.1`, `@repo/contracts *`, `hono ^4.13.7`, `zod ^4.5.4`; dev `eslint 10.9.1`, `typescript ~6.0.3`, `vitest ^5.0.0`, `@types/node ^22.20.1` — the same set and ranges as `apps/calc-service/package.json`), a nested `apps/api-gateway/node_modules/@types/node` 22.20.1 + `undici-types` 6.21.0 whose `resolved`/`integrity` match calc-service's existing nested pair byte for byte (lockfile `:72-85`), and the `node_modules/api-gateway` link. **No new third-party package, no version bump, no major jump, no patched or vendored dependency, no `overrides`/`resolutions`, no `.npmrc`, no lifecycle script newly trusted** (both nested packages are type-only). Root `package.json` and `turbo.json` unchanged.
- Compatibility: `CalculateResponse` / `ErrorResponse` moved from hand-written types to `z.infer` with identical shape (`errors.test.ts:65-69` still asserts type equality); `ERROR_MESSAGES`'s key type narrowed and its one consumer (`calculation-error.ts`) adjusted; no persisted state or schema-on-disk exists to break.

No finding.

## Lens 3 — performance `[perf]`

- Deadline is one `setTimeout` per call, cleared in `finally` (`calc-client.ts:116,166`); the signal reaches the real `fetch` so a hung socket is released; `Promise.race` guarantees settlement at the budget even against a fetch that ignores the signal. No busy-wait; the pause is timer-based and abortable (`:81-92`). Per-call `AbortController` and listeners are GC'd with the call.
- No accidental serialisation: one request → at most two sequential attempts, by design (retry). No repeated I/O; the request body is read once (`app.ts:81`), the downstream body once (`calc-client.ts:128`).
- Request body: `c.req.text()` buffers the whole body with no size cap — identical to calc-service's Phase 1 route (`apps/calc-service/src/app.ts:53`) and not asked for by PRD-P0/P1 (rate limiting is P2; no payload-limit requirement anywhere in `docs/`). Adding a `bodyLimit` middleware would be a config surface the design docs do not call for, which this review's own arch rule forbids without a recorded decision. Observation for a future spec, not a finding.
- Repo-scanning tests (`status-map.test.ts`, `no-arithmetic.test.ts`) are synchronous file reads over small `src/` trees at test time only.

No finding.

## Lens 4 — security `[security]`

Trust boundaries touched: the public HTTP surface, the env-config surface, the downstream reply, and one spawned child in a test.

- Injection: no shell, query or interpreter receives request data. The test's `spawn(process.execPath, ["src/server.ts"])` has a fixed argv (`server.test.ts:115`).
- Sensitive data on exposed surfaces: no secrets exist; `app.onError` (`app.ts:76-78`) maps any residual throw to the bare envelope and `app.test.ts:281-307` asserts no exception text, path or errno leaks. The 400 sentences echo the request's operation name (`unknown operation '<op>'`) — the contract's Phase 1 behaviour, served as `application/json`, and `spec.md` § Error contract requires them "unchanged from Phase 1"; the 422 message is relayed verbatim from the internal calc-service after `errorResponseSchema` constrains it to a string, as the spec requires.
- Path traversal: no user-controlled value becomes a path segment. `CALC_SERVICE_URL` is operator config; `calculateUrl` only trims trailing slashes.
- Resource teardown: deadline timer cleared in `finally`; abort propagates to the real socket; `server.close` awaited (`server.ts:31-34`); the test child is killed in `afterEach` and its `SIGTERM` exit awaited (`server.test.ts:108-111,140-144`). The timeout settles from the gateway's own timer plus the race, never from a signal the downstream controls.
- CORS: exact-string origin match, `POST`/`OPTIONS` + `content-type` only, no credentials (`app.ts:65-72`).

No finding.

## Findings

None open. None resolved-in-this-round (the one prior finding, slice 3's `AGENTS.md:7`, was resolved before this review and re-verified above).

## Verdict

**APPROVED** — recorded in `review-verdict.md` beside this file via `workflows/spec-to-code/scripts/write-verdict-file.sh`.
