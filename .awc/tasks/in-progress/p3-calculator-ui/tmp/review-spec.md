# Spec review — p3-calculator-ui

**Verdict: CHANGES_REQUESTED** (round 1 of 1)

Reviewed: `spec.md`, `acceptance-criteria.md`, `tmp/subtasks.md`,
`tmp/subtask-1..7.md`, against `tmp/user-story.md`,
`tmp/story-interview-log.md`, `tmp/spec-interview-log.md`, `CLAUDE.md`,
`docs/PRD-P0.md`, `docs/spec-phases.md`, `docs/REQUIREMENTS.md`, the repo's
current `packages/ui` (`Display`, `Key`, `index.ts`, both vitest configs) and
Phase 1's handed-off bundle at
`.awc/tasks/spec-ready/p1-contract-calc-service/`.

## What holds up

- Approach is named and ruled on: a pure reducer in the app plus a dumb grid
  in `@repo/ui`, with three alternatives each carrying a "why not" line. The
  `Keypad`-in-`@repo/ui` call and the `<DesignSystem />` drop are recorded
  human decisions (`tmp/spec-interview-log.md` entry 1) — not re-litigated here.
- The FE-1 collision (sign toggle vs. "no local arithmetic") is an explicit,
  recorded human decision (story log entries 40 and 44: permanent drop,
  FE-1 amended), so it is not a locked-design collision. Same for the 15-
  character cap over FE-3's literal "15 significant digits" (spec log entry 8,
  answer `c`), frozen `pending` including `C` (entry 5), silent refusals
  (story log entry 52), `sqrt` refused mid-expression (entry 10), the carried
  error message in the value slot (entry 7), and the dev app's `=` dead end
  (entry 9). None of these is a finding.
- No new external dependency. `@repo/contracts` is Phase 1's workspace package,
  mandated by XC-1 and settled by phase order; `packages/contracts` not
  existing as code yet is expected and is handled by `docs/spec-phases.md`'s
  run order, not by this bundle.
- Subtask paths are real locations consistent with the repo's layering, both
  packages already carry a vitest config and a `test` script, and `Display`
  really does expose the `value` / `expression` / `state` slots the display
  contract projects onto. Every criterion AC-1..AC-24 has exactly one owning
  subtask; the three slices are each independently green and exercisable.
- Subtask-2 correctly states that swapping `<DesignSystem />` for
  `<Calculator />` is a surface change recorded by AC-2, not a
  behaviour-preserving refactor, so no `refactor:` entry is owed anywhere.

## Findings

### F1 — `pending` has no display contract, so AC-17/AC-24 are not observable — major — resolved

`spec.md` §"Display contract" tables six situations and **omits `pending`**,
even though `pending` is one of the four statuses in §"The state machine".
`@repo/ui`'s `Display` has a third state (`busy`) that nothing here elects or
rules out, and `spec.md` §"Non-goals" puts "the busy indicator" in Phase 4
while `tmp/subtask-7.md` says `Calculator` "projects the result, error **and
pending** states onto `Display`". Consequence: **AC-24**'s "leaves the
calculator in its pending state", asserted through the rendered UI, has no
defined observable, and **AC-17** ("every key is ignored") can only be checked
against a readout whose contents nobody has specified. Add a `pending` row to
the display contract (value, expression, `state`) and say whether
`state="busy"` is used here or deferred; then AC-24 becomes checkable.

**Resolved.** `spec.md` §"Display contract" gains a `pending` row (value = the operand as it stood when the request left, expression = `12 + 5 =` / `sqrt(9) =`, `state` = `idle`) and a line saying `Display`'s `busy` is deferred to Phase 4 with the busy indicator it belongs to; the non-goal now says so in the same words. AC-18 (was AC-17) asserts that readout, AC-25 (was AC-24) asserts it as the end state of the full sequence, and `subtask-6.md` and `subtask-7.md` project only `idle` and `error`.

### F2 — the `Calculator` request/outcome seam is unspecified — major — resolved

`tmp/subtask-6.md` fixes the reducer-level seam ("the request is a value on
the state that a caller reads"), but nothing says how a request leaves the
**component** or how an outcome is handed in — a prop callback, a render prop,
a returned tuple. `tmp/subtask-7.md` only asserts that `Calculator` "exposes
the request and the outcome dispatch as its boundary". **AC-24** requires a
rendered-UI test asserting "exactly one request is emitted"; with the request
living only on internal reducer state, no such assertion is writable, and
Phase 4 has no named surface to plug into. Name the component's boundary in
`spec.md` (one line) and reflect it in AC-24.

**Resolved.** `spec.md` §"Approach" names the boundary in a paragraph of its own: one optional prop, `onRequest?: (request) => Promise<CalculationOutcome>`, called once by an effect when the reducer moves to `pending` and resolving with a result or the contract's error envelope, never rejecting. `App.tsx` omits it, which is what makes the dev app's `=` a dead end; tests pass a stub. AC-25 now asserts the stub was called exactly once with that request, and `subtask-7.md` carries the prop and the effect.

### F3 — `tmp/subtask-5.md` contradicts AC-12 on operator replacement — major — resolved

`tmp/subtask-5.md` bullet 1 states unconditionally: "An operation key records
the operation and **commits the entered operand as the left one**." Applied to
the sequence in **AC-12** (`12`, `+`, `5`, `×`) the entered operand at the
moment `×` is pressed is `5`, so bullet 1 yields expression `5 ×` — while
AC-12 and bullet 2 of the same file require `12 ×` with `5` retained, and
`=` evaluating `12 × 5`. Bullet 1 needs the qualifier that it commits the
entry only when no operation is recorded yet.

**Resolved.** `subtask-5.md` bullet 1 is now conditioned on no operation being recorded yet, and the replacement bullet says explicitly that it changes only the operation and never re-commits the entry — `12`, `+`, `5`, `×` keeps `12` as the left operand.

### F4 — the digit after an operator replacement is undefined — major — resolved

Following AC-12's `12`, `+`, `5`, `×` (a recorded operation with a second
operand already typed), no criterion and no line of `spec.md` says what the
next digit `7` does: append to the retained `5` (giving `12 × 57`) or start a
fresh second operand (giving `12 × 7`). This is a transition inside the very
state machine this phase exists to settle (PRD-P0 §10.5, Open Question 5), and
it is exactly the "operator replacement" case OQ5 names. Add the rule to
`spec.md` §"The state machine" and a criterion under slice 3.

**Resolved.** Settled as **append**, which is what the two already-recorded rules give when combined (AC-12 keeps `5` live as the entry; digits append to the entry): `12`, `+`, `5`, `×`, `7` is `12 × 57`. The rule is in `spec.md` §"The state machine" with its "why" in the resolved-decisions table, carried by `subtask-5.md`, and observed by the new **AC-13**. AC-13..AC-24 shifted up one to AC-14..AC-25 across `acceptance-criteria.md`, `subtasks.md` and the subtask files.

### F5 — error recovery is only half specified — major — resolved

**AC-22** defines only two presses on status `error`: a digit, and `C`.
`spec.md` §"The state machine" offers "an operation key makes a result the
first operand" — which cannot apply to an error, whose value slot holds a
**message**, not a number. So an operation key, `=`, `sqrt` or the decimal
point pressed while an error is displayed is undefined, and
`tmp/subtask-6.md` repeats the same result-shaped rule without covering the
error case. `docs/spec-phases.md` Phase 3 lists "recovery after an error" as
one of Open Question 5's items, so this cannot be left to the implementer.

**Resolved.** `spec.md` §"The state machine" now splits the two endings: after a **result** an operation key promotes it; after an **error** the value slot holds a message, so only a digit, the point and `C` act and an operation key, `=` and `sqrt` are silently refused — the reading that invents nothing and discards nothing, recorded with that "why". `subtask-6.md` carries it, and **AC-23** (was AC-22) states it as an observable.

### F6 — the FE-1 amendment lands in no docs update — major — resolved

`spec.md` §"Non-goals" states "**FE-1 is amended:** the sign toggle (`+/-`) is
dropped permanently", and the human's own answer (story log entry 44) was
given on the record precisely because "dropping it changes a numbered PRD
requirement". `CLAUDE.md` makes `docs/` the source of truth for scope, yet
`docs/PRD-P0.md` still reads "Digit pad (0–9, decimal point, **sign toggle**)"
(FE-1, line 120), still lists the sign toggle among FE-3's undecided editing
rules (line 124) and among Open Question 5's items (§10.5, line 255), and
`docs/spec-phases.md` still lists "sign toggle" in Phase 3's **In scope**. No
subtask carries that edit, and `spec.md` §"Surfaces touched" does not name
`docs/` at all. Per docs discipline the amendment belongs in the slice that
ships the pad without the key — slice 1, `tmp/subtask-2.md` — with the two
doc files in its `paths`. Settling OQ5 likewise wants its one-line record in
the PRD.

**Resolved.** `subtask-2.md` — slice 1, the slice that ships the pad without the key — now lists `docs/PRD-P0.md` and `docs/spec-phases.md` in its `paths` and says exactly which lines change: the sign toggle out of FE-1, FE-3 and OQ5, OQ5 recorded as settled by this bundle, "sign toggle" out of Phase 3's In scope. `spec.md` §"Surfaces touched" gains the docs row and the non-goals paragraph points at it; **AC-2** carries the docs half.

### F7 — the `@repo/ui` barrel documented in `CLAUDE.md` goes stale — minor — resolved

`tmp/subtask-1.md` adds `Keypad` and its props to `packages/ui/src/index.ts`,
but `CLAUDE.md` line 56 enumerates that barrel by name (`Button`, `Card`,
`Badge`, `Key`, `Display`, `Callout`, `BusyLamp`, `Input`, `Toggle`) and no
subtask updates it. One line, in slice 1, in subtask-1's `paths`.

**Resolved.** `CLAUDE.md` is in `subtask-1.md`'s `paths` and in `spec.md` §"Surfaces touched"; the subtask says to add `Keypad` to the barrel list under `## @repo/ui` in the same slice.

### F8 — AC-22 under-covers the spec's own rule — minor — resolved

`spec.md` §"The state machine" says "a digit **or the point** starts a fresh
entry, discarding the result or the failed calculation alike", and **AC-20**
carries the point for the result case. **AC-22** covers only "a digit pressed
while an error is displayed", so the decimal-point half of the rule has no
criterion.

**Resolved.** **AC-23** (was AC-22) now reads "a digit **or the decimal point**", matching `spec.md`'s rule, and `subtask-6.md` states the digit-or-point rule once for both endings.

### F9 — entry text to contract operand is unspecified — minor — resolved

**AC-16** requires the emitted request to be "valid against its request
schema", and Phase 1's schema takes an array of **finite numbers**
(`.awc/tasks/spec-ready/p1-contract-calc-service/tmp/subtask-2.md`). Nothing
in `spec.md` says how the typed operand string becomes that number, nor
whether an entry ending in a bare decimal point (`12.`, or a second operand
that is only `0.`) counts as complete for **AC-13**'s "an operation with no
second operand" gate. The display contract settles the number-to-string
direction only.

**Resolved.** `spec.md` §"The state machine" now says an entry is complete for `=` once any key has appended to the second operand, and that the operand string becomes the contract's number as typed with a trailing bare point dropped (`5.` sends `5`); the resolved-decisions table carries the "why". **AC-14** states the completeness gate, **AC-17** the conversion, and `subtask-6.md` both.

### F10 — AC-9's scope is not reachable in its owning subtask — minor — resolved

**AC-9** reads "`C` returns the calculator to its starting state … **from any
status except `pending`**" and is owned by `tmp/subtask-4.md`, where only
`entering` exists — `result`, `error` and `pending` all arrive in
`tmp/subtask-6.md`. At slice 2's boundary the criterion is only vacuously
verifiable. Either narrow AC-9 to the statuses slice 2 can reach and let
subtask-6's own criteria carry `C` from `result`/`error`, or move it.

**Resolved.** **AC-9** is narrowed to `C` pressed while an operand is being entered — the only status slice 2 reaches — and points at AC-23 and AC-18 for the others. `C` from a result or an error is now explicit in **AC-23**, owned by `subtask-6.md`; `subtask-4.md` says the same.

### F11 — AC-10 is defined by reference — minor — resolved

**AC-10** says "All of the above hold when driven through the rendered UI",
where "the above" spans AC-4..AC-9, five of which belong to a different
subtask. It is not self-contained: a reader cannot tell whether the silent
refusals (AC-7, AC-8) and `C` (AC-9) are inside its scope. Name the
behaviours it re-drives.

**Resolved.** **AC-10** now names the behaviours it re-drives: digit entry, leading-zero absorption, the decimal point and its kept zeros, the ignored second point, the 15-character cap, and `C`. `subtask-4.md` repeats the list.

### F12 — `spec.md` repeats itself in §"The state machine" — minor — resolved

The lead-in above the status table ("Every rule below is a decision from the
interviews, and each has a criterion in `acceptance-criteria.md`") and the
paragraph immediately below the table ("Every rule below is a decision from
the interviews; `acceptance-criteria.md` states each as an observable
outcome…") say the same thing twice, three lines apart. Drop one.

**Resolved.** The lead-in above the status table is gone; the paragraph below it stands alone.

### F13 — story and criteria disagree on the cap's unit — minor — resolved

`tmp/user-story.md` §"Acceptance criteria" reads "A **16th significant digit**
is ignored", while spec log entry 8 settled option `c` and both `spec.md`
(§"Resolved decisions") and **AC-8** state a 15-**character** cap counting the
decimal point. The story's wording is the pre-interview one and now
contradicts the bundle it feeds.

**Resolved.** `tmp/user-story.md`'s refusal bullet now reads "15 characters, the decimal point included", with a pointer to `tmp/spec-interview-log.md` entry 8 as where the unit was settled.

### F14 — `spec.md` §"Surfaces touched" omits the docs surface — minor — resolved

`tmp/subtask-7.md` writes `apps/sezzle-calculator/README.md`, and
`tmp/subtask-1.md` adds `packages/ui/src/keypad.test.tsx`; neither appears in
the surfaces table, whose "Not touched" line mentions only the **root**
`README.md`. With F6's doc edits added, the table needs a docs row.

**Resolved.** `spec.md` §"Surfaces touched" gains rows for `packages/ui/src/keypad.test.tsx` (folded into the keypad row), `apps/sezzle-calculator/README.md`, the two `docs/` files and `CLAUDE.md`. The "Not touched" line still names only the root `README.md`.

## Traceability

Request → story → spec → criteria → subtasks is otherwise consistent: FE-1,
FE-3, the UI half of FE-8 and Open Question 5 are all claimed and covered;
AC-1..AC-24 map one-to-one onto subtasks 1–7 with no criterion orphaned and no
subtask criterion-less. One piece of work runs the other way: the keypad
section added to `packages/ui/src/design-system.tsx` (`tmp/subtask-1.md`,
`paths`) is covered by no criterion — **AC-1** speaks only to the component,
its classes and its independence from `@repo/contracts`. Minor, folded here
rather than raised separately.

**Resolved.** **AC-1** now also requires that the package's own gallery shows a section built from the keypad, so `design-system.tsx`'s edit is covered by a criterion.

_All findings resolved. Criteria are now AC-1..AC-25: the new AC-13 (the digit after an operator replacement) was inserted after AC-12 and the old AC-13..AC-24 shifted up one, throughout `acceptance-criteria.md`, `tmp/subtasks.md` and the subtask files._
