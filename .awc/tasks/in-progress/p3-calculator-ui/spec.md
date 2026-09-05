# Spec — p3-calculator-ui

Calculator UI and input state machine. Covers `FE-1`, `FE-3`, the UI half of `FE-8`, and settles PRD-P0 Open Question 5 — Phase 3 of `docs/spec-phases.md`.

Problem and observable success: [`tmp/user-story.md`](tmp/user-story.md). Verifiable behaviours: [`acceptance-criteria.md`](acceptance-criteria.md). Work breakdown: [`tmp/subtasks.md`](tmp/subtasks.md). The decisions below were taken with the human in [`tmp/spec-interview-log.md`](tmp/spec-interview-log.md) and [`tmp/story-interview-log.md`](tmp/story-interview-log.md).

## Summary

Build the calculator the SPA has never had: a keypad grid in the design system, and in the app a display plus a pure state machine that turns key presses into a calculation request and accepts a result or error outcome handed back to it. No arithmetic and no network anywhere — the machine emits requests and consumes outcomes, and Phase 4 supplies what goes in between.

## Surfaces touched

| Surface | Change |
| --- | --- |
| `packages/ui/src/keypad.tsx`, `keypad.test.tsx` | new — the keypad grid container and its test |
| `packages/ui/src/styles/components.css` | new `sc-keypad*` classes |
| `packages/ui/src/index.ts` | export `Keypad` and its props |
| `packages/ui/src/design-system.tsx` | the gallery gains a keypad section |
| `apps/sezzle-calculator/src/calculator/` | new — the state machine, its key model, the display projection, the `Calculator` component and their tests |
| `apps/sezzle-calculator/src/App.tsx`, `App.css` | the gallery is replaced by the calculator |
| `apps/sezzle-calculator/package.json`, `package-lock.json` | `@repo/contracts` as a dependency |
| `apps/sezzle-calculator/README.md` | what the calculator does today, and that `=` is a dead end until Phase 4 |
| `docs/PRD-P0.md`, `docs/spec-phases.md` | record the FE-1 amendment (no sign toggle) and Open Question 5 as settled |
| `CLAUDE.md` | the `@repo/ui` barrel list gains `Keypad` |

Not touched: `@repo/ui`'s existing components, the design tokens (both copies), `packages/contracts` itself, either service, the root `README.md`.

## Approach

**Chosen — a pure reducer in the app, a dumb grid in the design system.**

`@repo/ui` gains `Keypad`, a grid container that arranges whatever `Key` children it is given and knows nothing about operations, so the design system stays a vocabulary and never imports `@repo/contracts`. The app owns the calculator: `reducer.ts` is a pure function over a state object, `Calculator.tsx` drives it through `useReducer`, and a projection function turns state into the three `Display` slots. Tests call the reducer directly and render the component with React Testing Library; neither needs a network, because an outcome is an action like any other.

**The seam Phase 4 plugs into is one prop.** `Calculator` accepts an optional `onRequest?: (request: CalculationRequest) => Promise<CalculationOutcome>`; when the reducer moves to `pending` carrying a new request, an effect calls it exactly once and dispatches whatever it resolves with as the outcome action. The prop resolves with a result or with `@repo/contracts`' `{ error: { code, message } }` and never rejects — Phase 4's client maps a failure to that envelope. The app omits the prop in this phase, which is what makes the running app's `=` a dead end; tests pass a stub, so AC-25 can assert that exactly one request left the component.

Operation names, their arity (`OPERAND_COUNT`, 1 for `sqrt`) and the request/result/error shapes come from `@repo/contracts` — Phase 1's package, specified at `.awc/tasks/spec-ready/p1-contract-calc-service/`. This phase depends on that code existing and restates none of it.

Alternatives weighed and why not:

- **A calculator component in `@repo/ui`** — reusable, but it would make the design system depend on `@repo/contracts` and own product behaviour, which is not what `packages/ui` is.
- **The grid laid out in the app's own CSS** — leaves `@repo/ui` untouched, but `CLAUDE.md` puts new design-system classes in `components.css`, and the gallery could not show a pad. The human chose the `@repo/ui` component.
- **Local types for the request, swapped for `@repo/contracts` in Phase 4** — would let this phase build before Phase 1's code exists, at the cost of defining the contract twice; the story settles `@repo/contracts` as the dependency.
- **`useState` with handler functions instead of a reducer** — fewer moving parts, but the state machine is the deliverable and a pure reducer makes Open Question 5 testable without rendering.

## The state machine

One state object, four statuses.

| Status | Meaning |
| --- | --- |
| `entering` | the user is building an operand |
| `pending` | a request has been emitted, no outcome yet |
| `result` | an outcome returned a number |
| `error` | an outcome returned an error |

Each rule below is a decision from the interviews; [`acceptance-criteria.md`](acceptance-criteria.md) states it as an observable outcome. This list is the model, not a second copy of the criteria.

- Entry is text, never arithmetic: digits and the point append, a leading zero is absorbed, and the operand stops at 15 characters counting the point.
- Every refusal is silent — a second point, a 16th character, `=` on an incomplete entry, `sqrt` while an operation is recorded, any key while `pending`, and every key but a digit, the point and `C` while an error stands. A refused press returns state unchanged.
- Operation keys record and replace; they never calculate. `=` and `sqrt` are the only keys that emit a request, and `sqrt` fires on the press using the displayed operand.
- Replacing an operation touches only the operation. A second operand already typed stays the entry in progress, so the next digit or point **appends** to it — `12`, `+`, `5`, `×`, `7` is `12 × 57`.
- An entry is complete for `=` once the second operand has had any key appended to it. The operand string becomes the contract's number as typed, with a trailing bare point dropped: `5.` sends `5`.
- `pending` is frozen, `C` included, so no late outcome can land on an entry the user has moved past and Phase 4 inherits no reconciliation problem.
- After a **result**: an operation key makes the result the first operand; a digit or the point starts a fresh entry; `C` resets.
- After an **error** the value slot holds a message, not a number, so there is nothing to promote: only a digit or the point (a fresh entry, discarding the failed calculation) and `C` (a reset) do anything. An operation key, `=` and `sqrt` are refused.

## Display contract

`Display`'s three slots carry the whole readout. The value slot starts at `0`, the expression line starts empty.

| Situation | `value` | `expression` | `state` |
| --- | --- | --- | --- |
| building the first operand | the operand as typed | empty | `idle` |
| operation recorded | the first operand, unchanged | `12 +` | `idle` |
| building the second operand | the second operand | `12 +` | `idle` |
| pending | the operand as it stood when the request left | `12 + 5 =`, `sqrt(9) =` | `idle` |
| result | the result | `12 + 5 =`, `sqrt(9) =` | `idle` |
| fresh entry after a result | the new digit | empty | `idle` |
| error | **the message the outcome carried** | the failed calculation | `error` |

`pending` is a frozen readout, not a busy one: `Display`'s `state="busy"` is **deferred to Phase 4** with the busy indicator it belongs to, so this phase elects only `idle` and `error`. What makes `pending` observable is that the readout holds the emitted calculation and no key changes it (AC-18).

Operator glyphs in the expression line are `+`, `−`, `×`, `÷` and `^`; `sqrt` renders as `sqrt(9)`; percentage renders as `12% of 50`, matching XC-3's "x% of y" so the line cannot be misread as a modulo. Results render with JavaScript's own number-to-string conversion — shrinking or truncating long numbers is Phase 5's (FE-6).

## Error contract

This phase decides no user-facing wording. An error outcome **carries** its message and the machine renders that string; Phase 4 supplies the copy for domain errors, outages, network failures and unexpected responses without changing this UI. The outcome shape is `@repo/contracts`' `{ error: { code, message } }`.

The only failures this phase owns are entry refusals, and all of them are silent by the human's decision (`tmp/story-interview-log.md` entry 8): no message, no flash, no changed display.

## Non-goals

`fetch` and anything that performs the call, the API client module and the hook, the busy indicator — including `Display`'s `busy` state — and all error copy (Phase 4). The responsive pass and the accessibility audit (Phase 5). Keyboard shortcuts (P1, FE-9). Arithmetic of any kind in the frontend, including negating a number for display. Result formatting, rounding and truncation. Persistence and history.

**FE-1 is amended:** the sign toggle (`+/-`) is dropped permanently, not deferred — see the resolved decisions below. The calculator ships with no key for entering a negative operand, and slice 1 carries that amendment into `docs/PRD-P0.md` and `docs/spec-phases.md` so `docs/` stays the source of truth for scope.

**The running app is a preview.** Nothing in this phase answers a request, so pressing `=` in `npm run dev` freezes the calculator until the page is reloaded. That is the accepted cost of shipping no throwaway code; Phase 4 makes the app whole.

## Resolved decisions

| Decision | Why |
| --- | --- |
| The `+/-` key is dropped permanently, amending FE-1 | flipping the sign of a result is local arithmetic, which this phase forbids; the human chose a permanent drop over a Phase 4 deferral. Negative values still arise as results, so `NEGATIVE_SQRT` stays reachable |
| No chaining — an operation key replaces the recorded one | keeps `=` and `sqrt` the only keys that emit a request, which is the seam Phase 4 plugs into |
| A digit after a replacement appends to the retained second operand | follows from the two settled rules — a replacement changes only the operation (AC-12 keeps `5` live), and digits append to the operand being entered; a fresh operand would need a special case that discards what the user typed |
| A digit on a result or an error starts a fresh entry | one rule for both, so the user never has to know which of the two they are looking at |
| On an error, an operation key, `=` and `sqrt` are silently refused | the value slot holds a message, so the result rule ("make it the first operand") has no number to promote; refusing invents no behaviour and discards nothing, and it is what the settled "every refusal is silent" rule already does elsewhere |
| Leading zeros absorbed; the cap counts 15 characters including the point | the absorbed zeros never reach the operand, so the two rules do not fight; a character count is what a fixed-width readout actually holds |
| An operand is complete once any key has appended to it; a trailing bare point is dropped when it becomes a number | the contract takes finite numbers, and `5.` is the same number as `5`; gating on "a key was pressed" keeps the completeness test observable rather than arithmetic |
| Entry refusals are silent | the human's call; nothing in FE-3 asks for feedback, and any feedback would be copy this phase does not own |
| `pending` freezes every key, `C` included | the human's call; a late outcome cannot land on a state the user has moved past, so Phase 4 inherits no reconciliation problem |
| `pending` renders the emitted calculation with `state="idle"`; `busy` waits for Phase 4 | the busy indicator is Phase 4's by `docs/spec-phases.md`; a frozen readout is observable on its own |
| `sqrt` refused while an operation is recorded | it cannot both replace a two-operand operation and fire immediately; refusing is the only reading that discards nothing the user typed |
| The error message is carried by the outcome and rendered in the value slot | keeps every string in Phase 4 while the state lives here; the human chose the value slot over the hint line |
| `Calculator`'s boundary is one optional `onRequest` prop that resolves with an outcome | gives Phase 4 a named place to plug its hook in without touching the reducer, and gives the tests a way to observe that exactly one request left the component; a prop the app omits is also what makes the dev app's `=` a dead end, as decided |
| `Keypad` in `@repo/ui`, ignorant of operations | `CLAUDE.md` puts new design-system classes in `components.css`; keeping it a plain grid stops the design system depending on `@repo/contracts` |
| `<DesignSystem />` dropped from the app, kept in `@repo/ui` | the app is the calculator now; the gallery stays available to the package and gains a keypad section |
| The dev app's `=` is a dead end until Phase 4 | the human's call over relaxing `pending` or shipping a stand-in that would have to do the arithmetic locally |
