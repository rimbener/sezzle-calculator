# subtask-5 — Operation keys, `=` gating and `sqrt`

- **slice:** 3 — operations, requests and outcomes
- **criteria:** AC-11, AC-12, AC-13, AC-14, AC-15, AC-16
- **status:** todo
- **paths:** `apps/sezzle-calculator/src/calculator/state.ts`, `apps/sezzle-calculator/src/calculator/reducer.ts`, `apps/sezzle-calculator/src/calculator/display.ts`, `apps/sezzle-calculator/src/calculator/reducer.test.ts`, `apps/sezzle-calculator/src/calculator/display.test.ts`

The operation half of the machine, still emitting nothing — this subtask decides only what is recorded and what is refused.

- An operation key pressed while **no operation is recorded yet** records the operation and commits the entered operand as the left one. The value slot keeps showing that operand; the expression line shows it with the operator glyph after it.
- An operation key pressed while one **is** recorded replaces only the operation, and never commits the entry again. Nothing is calculated, whether or not a second operand has been typed: `12`, `+`, `5`, `×` leaves `12 × 5` — the left operand is still `12`, not `5`.
- The replacement leaves the typed second operand as the entry in progress, so the next digit or point **appends** to it: `12`, `+`, `5`, `×`, `7` is `12 × 57` (AC-13). Nothing here starts a fresh operand.
- `=` is inert while the entry is incomplete — no operation recorded, or an operation with no second operand typed.
- `sqrt` is refused, silently and with the state unchanged, whenever an operation is recorded; when none is, it is the one key besides `=` that will emit (subtask-6).

Arity comes from `@repo/contracts`' `OPERAND_COUNT` — 1 for `sqrt`, 2 for the rest — never from a literal in this app, so an eighth operation needs no edit here.

`display.ts` gains the expression line's rendering: the glyphs `+`, `−`, `×`, `÷`, `^`, `sqrt(x)` for square root, and `12% of 50` for percentage so the line cannot be read as a modulo (`spec.md`, display contract).

Tests drive the reducer through each rule, and drive `display.ts` for each expression-line shape.
