# Acceptance criteria — p3-calculator-ui

Plain format. Each criterion is observable and owned by exactly one subtask ([`tmp/subtasks.md`](tmp/subtasks.md)). Behaviour and rationale: [`spec.md`](spec.md).

## Slice 1 — the calculator shell

- **AC-1** — `@repo/ui` exports a keypad component that arranges the `Key` children it is given into a grid, and the package's gallery (`design-system.tsx`) shows a section built from it. Its classes live in `packages/ui/src/styles/components.css`, use only design-system custom properties (no raw hex, no raw pixel size), and give the pad the standard hard border and offset shadow. It imports nothing from `@repo/contracts`.
- **AC-2** — The app renders a calculator: one display and keys for `0`–`9`, the decimal point, all seven operations (add, subtract, multiply, divide, power, sqrt, percentage), `=` and `C`. Every key is a native `<button>` with an accessible name. There is **no sign-toggle key**, the app no longer renders `<DesignSystem />` anywhere, and the scope docs agree: `docs/PRD-P0.md` no longer lists a sign toggle under FE-1, FE-3 or Open Question 5 and records OQ5 as settled by this bundle, and `docs/spec-phases.md` no longer lists it in Phase 3's scope.
- **AC-3** — Before any key is pressed the display's value reads `0` and its expression line is empty.

## Slice 2 — entry

- **AC-4** — Pressing digit keys builds the operand: `1` then `2` shows `12`.
- **AC-5** — A leading zero is absorbed. From the starting `0`, pressing `0` still shows `0`; pressing `5` next shows `5`, never `05` or `005`.
- **AC-6** — The decimal point works and keeps its zeros: `.` on the starting `0` shows `0.`, and `.`, `0`, `0`, `7` shows `0.007`.
- **AC-7** — A second decimal point in the same operand is ignored: the displayed value is unchanged and no request is emitted.
- **AC-8** — An operand is capped at 15 characters, counting the decimal point. The 16th character is ignored and the displayed value is unchanged.
- **AC-9** — `C` pressed while an operand is being entered returns the calculator to its starting state — value `0`, expression empty — and emits no request. (`C` from a result or an error is AC-23; `C` while a request is pending is AC-18.)
- **AC-10** — AC-4 through AC-9 — digit entry, leading-zero absorption, the decimal point and its kept zeros, the silently ignored second point, the 15-character cap, and `C` — all hold when driven through the rendered UI by clicking keys, not only by calling the machine directly.

## Slice 3 — operations, requests and outcomes

- **AC-11** — Pressing an operation key records it, leaves the entered operand in the value slot, and shows the calculation so far in the expression line: `12`, `+` gives value `12` and expression `12 +`.
- **AC-12** — A second operation key **replaces** the recorded one and calculates nothing: `12`, `+`, `5`, `×` emits no request and leaves expression `12 ×` with `5` still in the value slot; `=` pressed then evaluates `12 × 5`. Pressing an operation key immediately after another one also just replaces it.
- **AC-13** — After such a replacement the retained second operand is still the entry in progress, so a digit appends to it: `12`, `+`, `5`, `×`, `7` shows value `57` with expression `12 ×`, and `=` then evaluates `12 × 57`.
- **AC-14** — `=` does nothing and emits no request while the entry is incomplete — no operation recorded, or an operation whose second operand has had no key appended to it. An operand ending in a bare decimal point (`5.`) counts as complete. The display is unchanged.
- **AC-15** — `sqrt` emits its request the moment the key is pressed, carrying the displayed operand as its single operand, when no operation is recorded.
- **AC-16** — `sqrt` pressed while an operation **is** recorded is ignored: no request, no state change, display unchanged.
- **AC-17** — `=` on a complete two-operand entry emits exactly one request naming the operation and its operands in entry order, each operand the entered string read as a finite number with a trailing bare decimal point dropped (`5.` sends `5`), shaped by `@repo/contracts` and valid against its request schema. Percentage sends `x` then `y`, matching XC-3's "x% of y".
- **AC-18** — While a request is pending, every key is ignored — `C` included. No state changes, no second request is emitted, and the readout stays exactly as emitting the request left it: the operand that was entered in the value slot, the calculation with `=` in the expression line (`12 + 5 =`, `sqrt(9) =`), the display in its `idle` state.
- **AC-19** — A result outcome puts the returned number in the value slot and the completed calculation in the expression line: `12 + 5 =`, and `sqrt(9) =` for a square root.
- **AC-20** — An operation key pressed on a result makes that result the first operand: with `17` shown, `-` gives value `17` and expression `17 −`.
- **AC-21** — A digit or decimal point pressed on a result starts a fresh entry: with `17` shown, `3` gives value `3` and an empty expression line. This holds identically for a `sqrt` result.
- **AC-22** — An error outcome puts the display in its error state, shows the message the outcome carried in the value slot, and leaves the expression line showing the calculation that failed. No message string is defined by this phase's own code.
- **AC-23** — Recovery from an error, and `C` from either ending: a digit **or the decimal point** pressed while an error is displayed starts a fresh entry, clearing the error state and the expression line; an operation key, `=` and `sqrt` pressed while an error is displayed are silently ignored, leaving the message and the failed calculation on screen and emitting no request; `C` pressed on a result or on an error returns the calculator to its starting state.
- **AC-24** — The frontend computes nothing. Every number the display shows is either characters the user typed or a value handed in by an outcome; no source file under `apps/sezzle-calculator` or `packages/ui` performs arithmetic on operands or calls `fetch`.
- **AC-25** — Root `lint`, `check-types`, `test` and `build` all pass with the calculator in place, and a full sequence driven through the rendered UI — digits, an operation, digits, `=` — calls the calculator's request boundary exactly once, with the request for that calculation, and leaves the readout in the pending shape AC-18 describes.
