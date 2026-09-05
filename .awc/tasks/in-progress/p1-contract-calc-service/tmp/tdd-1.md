# tdd-1 — slice 1, the contract

Verification: `npx turbo run lint check-types test --output-logs=errors-only` — 9/9 tasks, 57 tests in 5 files at the slice's end; 59 tests in 5 files (uncached, `--force`) at the end of the fix step. `npm run build` (AC-5's fourth leg, run in the fix step for F-1): 1/1 task, `sezzle-calculator:build` emits `dist/`; the second run is `1 cached, FULL TURBO`, so the `dist/**` outputs cache — the `refactor:` `preserves:` clause holds.

## Pre-existing blocker repaired first

At HEAD (`240d074 fix: node version`) the verification command could not run at all: Turborepo 2.10 refuses to resolve the workspace without `devEngines.packageManager` (or `packageManager`) in the root `package.json`, and that commit removed the block. Restored it as `{ "name": "npm", "version": "^11.0.0", "onFail": "warn" }` — Turbo demands a single-major version, `^11` is the npm stock Node 24 ships (matching `engines.node`), and `onFail: warn` means npm never hard-fails an install on it the way the removed `10.9.4` pin did. Baseline was green (6/6) after this and before any slice work. Outside the slice's listed paths; flagged for the reviewer (F-2). Cycle 9 showed the other mechanism (`dangerouslyDisablePackageManagerCheck`) does not work on Turbo 2.10.12; the human ratified the block as it sits ("ratify ^11.0.0"), `AGENTS.md` § Commands carries the rationale, `spec.md` § Surfaces touched lists the file, and cycle 11 pins the block in `turbo-tasks.test.ts`.

## Criterion → test map

| Criterion | Test |
| --- | --- |
| AC-1 | `src/calculate.test.ts` › well-formed requests: each of the seven at its own arity; zero, negatives, decimals, zero and negative radicands accepted |
| AC-2 | `src/calculate.test.ts` › malformed operation (`unknown operation '<verbatim>'`); operation absent/null/non-string and non-object bodies (the listing sentence); malformed operands (wrong count, absent, non-numeric, null, NaN, ±Infinity, non-array; real arity per operation; singular noun for `sqrt`); operation validated before operands |
| AC-3 | `src/operations.test.ts` (seven names, `OPERAND_COUNT`); `src/errors.test.ts` (five codes and `ErrorCode` union, `ERROR_MESSAGES`, `INVALID_JSON_MESSAGE`, `OPERATION_REQUIRED_MESSAGE`, `CalculateResponse` / `ErrorResponse` shapes via `expectTypeOf`); `src/index.test.ts` (the barrel exports the whole contract) |
| AC-4 | `packages/contracts/README.md` — what it holds / consumed as source, no build step / `npx turbo test --filter=@repo/contracts` (doc; checked by reading) |
| AC-5 | the verification command with `@repo/contracts` in scope, 9/9, and `npm run build` 1/1 from the root; root `README.md` unchanged (`git status` clean on it); `apps/sezzle-calculator` and `packages/ui` `package.json` name no `@repo/contracts`, calc-service or gateway |
| refactor:subtask-1 → test | `src/turbo-tasks.test.ts` — characterizes the five root tasks, `build.dependsOn`/`inputs`, `lint`/`check-types` fan-out, `test`/`dev` shape; written and green before the `build.outputs` move, green after it |
| F-2 (review-slice-1) → test | `src/turbo-tasks.test.ts` › root package.json package-manager declaration — pins `devEngines.packageManager` `{ npm, ^11.0.0, onFail: warn }` and the absence of a Corepack `packageManager` field; characterization of the ratified decision, green on arrival |

## Cycles

1. RED `turbo-tasks.test.ts` (no workspace can run it) → GREEN scaffold `packages/contracts` (package.json, tsconfig, eslint, vitest, empty barrel, README) + `npm install` → 9/9, 4 tests. REFACTOR `turbo.json` `build.outputs` `.next/**` → `dist/**`; pin green.
2. RED `operations.test.ts` (module missing) → GREEN `operations.ts`: `OPERATIONS` tuple, `Operation`, `OPERAND_COUNT`.
3. RED `calculate.test.ts` AC-1 (module missing) → GREEN `calculate.ts`: `z.enum(OPERATIONS)` + `z.unknown()` operands, transform checks `z.array(z.number()).length(OPERAND_COUNT[op])`.
4. RED unknown-operation sentence → GREEN `messages.ts` `unknownOperationMessage`, wired as the enum's `error` map when `issue.input` is a string.
5. RED absent/null/non-string operation and non-object bodies → GREEN `OPERATION_REQUIRED_MESSAGE`, enum `error` fallback, `z.object(..., { error })` for non-object input.
6. RED operand sentences (arity, noun, every fault kind) → GREEN `operandsMessage`; absent `operands` needed `z.unknown().optional()` because Zod 4 treats a bare `z.unknown()` shape entry as a required key.
7. Precedence tests (wrong in both ways → operation's sentence) — green on arrival; the transform runs only once the operation parsed.
8. RED `errors.test.ts` + `index.test.ts` (modules/exports missing) → GREEN `errors.ts` (`ERROR_CODES`, `ErrorCode`, `ErrorResponse`), `ERROR_MESSAGES`, `INVALID_JSON_MESSAGE`, `CalculateResponse`, barrel filled. REFACTOR: none owed (subtask-2 has no `refactor:` entry).
9. Fix step, F-2: RED `turbo-tasks.test.ts` pinning `dangerouslyDisablePackageManagerCheck: true` + no root pin → GREEN attempt: key added, block removed → `turbo run` finds no workspaces (root-only graph, `recursive_turbo_invocations`; `turbo ls` alone infers npm from the lockfile). Mechanism unusable on 2.10.12; test and key reverted, block restored. F-2 stays open for the human.
10. Fix step, F-1 + F-3: `npm run build` run and recorded (no code); `CLAUDE.md` brought level with the tree (docs only).
11. Fix step, F-2 ratified by the human (`^11.0.0`, `onFail: warn`): pin added to `turbo-tasks.test.ts` (block + no Corepack field), green on arrival; `spec.md` § Surfaces touched gains the root `package.json` row; F-2 marked resolved. No production change.

closing-commit: c868309
