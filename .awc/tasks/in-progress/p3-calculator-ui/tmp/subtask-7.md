# subtask-7 — The full machine behind the UI

- **slice:** 3 — operations, requests and outcomes
- **criteria:** AC-24, AC-25
- **status:** todo
- **paths:** `apps/sezzle-calculator/src/calculator/Calculator.tsx`, `apps/sezzle-calculator/src/calculator/Calculator.test.tsx`, `apps/sezzle-calculator/README.md`

`Calculator` wires the operation keys, `=` and `sqrt` to the reducer and projects the result, error and pending states onto `Display` — pending as the frozen readout of `spec.md`'s display contract, with `Display` still `idle`.

The boundary Phase 4 plugs into is one optional prop, `onRequest?: (request: CalculationRequest) => Promise<CalculationOutcome>` (`spec.md`, approach). When the reducer moves to `pending` carrying a new request, an effect calls `onRequest` once with it and dispatches whatever it resolves with — a result, or the contract's `{ error: { code, message } }` — as the outcome action; it never rejects. `App.tsx` passes no `onRequest` in this phase, so pressing `=` in the running app leaves the calculator frozen in `pending` until the page is reloaded (`spec.md`, non-goals). Phase 4 supplies the prop from its hook and rewrites nothing below it.

The app's README — this slice's docs, not a trailing docs subtask — says what the calculator does today, that `=` is a dead end until the API client lands, and how to run the tests.

AC-24 is the phase's guard rail, and it is checkable: no source file under `apps/sezzle-calculator` or `packages/ui` performs arithmetic on operands or calls `fetch`, and every number the display shows is either the user's own characters or a value handed in by an outcome.

AC-25 is the closing gate: root `lint`, `check-types`, `test` and `build` all pass, and one end-to-end UI test renders `Calculator` with a stub `onRequest`, clicks digits, an operation, digits and `=`, and asserts the stub was called exactly once with that calculation's request while the readout holds the pending shape.
