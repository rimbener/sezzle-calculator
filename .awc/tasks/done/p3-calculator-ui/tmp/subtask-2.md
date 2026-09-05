# subtask-2 — The calculator shell in the app

- **slice:** 1 — the calculator shell
- **criteria:** AC-2, AC-3
- **status:** done
- **paths:** `apps/sezzle-calculator/src/App.tsx`, `apps/sezzle-calculator/src/App.css`, `apps/sezzle-calculator/src/calculator/Calculator.tsx`, `apps/sezzle-calculator/src/calculator/keys.ts`, `apps/sezzle-calculator/src/calculator/Calculator.test.tsx`, `apps/sezzle-calculator/package.json`, `package-lock.json`, `docs/PRD-P0.md`, `docs/spec-phases.md`

`App.tsx` stops rendering `<DesignSystem />` and renders `<Calculator />` instead. The gallery component stays exported from `@repo/ui`; only the app drops it. AC-2 records the change — there is no behaviour-preserving refactor here.

`Calculator.tsx` composes `Display` and `Keypad` with the full key set: `0`–`9`, the decimal point, the seven operations, `=` and `C`. **No sign-toggle key** — FE-1 is amended (`spec.md`). Faces come from `Key`'s existing vocabulary: `number` for digits and the point, `operator` for add/subtract/multiply/divide/power/percentage, `function` for `sqrt`, `equals`, `clear`.

`keys.ts` is the single key model the pad is built from — one entry per key, carrying its label, its glyph, its face and, for the operation keys, the operation name imported from `@repo/contracts`. Adding an eighth operation is a line here, which is FE-8's spirit on the UI side. This is where `@repo/contracts` enters `apps/sezzle-calculator`'s dependencies; the workspace link lands in `package-lock.json`.

No state yet: the display is hard-wired to value `0` with an empty expression line, and pressing a key does nothing. Files under `apps/sezzle-calculator` follow the app's own ESLint config — `@stylistic`, no semicolons, single quotes — and the React Compiler is on, so no hand-written `useMemo` or `useCallback`.

This slice also carries the FE-1 amendment into `docs/`, which `CLAUDE.md` makes the source of truth for scope — it belongs to the slice that ships the pad without the key, not to a trailing docs subtask. In `docs/PRD-P0.md`: drop the sign toggle from FE-1's key list and from FE-3's list of undecided editing rules, and record Open Question 5 (§10.5) as settled by this bundle — the sign toggle dropped, the other items decided in `spec.md`'s state-machine section — with a pointer to it. In `docs/spec-phases.md`: drop "sign toggle" from Phase 3's **In scope**. Wording only; no requirement is renumbered.

Tests render the app and assert every required key is present by accessible name, that no sign-toggle key exists, and that the display reads `0` with an empty expression. AC-2's docs half is checked by reading those two files — no "sign toggle" left in FE-1, FE-3, OQ5 or Phase 3's scope.
