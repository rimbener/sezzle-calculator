# shrink-comments — p4-calculator-api-client

Scope: `git diff --name-only main HEAD`. Comments rewritten by this run in three files; all other in-scope files (README.md, App.tsx, App.test.tsx, client.test.ts, useCalculate.test.ts, Calculator.test.tsx, display.ts, display.test.ts, frontend-purity.test.ts) read and left as their comments were already the rule plus its exceptions in one line.

- apps/sezzle-calculator/src/api/client.ts: 21 -> 15 lines
- apps/sezzle-calculator/src/api/useCalculate.ts: 1 -> 1 lines
- apps/sezzle-calculator/src/scope-docs.test.ts: 2 -> 2 lines

Total: 24 -> 18 lines. Deleted: one two-line comment restating `classify`'s doc and the `catch` below it. History and asides cut ("decided in the spec interview", "now", "the services' config-resolver pattern, client-side"). Code fingerprints identical before/after (TypeScript-parser strip); gate `npx turbo run lint check-types test --output-logs=errors-only` passed.
