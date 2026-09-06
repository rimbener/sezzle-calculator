# Spec interview — p5-quality-and-docs

Mode: write-bundle. Format: plain. Story: `.awc/tasks/in-progress/p5-quality-and-docs/tmp/user-story.md` (read first — settles the problem side; no `## Open questions` heading, so nothing handed over). Facts read before the first question: `packages/ui/src/display.tsx` (Display renders `sc-display__value` inside `.sc-display` which has `overflow: hidden` — long values are clipped today), `packages/ui/src/styles/components.css` (`.sc-display__value` font sizes from `--text-readout-{sm,md,lg}` tokens; `.sc-keypad` is `repeat(4, minmax(var(--key-size-sm), 1fr))` ≈ 63px columns at 360px viewport — no overflow), `apps/sezzle-calculator/src/App.css` (one centered column, `max-width: var(--shell-max)` 420px), `apps/sezzle-calculator/index.html` (viewport meta present), `CLAUDE.md` is a symlink to `AGENTS.md`, and `AGENTS.md:95` carries the line "Target is WCAG 2.2 AA with native `<button>`/`<input>` elements and a 360px-wide floor."

## 1 — readout mechanism
Q: Shrink-to-fit has no pure-CSS way to fit text to its container, and today the readout clips overflow (`overflow: hidden` on `.sc-display`). The build therefore touches `@repo/ui`'s `Display`. Which mechanism do you want: (a) the `Display` component derives a size step from the value's character count (a `data-`/class change in display.tsx) and the CSS maps each step to a smaller readout size from the type scale — no runtime measurement, deterministic and testable; (b) `Display` measures the rendered text and sets an exact size at runtime (resize-observer-driven — always exact, but nondeterministic and harder to unit-test); or (c) some other mechanism you have in mind?
A: Length-step sizing (Recommended).

## 2 — docs strike breadth
Q: The story settles that the FE-12 strike edits `docs/PRD-P0.md` (§2 goal 7, §7.2 FE-12, §11 phase rows) and `docs/spec-phases.md` (phase rows). But `AGENTS.md` (symlinked as `CLAUDE.md`) also states the target — "Target is WCAG 2.2 AA with native `<button>`/`<input>` elements and a 360px-wide floor" (line 95) — and the README step must not contradict repo guidance. Does the strike also rewrite that AGENTS.md line (keeping the native-elements and 360px-floor parts, dropping the WCAG target), or does AGENTS.md stay as-is?
A: Rewrite AGENTS.md line (Recommended).

All areas settled — surfaces, the readout mechanism, the docs-strike breadth, failure/compatibility semantics (nothing new; existing behavior must not regress), reshape calls (both the human's), and non-goals. Nothing open; bundle follows.
