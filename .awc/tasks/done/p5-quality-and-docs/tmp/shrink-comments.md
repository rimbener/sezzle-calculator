# shrink-comments — p5-quality-and-docs

- apps/sezzle-calculator/src/calculator/display-fit.test.ts: 4 -> 1
- apps/sezzle-calculator/src/docs-fe12-strike.test.ts: 6 -> 3
- apps/sezzle-calculator/src/no-a11y-tooling.test.ts: 2 -> 1
- apps/sezzle-calculator/src/scope-docs.test.ts: 2 -> 1
- packages/ui/src/display.tsx: 7 -> 5
- packages/ui/src/styles/components.css: 4 -> 3

Total: 25 -> 14 comment lines. Fingerprints (comments stripped, blanks dropped, TypeScript parser / string-aware CSS scanner) matched before and after; gate `npx turbo run lint check-types test --output-logs=errors-only` passed after the rewrite.

Read, nothing to cut: apps/sezzle-calculator/src/App.test.tsx (its one added line names the arithmetic it sits on), packages/ui/src/display.test.tsx (the one-liner carries the 59 derivation), packages/ui/src/callout.test.tsx (no comments), apps/sezzle-calculator/turbo.json (JSON, no comments), the two typography.css copies (token line only). Markdown files in scope are prose, not comments — left alone.
