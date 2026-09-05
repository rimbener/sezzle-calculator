# Calculator UI and input state machine

**As a** first-time user of the calculator web app
**I want** a keypad and a display that let me build any one of the seven calculations and see what I have entered
**so that** I can reach every operation without instructions, and cannot get the app into a state I do not understand.

## Context

This is Phase 3 of `docs/spec-phases.md`, covering FE-1, FE-3, the UI half of
FE-8, and settling PRD-P0's Open Question 5 (§10.5) — the input state machine
that the PRD deliberately deferred to implementation.

Today `apps/sezzle-calculator` holds only a starter `App.tsx`; the design
system it must be built from already exists in `packages/ui` (`@repo/ui`,
consumed as source) with its tokens under `packages/ui/src/styles/`. The two
backend services do not exist as code yet, but Phase 1's spec bundle is
approved and handed off at `.awc/tasks/spec-ready/p1-contract-calc-service/`,
so the shared contract package (`@repo/contracts`) is a settled dependency
this story may name and the code workflow will find built.

The surface is the SPA's UI and the state machine behind it — nothing else.
No `fetch`, no service, and no arithmetic anywhere in the frontend. The
machine turns key presses into a **calculation request** and accepts a
**result or error outcome** handed back to it, with `pending` as a state it
can occupy; who performs the call is Phase 4's problem, which is what makes
this phase testable with no network and no mocking.

**Collision, and the human's call on it.** FE-1 lists a sign toggle (`+/-`)
on the pad, but this phase forbids local arithmetic "including 'harmless'
cases like negating a number for display", and flipping the sign of a result
is exactly that. The human's decision is to **drop the `+/-` key permanently**
— not defer it to Phase 4. FE-1 is amended accordingly: the calculator ships
with no key for entering a negative operand. Negative values still reach the
machine as results (`3 - 5` yields `-2`), and such a result can still become
the first operand of the next operation, so `sqrt` of a negative number
remains reachable.

## Acceptance criteria

Layout and keys

- The app renders a display plus a keypad carrying the digits `0`-`9`, a
  decimal point, one key for each of the seven operations, `=`, and `C`.
- No sign-toggle key is present.
- Every key is operable and the display shows `0` before anything is pressed.

Building an entry

- Pressing digits appends them to the operand being entered and the display
  shows what has been entered so far.
- A leading zero is absorbed: from the starting `0`, pressing `0` leaves the
  display at `0`, and then pressing `5` shows `5` — never `05` or `055`.
- Zeros after the decimal point are kept as typed: `.`, `0`, `0`, `7` shows
  `0.007`.
- Pressing an operation key after an operand records that operation and the
  entry moves to the second operand.

Operators never calculate

- Only `=` and `sqrt` ever produce a calculation request. No other key does.
- `sqrt` produces its request the moment the key is pressed.
- Pressing a second operation key **replaces** the recorded one and calculates
  nothing: `12`, `+`, `5`, `x` leaves `12 x 5` pending, and `=` pressed at
  that point yields `60`.
- Pressing an operation key immediately after another one also just replaces
  it.

After a result

- A result becomes the first operand of the next operation: with `17` shown,
  pressing `-` starts `17 -`.
- A digit or a decimal point pressed on a displayed result starts a **fresh
  entry** — `17` then `3` shows `3`, not `173`. This holds for a `sqrt`
  result identically.

Refusals are silent

- A second decimal point in one operand is ignored: the display does not
  change and no request is produced.
- An operand stops at 15 characters, the decimal point included; the 16th character is ignored and the display does not change. (The unit was settled during the spec interview — `tmp/spec-interview-log.md` entry 8 — over this story's earlier "significant digits" wording.)
- `=` pressed while the entry is incomplete — no operation recorded, or an
  operation with no second operand — does nothing and produces no request.
- None of these three refusals produces any observable feedback: the display
  is unchanged and the app stays usable.

Clear and recovery

- `C` returns the app to its starting state — display `0`, nothing recorded —
  and produces no calculation request.
- When an error outcome is handed back, the entry that caused it is kept so
  the user can correct it, and it clears on the next valid input.

Must not regress

- No arithmetic is performed in the frontend, in any form.
- The frontend issues no network call of any kind in this phase.
- The UI is built from `@repo/ui` and the design-system tokens; no raw hex
  values and no raw pixel sizes.

## Notes

Decisions the human made in the interview — the spec step should not re-ask
them:

- **No chaining.** An operation key pressed after a complete `a op b` entry
  replaces the operation rather than resolving the pending one. Only `=` and
  `sqrt` emit requests. (Option (b) of the chaining question.)
- **Digit on a result starts fresh**, for `=` results and `sqrt` results
  alike.
- **`+/-` is dropped permanently**, amending FE-1, rather than deferred to
  Phase 4.
- **Leading zeros are absorbed.**
- **Refusals are silent no-ops** — no visible reaction to a rejected key
  press.
- Phase 1's phase-order dependency was checked against the repo at relaunch,
  not asked: its bundle sits at `.awc/tasks/spec-ready/p1-contract-calc-service/`
  with commits `929b5b6` and `e425348` in history.

Settled by the source, not the human, and carried forward: operand counts come
from `@repo/contracts` (1 for `sqrt`, 2 for the rest); the app's own ESLint
config (`@stylistic` — no semicolons, single quotes) governs
`apps/sezzle-calculator`; the React Compiler is on, so no hand-written
`useMemo`/`useCallback`.

Out of scope for this phase: `fetch`, the API client module and hook, error
copy and the busy indicator (Phase 4); the responsive pass and the
accessibility audit (Phase 5); keyboard shortcuts (P1, FE-9).
