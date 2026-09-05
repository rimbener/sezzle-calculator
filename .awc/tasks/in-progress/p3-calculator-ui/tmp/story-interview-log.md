# Story interview — p3-calculator-ui

## From the source
### Settled
- who — the end user of the calculator SPA (PRD §5); the Sezzle reviewer is the secondary audience who exercises it (US-10…US-12).
- what — digit pad (0–9, decimal point, sign toggle), keys for all seven operations, equals, clear, and a display; entry-level validation (one decimal point per operand, 15-significant-digit cap, equals inert while input is invalid); and the input state machine behind them (FE-1, FE-3, Open Question 5).
- why — US-1…US-6: a first-time user must be able to reach every operation without instructions, and Open Question 5 is the largest undecided item left in PRD-P0 (§10.5), deferred to this run by `docs/spec-phases.md` Phase 3.
- when/where — `apps/sezzle-calculator` only, built from `@repo/ui` (consumed as source) and the design-system tokens in `packages/ui/src/styles/`; Phase 3 of PRD-P0 §11.
- surface — the SPA's UI plus its state machine; no service, no `fetch`, no arithmetic anywhere in the frontend.
- success (partly) — `sqrt` emits its request immediately on the key press, every other operation waits for `=`; a result becomes the first operand of the next operation; `C` resets and emits no request; operand counts come from `@repo/contracts` (1 for `sqrt`, 2 for the rest).
- edges (partly) — an error outcome keeps the input so it can be corrected and clears on the next valid input; a second decimal point is ignored; digits stop at the 15-significant-digit cap; equals does nothing while input is invalid (FE-3, UC-2).
- out of scope — `fetch`, the API client and hook, error copy and the busy indicator (Phase 4); responsive pass and accessibility audit (Phase 5); keyboard shortcuts (P1, FE-9); any local arithmetic.

### Open
- ~~when/where — `docs/spec-phases.md` says a phase starts only once the previous one's trail sits under `.awc/tasks/done/` with both commits in history; Phase 1's trail is still under `in-progress`, uncommitted, and `@repo/contracts` does not exist on disk. Does Phase 3 proceed anyway?~~ — settled by the repo on relaunch, see entry 1.
- ~~success — chaining: what does pressing a second operator after a complete `a op b` entry do, and what does `=` produce afterwards?~~ — settled by entry 2.
- ~~success — what a digit press does when a result is on the display: start a fresh entry, or append to the result?~~ — settled by entry 3.
- ~~edges — sign toggle collides with the "no local arithmetic" non-goal once the display holds a result (noticed at entry 4, not in the original source read).~~ — settled by entries 4-6: the key is dropped.
- ~~edges — leading zeros: Open Question 5 names them, and nothing in the source settles them (noticed at entry 4).~~ — settled by entry 7.
- ~~edges — what the user perceives when an entry is refused (second decimal point, the 16th digit, equals while input is incomplete): a silent no-op, or visible feedback?~~ — settled by entry 8.

## 1 — when/where
Q: `docs/spec-phases.md` locks the phase order: "A phase is finished when its trail sits under `.awc/tasks/done/<task>/` and both its commits are in history; only then start the next." Phase 1's trail is still under `.awc/tasks/in-progress/p1-contract-calc-service/`, nothing under `.awc/` is committed, and neither `packages/contracts` nor `apps/calc-service` exists on disk — so Phase 3's stated dependency (the shared request/result types it speaks) is specced but not built. Do we run Phase 3 now anyway, with the story naming `@repo/contracts` as a spec-level dependency the code workflow will find already built by then?
A: (Not asked — the repo answered it between sessions, so §2's "never ask what the repo can tell you" applies. Re-checked at relaunch: Phase 1's `prd-to-spec` run finished. Its trail sits under `.awc/tasks/spec-ready/p1-contract-calc-service/` (the handoff destination this workflow's `handoff-task.sh` actually writes, where `docs/spec-phases.md` says `done/`), and both of its commits are in history — `929b5b6 docs(spec): p1-contract-calc-service …` and `e425348 chore(spec): hand off p1-contract-calc-service to spec-to-code`. The phase-order rule is therefore satisfied and the collision named in the question is gone. `packages/contracts` still does not exist as code, which is expected and not a blocker: `docs/spec-phases.md` states that "each phase's spec can name the artifacts the previous phase already specified", so Phase 3's story names `@repo/contracts` as a spec-level dependency the code workflow will find built by the time it runs. Phase 3 proceeds.)

## 2 — success
Q: Chaining. Say the user has entered a complete two-operand expression — `12`, `+`, `5` — and then presses another operator key, say `x`, instead of `=`. Two behaviours are common in real calculators: (a) the pending `12 + 5` resolves first, the result becomes the left operand, and the machine sits waiting for the right operand of `x` — so the display shows `17` and a further `3` then `=` gives `51`; or (b) no chaining at all — the second operator simply replaces `+`, nothing is calculated, and `12 x 5` is what `=` finally evaluates. (a) means a key press other than `=` can emit a calculation request; (b) means only `=` and `sqrt` ever emit one. Which do you want, and what does `=` produce immediately after that second operator press with no new digits typed?
A: b

## 3 — success
Q: A digit pressed while a result is on the display. The user has just pressed `=` and the display shows `17`. They now press `3`, with no operator in between. Does that start a completely fresh entry — the `17` is discarded and the display becomes `3` — or does it append to the result, making the display `173`? (The already-settled case is different: `17` then `+` keeps `17` as the first operand. This is only about a bare digit, or a decimal point, landing straight on a result.) And does the same rule apply to a digit pressed on a display showing the result of a `sqrt`?
A: start a fresh entry, same for sqrt

## 4 — edges
Q: A collision I have to put to you rather than settle quietly. `docs/spec-phases.md` puts "any local arithmetic — including 'harmless' cases like negating a number for display" out of scope for this phase, but the sign toggle (`+/-`) is on the key pad. While the user is typing an operand the toggle is pure string work — it flips a leading `-` on the digits they entered, no arithmetic — so that case is fine. The problem is pressing `+/-` when the display holds a **result** handed back from the backend, say `17`: turning that into `-17` is a negation, which the non-goal forbids doing locally. Three ways out: (a) the toggle on a result emits a calculation request like `0 - 17` (or `17 x -1`) and the backend returns `-17` — no local arithmetic, but a network round trip for a sign flip; (b) `+/-` is inert on a result and only works while an operand is being typed; (c) the toggle is treated as entry-level text throughout — pressing it on a result prefixes a `-` to those digits and the value becomes the first operand of the next operation, which is arguably still local negation. Which do you want?
A: if the user press for example `-` when the displays shows `17`, then is starting a new operation: `17-`

## 5 — edges
Q: That answer is about the subtract **operator** key, and it matches what is already settled — `-` on a result starts `17 -` with `17` as the first operand. The key I meant is a different one: FE-1 lists the pad as "0-9, decimal point, **sign toggle**", so `+/-` is its own key alongside the seven operation keys, and it exists to make an operand negative before it is used (type `5`, press `+/-`, get `-5`). My question is only about pressing that `+/-` key at the one moment it cannot be pure text: when the display holds a **backend result**, where flipping `17` to `-17` would be local arithmetic that this phase forbids. So, of (a) it emits a calculation request and the backend returns the negated value, (b) it is inert on a result and only works while an operand is being typed, (c) it prefixes a `-` to the result's digits as if they were being typed, which is still local negation — which one? (Or: drop the `+/-` key from this phase, which would mean deviating from FE-1 and saying so in the story.)
A: drop the +/- key

## 6 — what
Q: Dropping it changes a numbered PRD requirement, so I want your call on the record rather than a guess in the story. FE-1 names the sign toggle as part of the pad, and none of `docs/spec-phases.md`'s later phases mention it, so if this phase drops it nothing downstream picks it up and FE-1 goes unmet in P0. Is that (a) a permanent drop — the calculator ships with no way to enter a negative number, FE-1 is amended, and the story says so; or (b) deferred to phase 4, where the network already exists and `+/-` can emit a calculation request like any other operation?
A: a

## 7 — edges
Q: Leading zeros — the last item of Open Question 5 that nothing has settled. A fresh entry starts showing `0`. The user presses `0` again, then `5`. Is the display `0`, then `05`, then `055` (zeros kept as typed), or `0`, then `0`, then `5` (a leading zero is absorbed, so the entry only ever shows a meaningful number)? The related case is the decimal point: pressing `.` on that starting `0` should give `0.` either way, and then `007` typed after a point — `0.007` — obviously keeps its zeros. I am asking about zeros before the point only.
A: absorb the leading zero

## 8 — edges
Q: The last open area. FE-3 has the UI refuse bad input at entry in three ways: a second decimal point in one operand, a 16th significant digit, and `=` pressed while the entry is incomplete (no operator yet, or an operator with no second operand). What does the user perceive when one of those happens? (a) Nothing at all — the key press is silently ignored, the display does not change, and the only way to notice is that nothing happened; or (b) something observable marks the refusal — the display or the key visibly reacts so the press does not feel like a dead app. This phase owns the behaviour either way; error *copy* is phase 4, so if you want (b) I need only what the user should be able to observe, not the wording.
A: a

_Every area is settled; the story was written from this log._
