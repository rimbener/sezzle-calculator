# shrink-comments — p1-contract-calc-service

Base: `main`. Scope: the comments added in `git diff main HEAD`. Code fingerprints
(TypeScript scanner, comments stripped, blank lines dropped) are identical before
and after every rewrite. Gate `npx turbo run lint check-types test
--output-logs=errors-only` passed.

## Rewritten

- apps/calc-service/src/app.ts: 80 -> 79 lines
- apps/calc-service/src/calculate.ts: 20 -> 19 lines
- apps/calc-service/src/calculation-error.ts: 21 -> 18 lines
- apps/calc-service/src/config.ts: 12 -> 12 lines
- apps/calc-service/src/domain-purity.test.ts: 45 -> 44 lines
- apps/calc-service/src/operations/registry.ts: 26 -> 23 lines
- apps/calc-service/src/server.ts: 40 -> 37 lines
- packages/contracts/src/calculate.ts: 46 -> 45 lines
- packages/contracts/src/messages.ts: 31 -> 31 lines
- packages/contracts/src/turbo-tasks.test.ts: 47 -> 46 lines

Total: 368 -> 354 lines (-14). Comment text shrank further than the line count
shows: several single-line comments lost half their words without changing the
count. Cut: restated behaviour, run history ("subtask-1", "review-slice-1 F-2"),
and asides about how to add an operation.

## Read, nothing to cut

- apps/calc-service/src/app.test.ts, server.test.ts, operations/*.ts and their
  tests, packages/contracts/src/errors.ts, operations.ts, calculate.test.ts,
  both eslint.config.mjs, apps/sezzle-calculator/vite.config.ts: one short
  comment each or none.
- spec-to-code.sh, workflows/**/scripts/*.sh, workflows/**/*.yaml: workflow
  tooling copied into the repo; comments carry caller contracts and are
  already tight.
