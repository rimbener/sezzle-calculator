# subtask-4 — Entry wired to the UI, and `C`

- **slice:** 2 — entry
- **criteria:** AC-9, AC-10
- **status:** todo
- **paths:** `apps/sezzle-calculator/src/calculator/Calculator.tsx`, `apps/sezzle-calculator/src/calculator/display.ts`, `apps/sezzle-calculator/src/calculator/reducer.ts`, `apps/sezzle-calculator/src/calculator/reducer.test.ts`, `apps/sezzle-calculator/src/calculator/Calculator.test.tsx`

`Calculator` stops hard-wiring the display and drives the reducer with `useReducer`, dispatching one action per key press from the `keys.ts` model. `display.ts` is the projection: a pure function from state to the three `Display` slots — `value`, `expression`, `state` — so what the user sees is testable without rendering and the component stays a wiring layer.

`C` joins the reducer here for the one status this slice reaches: pressed while an operand is being entered it returns the initial state and emits nothing (AC-9). `C` from a result or an error arrives with those statuses in subtask-6 (AC-23), and `pending` swallowing it is that subtask's too (AC-18).

Tests are the first ones driven through the UI with React Testing Library and `user-event`, and AC-10 names exactly what they re-drive: digit entry, leading-zero absorption, the decimal point and its kept zeros, the silently ignored second point, the 15-character cap, and `C` — the rules of subtask-3 plus AC-9, holding when clicked rather than dispatched.
