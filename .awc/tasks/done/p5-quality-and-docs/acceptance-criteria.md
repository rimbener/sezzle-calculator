# Acceptance criteria — p5-quality-and-docs

Plain format: one uniquely-ID'd criterion per behavior, each owned by exactly one subtask.

- **AC-1** — At a 360px-wide viewport, the calculator page shows no horizontal scroll.
- **AC-2** — At a 360px-wide viewport, every interactive control (all keypad keys) has a touch target of at least 44px in both dimensions.
- **AC-3** — A long result on the readout (e.g. `123456789012345` or `1e+21`) shrinks to fit: the full value stays visible at 360px, never clipped, ellipsized, or truncated.
- **AC-4** — Readout sizing is deterministic: values of equal character length always render at the same readout size, and a longer value renders at the same or a smaller size — the size step derives only from the value's character count, never from runtime measurement.
- **AC-5** — No regression: every existing test suite across the monorepo (`npm test` at the root) passes, and the calculator's keys, display, error presentations, and busy state behave as phases 3–4 specced.
- **AC-6** — The root `README.md` is self-sufficient for setup: from a fresh clone, its documented prerequisites (Node pinned at 22.22.2 via `.nvmrc` and `engines`, with the npm-major warning note), install, run, and test commands work exactly as written.
- **AC-7** — The root `README.md` carries an architecture diagram of the three workspaces (SPA → api-gateway :3000 → calc-service :3001) and states the assumptions and trade-offs (why sync HTTP, static config, one calc service), and links the per-service READMEs as the deep documentation for API details and curl examples.
- **AC-8** — UC-11 walkthrough: a reviewer following only the root README can clone → install → start both services and the SPA → run all test suites green → exercise UC-1…UC-8 via the UI and curl — in under 10 minutes, with no undocumented steps.
- **AC-9** — FE-12 no longer appears as a requirement in `docs/PRD-P0.md` (goal 7's accessibility goal, §7.2's FE-12 entry, §11's phase rows) or `docs/spec-phases.md`: no sentence outside the verbatim launch-args code block still names an accessibility audit or a WCAG 2.2 AA target as phase 5's scope — the phase-5 row's coverage list, the ordering rationale, the phase-3 and phase-4 out-of-scope pointers, and the phase-5 heading and in-scope text name it and must not after the strike. `AGENTS.md` states the 360px-wide floor and native `<button>`/`<input>` elements without the WCAG 2.2 AA target.
- **AC-10** — No accessibility tooling is added (no axe or Lighthouse dependency in any workspace) and the existing foundations are untouched: `Display` keeps `role="status"`/`aria-live`, keys stay native `<button>` elements with accessible names, `Callout` keeps its `role="alert"`/`"status"`.
