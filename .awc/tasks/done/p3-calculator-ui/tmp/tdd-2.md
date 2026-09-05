# tdd-2 — slice 2, entry (subtasks 3 and 4)

Verification: `npx turbo run lint check-types test --output-logs=errors-only` — 12/12 tasks, exit 0 (the three `sezzle-calculator` tasks re-ran on the changed inputs; the other nine hit the cache). `sezzle-calculator` runs 33 tests in 6 files (`App.test.tsx` 3, `calculator/Calculator.test.tsx` 10, `calculator/display.test.ts` 2, `calculator/keys.test.ts` 1, `calculator/reducer.test.ts` 8, `scope-docs.test.ts` 9). Diff base: `1262dde`, slice 1's closing commit. `build` is not in this invocation's `Commands:` and was not run.

## Criteria → tests

| Criterion | Test |
| --- | --- |
| AC-4 digits build the operand: `1`,`2` → `12` | `apps/sezzle-calculator/src/calculator/reducer.test.ts` › digit entry › appends digits to the operand being entered |
| AC-5 leading zero absorbed: `0` stays `0`; `0`,`0`,`5` → `5` | **pin** — reducer.test.ts › leading zero absorbed › keeps 0 on 0 and never shows 05 or 005 (passed on first run: AC-4's "a digit replaces the starting `0`" already absorbs a repeated zero) |
| AC-6 `.` on `0` → `0.`; `.`,`0`,`0`,`7` → `0.007` | reducer.test.ts › the decimal point keeps its zeros |
| AC-7 second point ignored, state unchanged | reducer.test.ts › a second decimal point is ignored › returns the state unchanged (asserts reference equality) |
| AC-8 15 characters counting the point; 16th ignored | reducer.test.ts › 15 characters, point included › three tests: 16th digit, 16th point, cap reached with a point inside (`1.2345678901234`) |
| AC-8 docs half — FE-3 and Phase 3 state the cap in characters, not "significant digits" | `scope-docs.test.ts` › scope docs state the operand cap as the machine enforces it › two tests over `docs/PRD-P0.md` and `docs/spec-phases.md` |
| AC-9 `C` while entering → starting state | reducer.test.ts › C while entering › returns the calculator to its starting state |
| display projection — `entering` → `{ value: operand, expression: '', state: 'idle' }` | `calculator/display.test.ts` › two tests (starting state; operand as typed) |
| AC-10 digit entry through the UI | `calculator/Calculator.test.tsx` › entry driven through the UI › builds the operand from clicked digits |
| AC-10 leading zero through the UI | **pin** — Calculator.test.tsx › absorbs a leading zero (passed on first run, on the wiring cycle 7 landed) |
| AC-10 point and its zeros through the UI | **pin** — Calculator.test.tsx › keeps the zeros after the decimal point |
| AC-10 second point through the UI | **pin** — Calculator.test.tsx › silently ignores a second decimal point |
| AC-10 15-character cap through the UI | **pin** — Calculator.test.tsx › stops the operand at 15 characters, the point included |
| AC-10 `C` through the UI | Calculator.test.tsx › C returns the calculator to its starting state while an operand is being entered |
| review-slice-2 F-1 — the app README states what the calculator does today, not the Vite template | `scope-docs.test.ts` › the app README describes what the calculator does today › three tests (template gone; entry rules stated; operation, `√` and `=` keys named as not wired yet) |

No subtask in this slice carries a `refactor:` entry.

## Cycles

1. RED reducer `1`,`2` → operand `12` (module missing; then `012`) → GREEN `state.ts` (`Status` with the four statuses, `CalculatorState { status, operand }`, `INITIAL_STATE`), `reducer.ts` with a `digit` action; a digit replaces the starting `0`.
2. PIN `0` on `0` stays `0`; `0`,`0`,`5` → `5` — green on first run.
3. RED `.` → `0.`, `.`,`0`,`0`,`7` → `0.007` → GREEN `point` action appends `.`.
4. RED second point returns the same state object → GREEN `includes('.')` guard.
5. RED 16th digit / 16th point / cap with a point inside → GREEN `OPERAND_MAX_LENGTH = 15`, `full()` guard on both appends. Verification command 12/12 → subtask 3 done.
6. RED `toDisplay` (module missing) → GREEN `display.ts`: `Readout { value, expression, state }`, `entering` projects `{ operand, '', 'idle' }`.
7. RED clicking `1`,`2` leaves the readout at `0` → GREEN `Calculator` drives `useReducer(reducer, INITIAL_STATE)`, `toDisplay(state)` feeds `Display`, each `Key`'s `onPress` dispatches `actionFor(key)` — `undefined` for a kind the machine does not handle yet (operation, equals), so those keys stay inert. Test infra: `press(...names)` helper over `user-event` in `Calculator.test.tsx`. Refactor on green: `press` typed with `CalculatorKey` instead of `(typeof KEYS)[number]`.
8. RED reducer `clear` → `INITIAL_STATE` → GREEN `clear` action.
9. RED `C` clicked leaves `1.5` on the readout → GREEN `clear` case in `actionFor`. PIN the four remaining AC-10 re-drives (leading zero, point zeros, second point, cap) — all green on first run.
10. RED `scope-docs` two tests: FE-3 says "15 significant digits", Phase 3 says "15-significant-digit cap" → GREEN `docs/PRD-P0.md` FE-3 "an operand capped at 15 characters, the decimal point included"; `docs/spec-phases.md` Phase 3 "15-character cap with the decimal point counted". Wording only. `npx turbo run lint check-types test --output-logs=errors-only` exit 0, 12/12.
11. **Fix step (review-slice-2 F-1).** RED three `scope-docs` tests over `apps/sezzle-calculator/README.md` (still the Vite template) → GREEN the README rewritten: running the app, the entry rules of slice 2, the operation, `√` and `=` keys rendered but not wired yet, the `src/calculator/` layout, the test suite. `npx turbo run lint check-types test --output-logs=errors-only` exit 0, 12/12. Slice committed.

closing-commit: afe5e56
