# tdd-1 — slice A, the 360px shell and fit-to-view readout

Criterion → test map:

- AC-4 → `packages/ui/src/display.test.tsx`: `readoutFitStep — the size step derives only from the character count (AC-4) > maps equal-length values to the same step, whatever the characters are` + `never sends a longer value to a smaller step index`
- AC-4 (DOM), AC-3 (examples) → `packages/ui/src/display.test.tsx`: `Display — the readout carries its fit step (AC-3, AC-4)` (`data-fit` on the value; `123456789012345` → `2`, `1e+21` → `0`; longest error message → `10`)
- AC-10 → `packages/ui/src/display.test.tsx`: `Display — the readout contract stays as phases 3–4 shipped it (AC-10)` (role=status/aria-live, aria-hidden scan) + `packages/ui/src/callout.test.tsx`: `Callout — the announced roles stay as shipped (AC-10)` (keys stay native `<button>`s with accessible names, pinned by the existing `Calculator.test.tsx` key-set tests)
- AC-10 (no-tooling clause) → `apps/sezzle-calculator/src/no-a11y-tooling.test.ts`: `no accessibility tooling in any workspace (AC-10)` (root + every workspace `package.json` scanned; the four dependency sections name no axe or Lighthouse package)
- AC-3, AC-4 (CSS ladder) → `packages/ui/src/display.test.tsx`: `sc-display styles — the fit ladder (AC-3, AC-4)` (every step maps to a type-scale token, never grows, per display size; fit arithmetic `size × 0.6 × max chars ≤ 285px`; no `text-overflow`/`ellipsis`; tail step wraps past its 59-char one-line coverage; `--text-readout-2xs` token exists; no raw hex/px in the Display section)
- AC-2 → `packages/ui/src/keypad.test.tsx`: `keys meet the 44px touch floor at any width, 360px included (AC-2)` (key `min-height`/`min-width` ≥ `--tap-min`; grid columns never below `--key-size-sm`, whose token clears 44)
- AC-1 → `apps/sezzle-calculator/src/App.test.tsx`: `App shell styles — the 360px floor (AC-1) > the keypad, the widest fixed child, fits the viewport at 360, so nothing scrolls horizontally` (token arithmetic: 4×48 + 3×8 + 2×16 + 2×2 + 2×12 = 300 ≤ 360)
- AC-3 (coverage) → `apps/sezzle-calculator/src/calculator/display-fit.test.ts`: `every producible readout value lands on the fit ladder (AC-3)` (the 15-char operand cap, the extreme number string `-1.7976931348623157e+308`, all contract error messages and the three app failure messages all sit at step ≤ 10)
- AC-5 → the Commands gate: every existing suite passes unchanged (no production test edit anywhere)

Design constants behind the ladder (recorded in `readoutFitStep`'s doc comment): Share Tech Mono's advance is 0.54em (parsed from the font's hmtx); the ladder is sized for the widest fallback, 0.6em, into 285px — a 360px viewport minus the shell's side padding (2×12), the display's border (2×2) and padding (2×16), minus one scrollbar. Steps: ≤7 base · 8–10 `--text-readout-md` · 11–15 `--text-2xl` · 16 `--text-readout-sm` · 17–20 `--text-xl` · 21–25 `--text-lg` · 26–29 `--text-md` · 30–33 `--text-sm` · 34–39 `--text-xs` · 40–43 `--text-2xs` · ≥44 `--text-readout-2xs` (8px, covers 59 one-line; wraps beyond).

Cycles:

- Cycle 1 — AC-4 (unit): `display.test.tsx` pins equal-length → equal step and monotone step index; RED (no export). GREEN: `readoutFitStep` + `FIT_STEP_LIMITS` in `display.tsx`, a pure function of `value.length`, no runtime measurement.
- Cycle 2 — AC-3/AC-4 (DOM) + AC-10: `Display` carries `data-fit` on the value element, AC-3's two examples pinned, the readout's role/status/scan contract pinned; RED (attribute absent). GREEN: `data-fit={readoutFitStep(value)}`; the roles needed no change.
- Cycle 3 — AC-3/AC-4 (CSS): the ladder tests (per-size non-increasing mapping, 285px/0.6em fit arithmetic, no truncation, tail wrap, token existence, no raw hex/px); RED on all four. GREEN: dropped `overflow: hidden` + `text-overflow: ellipsis` from `.sc-display__value`; added the ten `[data-fit]` step rules and the sm clamps (the sm readout's own 28px base is smaller than the ladder's first rungs); added `--text-readout-2xs: 8px`; tokenized the scan layer's raw `1px`/`3px` gradient stops to `--border-1`/`--border-3` so the section passes its own no-raw-px rule. The new token was mirrored into both design-system skill copies (`.agents` and `.opencode` are hardlinked) and `BRAND.md`'s type-scale line.
- Cycle 4 — AC-1/AC-2 (characterization, no rework): the keypad tap-floor tests and the 360px shell arithmetic pass against the shipped tokens and CSS (keys sit at 60/48px, the pad needs 276px inside the 336px column); the `display-fit.test.ts` coverage pin passes against the ladder. All green on first run — the subtask's "guarantee, not a rework", now mechanically pinned.

No `refactor:` entries (the spec records none for this task).

Fix step (review-slice-1, both findings resolved):

- Fix 1 (finding 1) — the AC-10 no-tooling pin: `no-a11y-tooling.test.ts` written against the clean tree (green — the clause already holds), then proven to bite: `axe-core` injected temporarily into the app's devDependencies → RED naming the hit, reverted → green. Scan surface pinned (root + all seven workspaces).
- Fix 2 (finding 2) — the display-fit import becomes `@repo/ui/display`, through the export map as AGENTS.md documents; pure test refactor, its suite green unchanged (the file's own ladder-coverage test is the pin that the move preserves).

closing-commit: 25a2dce
