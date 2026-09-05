# subtask-3 — `apps/calc-service` workspace, pure operations, registry and README

- **slice:** 2 — the calculation domain
- **criteria:** AC-6, AC-7, AC-8, AC-9, AC-17, AC-18
- **status:** todo
- **paths:** `apps/calc-service/package.json`, `apps/calc-service/tsconfig.json`, `apps/calc-service/eslint.config.mjs`, `apps/calc-service/vitest.config.ts`, `apps/calc-service/README.md`, `apps/calc-service/src/operations/*.ts`, `apps/calc-service/src/operations/registry.ts`, `apps/calc-service/src/calculation-error.ts`, `apps/calc-service/src/calculate.ts`, `apps/calc-service/src/**/*.test.ts`, `package-lock.json`

The workspace: private, `"type": "module"`, depending on `@repo/contracts`, `hono`, `@hono/node-server` and `zod`; dev dependencies `@repo/eslint-config`, `@repo/typescript-config`, `@types/node`, `eslint`, `typescript`, `vitest`. Scripts, matching the existing workspaces: `lint`, `check-types`, `test` (`vitest run --passWithNoTests`). **No `dev` or `start` script yet** — those name `src/server.ts`, which subtask-5 supplies, and a root `turbo run dev` would otherwise fan out to a script whose entry file does not exist (AC-17). Vitest runs in the `node` environment. Tsconfig shape as in subtask-1.

The domain, with no HTTP anywhere in it (AC-9):

- one module per operation under `src/operations/`, each a pure function over numbers;
- `registry.ts`, mapping an operation name from `@repo/contracts` to its function, so reaching an operation is a lookup and adding one is a module plus an entry;
- `calculation-error.ts`, the typed failure carrying one of the contract's error codes — the domain's only way to say "this cannot be computed";
- `calculate.ts`, which looks the function up, runs it, and turns a non-finite result into `RESULT_NOT_FINITE` (AC-8) so no individual operation has to.

`divide` raises `DIVISION_BY_ZERO` on a zero divisor and `sqrt` raises `NEGATIVE_SQRT` on a negative input (AC-7). Tests cover every operation across normal, zero, negative and decimal values (AC-6) and every domain failure, and import no HTTP or server module (AC-9).

The README (AC-18) lands with the workspace: what the service is, that it is internal and never browser-facing, and the one command that runs its tests (BE-11's documented command). Subtask-5 extends the same file with the run command, the port variable, the `curl` example and the percentage formula (AC-16).

AC-17 is this subtask's repo-wide gate: with a second new workspace in the fan-out, root `lint`, `check-types`, `test` and `build` still pass and root `dev` starts cleanly.
