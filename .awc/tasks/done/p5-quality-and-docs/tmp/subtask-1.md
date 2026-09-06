# subtask-1 — 360px shell and fit-to-view readout

- **id:** subtask-1
- **title:** 360px shell and fit-to-view readout
- **slice:** A — responsive pass
- **criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-10
- **status:** done
- **paths:**
  - `packages/ui/src/display.tsx`
  - `packages/ui/src/styles/components.css`
  - `packages/ui/src/styles/tokens/typography.css` (only if a new readout size step is needed)
  - `apps/sezzle-calculator/src/App.css`
  - `packages/ui/src/display.test.tsx` (or the app-side equivalent) — the size-step mapping tests
  - `apps/sezzle-calculator/src/**/*.test.tsx` — any new responsive/readout tests

Build the length-step sizing agreed in the spec: `Display` derives a size step from the value's character count (a `data-` attribute or class on the value element) and `components.css` maps each step to a smaller readout size from the type scale — no runtime measurement. Replace the clipping behavior with fit: the full value stays visible at 360px. Verify the shell at the 360px floor (no horizontal scroll, keys ≥44px — they already sit at 60/48px, so this is a guarantee, not a rework) and keep the design-system rules: hard borders, no soft shadows, no raw hex/pixel values outside tokens. The DOM contract stays untouched (AC-10): `role="status"`/`aria-live` on the display, native `<button>` keys with their accessible names. All existing suites keep passing (AC-5).

Docs update in the same slice: none needed — the per-workspace READMEs describe behavior, not pixel behavior; nothing they say becomes false. (If a display change makes a README sentence false, fix that sentence here — spec.md's single sanctioned exception to its "no per-service README edits" non-goal.)
