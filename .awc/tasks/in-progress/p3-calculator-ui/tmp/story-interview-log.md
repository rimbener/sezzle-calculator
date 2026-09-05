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
- when/where — `docs/spec-phases.md` says a phase starts only once the previous one's trail sits under `.awc/tasks/done/` with both commits in history; Phase 1's trail is still under `in-progress`, uncommitted, and `@repo/contracts` does not exist on disk. Does Phase 3 proceed anyway?
- success — chaining: what does pressing a second operator after a complete `a op b` entry do, and what does `=` produce afterwards?
- success — what a digit press does when a result is on the display: start a fresh entry, or append to the result?
- edges — what the user perceives when an entry is refused (second decimal point, the 16th digit, equals while input is incomplete): a silent no-op, or visible feedback?

## 1 — when/where
Q: `docs/spec-phases.md` locks the phase order: "A phase is finished when its trail sits under `.awc/tasks/done/<task>/` and both its commits are in history; only then start the next." Phase 1's trail is still under `.awc/tasks/in-progress/p1-contract-calc-service/`, nothing under `.awc/` is committed, and neither `packages/contracts` nor `apps/calc-service` exists on disk — so Phase 3's stated dependency (the shared request/result types it speaks) is specced but not built. Do we run Phase 3 now anyway, with the story naming `@repo/contracts` as a spec-level dependency the code workflow will find already built by then?
A:
