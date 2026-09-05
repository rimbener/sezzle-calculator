# tdd-3 — slice 3, operations, requests and outcomes (subtasks 5, 6 and 7)

Verification: `npx turbo run lint check-types test --output-logs=errors-only` — 12/12 tasks, exit 0, run from the worktree root after every cycle (the three `sezzle-calculator` tasks re-ran on each change; the other nine hit the cache). `sezzle-calculator` suites: `App.test.tsx`, `scope-docs.test.ts`, `frontend-purity.test.ts` (new), `calculator/{Calculator.test.tsx,display.test.ts,keys.test.ts,reducer.test.ts}`. Diff base: `afe5e56`, slice 2's closing commit. `build` (AC-25's fourth gate, this build invocation's `Commands:` left it out): `npx turbo run build --output-logs=errors-only` run in the fix step for review-slice-3 F-1 — 1/1 tasks (`sezzle-calculator`, the only workspace with a `build` script), exit 0, nothing surfaced.

## Criteria → tests

| Criterion | Test |
| --- | --- |
| AC-11 operation key records; value keeps `12`, expression `12 +` | `calculator/reducer.test.ts` › an operation key records the operation; › the second operand (two tests: digit and point open the right operand); `calculator/display.test.ts` › a recorded operation shows in the expression line (`it.each` over the six binary glyphs, `12% of` included) |
| AC-12 second operation key replaces, calculates nothing | **pin** — reducer.test.ts › a second operation key replaces… › two tests (`12 × 5` keeps operands; op immediately after op); `=` then evaluates `12 × 5` in › = on a complete entry › evaluates the replaced operation |
| AC-13 retained second operand still live | **pin** — reducer.test.ts › the retained second operand… › two tests (`57`, `5.`); `=` then evaluates `12 × 57` (same AC-17 test) |
| AC-14 `=` inert while incomplete; `5.` complete | reducer.test.ts › = is inert while the entry is incomplete › two tests; `5.` counted complete in › = on a complete entry › reads a trailing bare decimal point |
| AC-15 `sqrt` emits on the press with the displayed operand | reducer.test.ts › sqrt emits on the press… (state shape, and `calculateRequestSchema.safeParse` succeeds) |
| AC-16 `sqrt` refused while an operation is recorded | reducer.test.ts › sqrt is refused while an operation is recorded (with and without a second operand, `toBe`) |
| AC-17 `=` emits one contract-valid request, entry order, `5.` → `5`, percentage `x` then `y` | reducer.test.ts › = on a complete entry emits the request › four tests |
| AC-18 pending frozen, `C` included; readout held | **pin** — reducer.test.ts › pending is frozen (`it.each` over digit, point, operation, sqrt, equals, clear; `toBe`); display.test.ts › pending holds the emitted calculation still (`12 + 5 =`, `sqrt(9) =`, `12% of 50 =`, `idle`); through the UI: `Calculator.test.tsx` › pending is frozen through the UI (six keys ignored, boundary called once) |
| AC-19 result outcome | reducer.test.ts › a result outcome; display.test.ts › a result › two tests (`17` over `12 + 5 =`, `3` over `sqrt(9) =`; `1 / 3` rendered as JavaScript does); Calculator.test.tsx › shows a result outcome |
| AC-20 operation key on a result promotes it | reducer.test.ts › an operation key on a result… › two tests (`17 −`; sqrt fires on `17`) |
| AC-21 digit/point on a result starts fresh, sqrt result too | reducer.test.ts › a digit or point on a result starts a fresh entry › two tests |
| AC-22 error outcome: error state, carried message, failed calculation | reducer.test.ts › an error outcome; display.test.ts › an error; Calculator.test.tsx › shows an error outcome (`sc-display--error`, message in the value slot) |
| AC-23 error recovery; `C` from either ending | reducer.test.ts › recovery from an error… › digit/point fresh; `it.each` refuses add, sqrt, equals (`toBe`); `C` from result and error → `INITIAL_STATE` |
| AC-24 no arithmetic, no `fetch` | **pin** — `frontend-purity.test.ts` › the frontend computes nothing: scans every non-test `.ts`/`.tsx` under `apps/sezzle-calculator/src` and `packages/ui/src` for `fetch(`, `XMLHttpRequest`, `WebSocket`, `Math.`, `eval(`, `parseFloat(`, `parseInt(`; `Number(` confined to `calculator/reducer.ts` |
| AC-25 end to end: digits, operation, digits, `=` → boundary called once, pending readout | Calculator.test.tsx › a calculation driven end to end through the UI; lint/check-types/test and build in the verification line |
| review-slice-2 note — AC-7 and AC-9 "emits no request" re-driven with the stub | **pin** — Calculator.test.tsx › entry refusals and C emit no request |
| docs — README says what the calculator does today and that `=` is a dead end until Phase 4 | `scope-docs.test.ts` › the app README… › states the operation rules (replaces, sqrt, pending, no "not wired"); › says `=` is a dead end until the API client lands, through the onRequest boundary |

No subtask in this slice carries a `refactor:` entry.

## Cycles

1. RED reducer `1`,`2`,`+` → `{ operands: ['12'], operation: 'add' }` (type error: no `operation` action) → GREEN `state.ts`: `Entering { operands: readonly string[], operation? }` replaces `operand`; `operation` action; existing tests moved from `.operand` to `operands`.
2. RED display `it.each` six binary glyphs → `12 +` … `12% of`, value `12` → GREEN `display.ts` `RENDER` table (`infix`, `sqrt(x)`, `x% of y`), entering expression renders the committed first operand only.
3. RED `1`,`2`,`+`,`5` → `['12','5']`; `+`,`.` → `['12','0.']` (was `['125']`) → GREEN `awaitingOperand` (recorded and `operands.length < OPERAND_COUNT[op]`) opens the next operand from `0`; `Edit` functions `digitKey`/`pointKey`, `type()` applies them.
4. PIN AC-12 (replace keeps `['12','5']`; op after op) and AC-13 (`57`, `5.`) — green on first run.
5. RED `equals` on no operation / on no second operand → `toBe(before)` (type error: no `equals` action) → GREEN `equals` action returning state; `actionFor` now total, `Calculator.tsx` drops its `if (action)` guard and `press` wrapper (refactor on green).
6. RED `sqrt` on a recorded operation → `toBe` (was replacing it) → GREEN unary (`OPERAND_COUNT === 1`) with an operation recorded returns state.
7. RED `9`,`sqrt` → `pending` with `calculation { sqrt, ['9'] }`, `request { sqrt, [9] }`, schema-valid → GREEN `Calculation`, `Pending` in `state.ts`; `emit`, `toNumber` (`Number(text)`) in the reducer; non-entering states return state; `toDisplay` switches on status with a placeholder pending expression. Test helper `operands()` narrows the union.
8. RED display pending `it.each` (`5` / `12 + 5 =`; `9` / `sqrt(9) =`; `50` / `12% of 50 =`) → GREEN `emitted()` renders the calculation with ` =`.
9. RED `=` on `12 + 5` emits `{ add, [12, 5] }` schema-valid; `5.` sends `5`; percentage `[12, 50]`; `12 × 5` and `12 × 57` after a replacement → GREEN `complete()` guard (arity from `OPERAND_COUNT`), `equals` emits.
10. PIN pending absorbs digit, point, operation, sqrt, equals, clear (`toBe`) — green on first run.
11. RED `outcome { result: 17 }` on pending → `{ status: 'result', calculation, value: 17 }` → GREEN `CalculationOutcome = CalculateResponse | ErrorResponse`, `Result` state, `outcome` action, `settle` (result half); placeholder result projection.
12. RED display result `17` / `12 + 5 =`, `3` / `sqrt(9) =`, `1 / 3` as `0.3333333333333333` → GREEN result branch uses `emitted()`.
13. RED `−` on result → `{ operands: ['17'], operation: 'subtract' }`; `sqrt` on result → pending `[17]` → GREEN reducer split into `enter()` per action and a status switch; `promoted(value)` = `String(value)` as the first operand.
14. RED `3` / `.` on a result → fresh entry; sqrt result identically → GREEN result: digit/point → `enter(INITIAL_STATE, action)`; `INITIAL_STATE` typed `Entering`.
15. RED error outcome → `{ status: 'error', calculation, message }` → GREEN `Failed` state, `settle` error half, placeholder error projection.
16. RED display error → message in value, `12 ÷ 0 =`, `state: 'error'` → GREEN error branch.
17. RED error + digit/point fresh; error + add/sqrt/equals `toBe`; `C` from result and error → `INITIAL_STATE` → GREEN `settled(state: Result | Failed, action)` shared by both endings; `reducer` = `enter` / `settle` / `settled`. Refactor on green: `type()` → `build()`. Subtasks 5 and 6 done.
18. RED `<Calculator onRequest={stub} />`, `1`,`2`,`Add`,`5`,`Equals` → stub called once with `{ add, [12, 5] }`, readout `5` / `12 + 5 =` (type error: no prop) → GREEN `CalculatorProps.onRequest`; effect on the pending request calls it once per request (a `useRef` of the last request sent keeps StrictMode's dev-only effect replay from sending twice).
19. RED stub resolving `{ result: 17 }` → readout `17` / `12 + 5 =` → GREEN the effect dispatches the resolved outcome.
20. PIN error outcome through the UI (`sc-display--error`, carried message), AC-18 through the UI (six keys ignored while pending, stub once), AC-7/AC-9 emit no request — all green on first run. Test infra: `unanswered()` stub, `displayState()` helper.
21. PIN `frontend-purity.test.ts` (AC-24 scan, green on first run). RED `scope-docs` README: operation rules stated, no "not wired", `=` a dead end until the API client with `onRequest` named → GREEN `apps/sezzle-calculator/README.md` rewritten: operation rules, pending and outcomes, the dead-end paragraph, `src/calculator/` layout with all four statuses reachable and the `onRequest` effect, the test suite. `npx turbo run lint check-types test --output-logs=errors-only` exit 0, 12/12. Subtask 7 done.
22. **Fix step (review-slice-3 F-1).** AC-25's `build` gate run: `npx turbo run build --output-logs=errors-only` exit 0, 1/1 — no production change demanded; the gate is recorded in the verification line. `npx turbo run lint check-types test --output-logs=errors-only` exit 0, 12/12. Slice committed.

closing-commit: d42252f
