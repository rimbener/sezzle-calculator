# review-slice-2 — slice 2, the calculation domain

**Verdict: APPROVED**

Scope: the slice's diff from `c868309` (slice 1's `closing-commit`, read from `tdd-1.md:35`) — tracked changes to `AGENTS.md`, `package-lock.json` and `tmp/subtask-3.md`, plus the untracked `apps/calc-service/` tree (24 files) and `tmp/tdd-2.md`. The one commit in range, `b1d1c7d`, is the trail commit that wrote slice 1's `closing-commit:` line — bookkeeping, no finding raised on it. Subtasks in the slice: subtask-3 (AC-6, AC-7, AC-8, AC-9, AC-17, AC-18). No `refactor:` entry on subtask-3, so none owed.

## Suite

`npx turbo run test --output-logs=errors-only` — exit 0, 4 tasks successful (packages in scope: `@repo/contracts`, `@repo/eslint-config`, `@repo/typescript-config`, `@repo/ui`, `calc-service`, `sezzle-calculator`). Run once `--force` (uncached, 521ms) and once as given (cache hit). Supporting evidence, `vitest run --reporter=verbose` inside `apps/calc-service`: 10 files, 28 tests, all passing. Prettier `--check` over `apps/calc-service/**/*.{ts,md}` and `AGENTS.md`: clean.

## Lens 1 — correctness against the contract

`criterion → test` map present in `tdd-2.md` and verified against the files:

| Criterion | Covered by | Ruling |
| --- | --- | --- |
| AC-6 | `src/operations/{add,subtract,multiply,divide,power,sqrt,percentage}.test.ts` at the nine enumerated values; `src/calculate.test.ts:7-21` the same nine reached by name through the registry | covered — every value AC-6 lists is asserted twice (directly and via `calculate`) |
| AC-7 | `divide.test.ts:12-25`, `sqrt.test.ts:16-29` (instance of `CalculationError`, exact code and `ERROR_MESSAGES` string, no result reached); `calculate.test.ts:47-62` pass-through | covered |
| AC-8 | `calculate.test.ts:23-45` — `power(10, 10000)`, `add(1e308, 1e308)`, `power(-8, 0.5)` all `RESULT_NOT_FINITE` | covered — the guard sits once in `calculate.ts:16-18`, as subtask-3 asks |
| AC-9 | `registry.test.ts:14-30` (keys equal `OPERATIONS`, each entry is the module's function); `domain-purity.test.ts:24-36` (every `.ts` under `src/` imports only `@repo/contracts`, `vitest` or a relative sibling; the build record shows it red on an injected `import "node:http"`) | covered |
| AC-17 | repo-wide gate, not a unit test: `apps/calc-service/package.json:6-10` has `lint`/`check-types`/`test` and no `dev`/`start` (read), so root `dev` fans out to no missing entry file; the `lint`/`check-types`/`build` legs and `turbo run dev --dry-run` are the recorded runs in `tdd-2.md` (12/12, 1/1) — only the `Commands:` suite was re-run here | covered as slice 1 accepted AC-5 |
| AC-18 | `apps/calc-service/README.md:3-16` — what it is, **internal**, never browser-facing, `npx turbo test --filter=calc-service` (read) | covered |

Production code is exactly the four layers subtask-3 names and nothing more: seven one-expression pure functions (`divide.ts:6`, `sqrt.ts:6` carry the two domain guards), `registry.ts:18-26` as `Readonly<Record<Operation, OperationFn>>` so a missing entry is a type error, `calculation-error.ts:13-21` typed to the three domain codes via `Exclude<ErrorCode, ...>` with the message taken from `ERROR_MESSAGES`, and `calculate.ts:11-20` lookup, spread, non-finite guard. Nothing built ahead of a scenario; no HTTP, no `app.ts`, no `server.ts`. `percentage.ts:2` is `(x / 100) * y` (XC-3). All codes and messages come from `@repo/contracts` — the workspace declares no copy of its own (AC-3 preserved).

## Lens 2 — project conventions

- Layering matches PRD-P0 and `AGENTS.md` § Architecture rules: arithmetic only in `calc-service`, behind a registry, as pure functions; no import of `hono`, `@hono/node-server` or `zod` anywhere in `src/` (`domain-purity.test.ts` would fail otherwise).
- Workspace shape mirrors `packages/contracts`: `eslint.config.mjs` and `vitest.config.ts` identical, same `lint`/`check-types`/`test` scripts, `type: module`, `.ts`-extension relative imports, `erasableSyntaxOnly` + `verbatimModuleSyntax`. Runnable process under `apps/`, unscoped name `calc-service`, as the spec's resolved decisions state.
- Lint style: semicolons, double quotes, Prettier-clean — right for a workspace extending `@repo/eslint-config`.
- `tsconfig.json:4` adds `"types": ["node"]` beyond subtask-1's shape; the build record explains it (root hoists `@types/node` 26.x for `@repo/ui`, the workspace pins 24.x for the runtime, so `tsc` loads one version) and `apps/sezzle-calculator/tsconfig.node.json:6` is the existing precedent. Not a finding.
- `hono`, `@hono/node-server`, `zod` are declared in `package.json:11-16` yet unused in this slice — subtask-3 names them explicitly, so they are in scope rather than ahead of it.

## Lens 3 — user surface

`N/A`. The slice adds no CLI, API, config surface or UI: `calculate` is an internal function, and every error code and message string it emits is a constant from `@repo/contracts` already reviewed in slice 1. Package scripts follow the existing names.

## Lens 4 — docs parity

In-slice: `apps/calc-service/README.md` (AC-18) and `AGENTS.md` (`CLAUDE.md` is a symlink to it) — § What this is now names the calculation domain and that the gateway is unbuilt, the tests sentence lists `apps/calc-service/src/**/*.test.ts`, § Monorepo layout gains an accurate `apps/calc-service` entry (domain only, build-free, no `dev`/`start` until `src/server.ts`, purity test), and the ESLint consumers list includes it. Each statement checked against the tree; none contradicts the code. `packages/contracts/README.md` and the root `README.md` are untouched and remain accurate. Nothing was deferred.

## Findings

None. `open`: 0, `resolved`: 0.

## Observations (not findings)

- `spec.md` § Approach says `src/operations/*.ts` import "nothing but each other"; `divide.ts:1-3` and `sqrt.ts:1-3` also import `@repo/contracts` and `../calculation-error.ts`. The same spec's error table requires `divide` to raise `DIVISION_BY_ZERO`, and subtask-3 makes `calculation-error.ts` "the domain's only way to say this cannot be computed", so the imports are what the approved bundle asks for; the spec sentence is loose shorthand, not a contradiction worth a fix.
- AC-6 is stated as its nine enumerated values and those are what the tests pin; per-operation files carry no values beyond the criterion, which is the intended discipline (no behavior ahead of a scenario).
