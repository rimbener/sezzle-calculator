# shrink-comments — p3-calculator-ui

Wording only: every file's code fingerprint (TypeScript parser, comments and
blank lines removed) is identical before and after. Gate
`npx turbo run lint check-types test --output-logs=errors-only` passes.

- `apps/sezzle-calculator/src/calculator/Calculator.tsx`: 41 -> 40 lines — `onRequest` doc cut to the seam and the never-rejects rule.
- `apps/sezzle-calculator/src/calculator/display.ts`: 49 -> 49 lines — dropped `spec.md` section pointers; "pure projection" shortened.
- `apps/sezzle-calculator/src/calculator/reducer.ts`: 127 -> 127 lines — `awaitingOperand`, `complete`, `emit` and `reducer` docs tightened.
- `apps/sezzle-calculator/src/calculator/state.ts`: 51 -> 51 lines — `Entering` doc no longer restates its field docs; `CalculationOutcome` shortened.
- `apps/sezzle-calculator/src/frontend-purity.test.ts`: 37 -> 37 lines — AC-24 header reworded.
- `apps/sezzle-calculator/src/scope-docs.test.ts`: 118 -> 113 lines — dropped the review-round history ("review-slice-1 F-1", "Slice 3", "review F-1"); kept each pin's why.
- `apps/sezzle-calculator/src/calculator/Calculator.test.tsx`: 186 -> 186 lines — helper docs shortened; "three readout slots" corrected to the two the helper returns.

Read and left as is: `keys.ts`, `App.css`, both `test/setup.ts`, `keypad.tsx`,
`keypad.test.tsx`, `reducer.test.ts`, `display.test.ts`, `keys.test.ts`,
`App.test.tsx`, `components.css` (the `---- Keypad ----` heading is a test anchor),
`design-system.tsx`, `index.ts`, and the JSON configs.

Total: 609 -> 603 lines across 7 files.
