# subtask-6 — Request emission, pending and outcomes

- **slice:** 3 — operations, requests and outcomes
- **criteria:** AC-17, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23
- **status:** todo
- **paths:** `apps/sezzle-calculator/src/calculator/state.ts`, `apps/sezzle-calculator/src/calculator/reducer.ts`, `apps/sezzle-calculator/src/calculator/display.ts`, `apps/sezzle-calculator/src/calculator/reducer.test.ts`, `apps/sezzle-calculator/src/calculator/display.test.ts`

The seam Phase 4 plugs into. `=` on a complete entry, and `sqrt` with no operation recorded, move the state to `pending` and put a **calculation request** on it — the operation name and its operands in entry order, typed by `@repo/contracts` and valid against its request schema. The reducer never calls anything; the request is a value on the state, which `Calculator` hands to its `onRequest` boundary in subtask-7 (`spec.md`, approach). Each operand is the entered string read as a finite number, a trailing bare decimal point dropped (`5.` is `5`), and an entry counts as complete once any key has appended to the second operand. Percentage sends `x` then `y` (XC-3).

`pending` is frozen: every action except an outcome is ignored, `C` included, so no second request can be emitted and no late outcome can land on an entry the user has moved past. Its readout is the emitted calculation, held still — the operand as it stood in the value slot, `12 + 5 =` (or `sqrt(9) =`) in the expression line, `Display` still `idle`. `Display`'s `busy` state is Phase 4's, with the busy indicator (`spec.md`, display contract), so this projection elects `idle` and `error` only.

Two outcome actions end it:

- a **result** carries a number: status `result`, the number in the value slot, the completed calculation in the expression line (`12 + 5 =`, `sqrt(9) =`);
- an **error** carries `@repo/contracts`' `{ error: { code, message } }`: status `error`, the Display in its error state, **the carried message in the value slot**, the failed calculation still in the expression line. This app defines no message string of its own — Phase 4 supplies the copy (`spec.md`, error contract).

A digit or a decimal point starts a fresh entry with an empty expression line from **either** ending, discarding the result or the failed calculation alike, and `C` resets from both. The two endings differ in what else is allowed:

- on a **result**, an operation key makes the result the first operand (`17`, `-` → `17 −`);
- on an **error**, the value slot holds a message rather than a number, so there is nothing to promote: an operation key, `=` and `sqrt` are silently refused, leaving the message and the failed calculation on screen and emitting no request (AC-23).

Tests drive the reducer through every transition, assert the emitted request parses against the contract's schema, drive `display.ts` for the pending and error projections, and assert that a pending state absorbs `C` and every other key unchanged and that an error absorbs every key but a digit, the point and `C`.
