# tdd-2 — slice 2, the calculation domain

Verification: `npx turbo run lint check-types test --output-logs=errors-only` — 12/12 tasks (`--force`, uncached, exit 0) with `calc-service` in scope; `calc-service` runs 28 tests in 10 files, `@repo/contracts` its 59. Diff base: `c868309` (slice 1's `closing-commit`). AC-17's other legs, run from the root: `npm run build` 1/1 (`sezzle-calculator:build`, the only workspace with a `build` script; second run `FULL TURBO`); `npx turbo run dev --dry-run` resolves `calc-service#dev` to `<NONEXISTENT>` alongside the four packages that also have no `dev` — only `sezzle-calculator#dev` (`vite`) would run, so root `dev` invokes no script whose entry file is missing.

Workspace notes: `@types/node` is `^24.13.3` (the runtime's major) and nests under `apps/calc-service/node_modules` because the root hoists `@repo/ui`'s 26.x; `tsconfig.json` adds `"types": ["node"]` — as `apps/sezzle-calculator/tsconfig.node.json` does — so `tsc` loads exactly one Node types version. `hono`, `@hono/node-server` and `zod` are declared as subtask-3 specifies but nothing in this slice imports them (`domain-purity.test.ts` would fail if the domain did).

## Criterion → test map

| Criterion | Test                                                                                                                                                                                                                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-6      | `src/operations/{add,subtract,multiply,divide,power,sqrt,percentage}.test.ts` — the pure functions at AC-6's values (`add(2, 3) = 5` … `percentage(15, 200) = 30`); `src/calculate.test.ts` › success through the registry — the same nine values reached by name                                         |
| AC-7      | `src/operations/divide.test.ts` › zero divisor → `CalculationError` `DIVISION_BY_ZERO` with `ERROR_MESSAGES.DIVISION_BY_ZERO`; `src/operations/sqrt.test.ts` › negative radicand → `NEGATIVE_SQRT`; `src/calculate.test.ts` › domain failures pass through unchanged (both, via `calculate`)              |
| AC-8      | `src/calculate.test.ts` › non-finite results — `power(10, 10000)`, `add(1e308, 1e308)` (→ `Infinity`), `power(-8, 0.5)` (→ `NaN`) all fail as `RESULT_NOT_FINITE`                                                                                                                                         |
| AC-9      | `src/operations/registry.test.ts` — one entry per contract operation, each the module's function; `src/domain-purity.test.ts` — every `.ts` under `src/` (sources and tests) imports only `@repo/contracts`, `vitest` or a relative sibling; shown to fail on an injected `import "node:http"` (cycle 11) |
| AC-17     | the verification command 12/12 with both new workspaces in scope, `npm run build` 1/1, `turbo run dev --dry-run` as recorded above; `apps/calc-service/package.json` has no `dev`/`start` script (doc; checked by reading)                                                                                |
| AC-18     | `apps/calc-service/README.md` — what it is / internal, never browser-facing / `npx turbo test --filter=calc-service` (doc; checked by reading)                                                                                                                                                            |

No `refactor:` entry on subtask-3, so none owed. Docs landed in-slice: the README (AC-18) and `AGENTS.md` (`CLAUDE.md` is a symlink to it) — §What this is, the tests sentence, a §Monorepo layout entry for `apps/calc-service`, and the ESLint consumers list.

## Cycles

1. RED `operations/add.test.ts` (no workspace can run it: 5 packages in scope) → GREEN scaffold `apps/calc-service` (package.json, tsconfig, eslint, vitest, README) + `add.ts` + `npm install` → 12/12, `calc-service` in scope.
2. RED `subtract.test.ts` → GREEN `subtract.ts`.
3. RED `multiply.test.ts` → GREEN `multiply.ts`.
4. RED `divide.test.ts` `divide(7, 2) = 3.5` → GREEN `divide.ts`.
5. RED zero divisor → `CalculationError` (module missing) → GREEN `calculation-error.ts` (`CalculationErrorCode` = the three domain codes; message from `ERROR_MESSAGES`), `divide` guards `y === 0`.
6. RED `power.test.ts` → GREEN `power.ts` (`x ** y`).
7. RED `sqrt.test.ts` (144, 0) → GREEN `sqrt.ts`.
8. RED negative radicand → GREEN `sqrt` guards `x < 0` with `NEGATIVE_SQRT`.
9. RED `percentage.test.ts` → GREEN `percentage.ts` `(x / 100) * y`.
10. RED `registry.test.ts` → GREEN `registry.ts`: `Readonly<Record<Operation, OperationFn>>`, `tsc` accepts the fixed-arity functions against `(...operands: number[]) => number`.
11. RED `calculate.test.ts` success table → GREEN `calculate.ts` lookup + spread. RED AC-8 non-finite table → GREEN `Number.isFinite` guard raising `RESULT_NOT_FINITE`. AC-7 pass-through table green on arrival (pin). `domain-purity.test.ts` green on arrival; proved red by injecting `import "node:http"` into `add.ts`, then reverted.
12. Prettier `--write` on four files (formatting only); docs: `AGENTS.md` parity. Final `--force` run 12/12, exit 0.
