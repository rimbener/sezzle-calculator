# Phase 5 — responsive calculator, root README, and the FE-12 strike

**As a** user of the calculator on any screen — phone (360px) through desktop —
**I want** the calculator to fit my screen with every control reachable and every result readable,
**so that** I can use it first-time, without instructions, wherever I am; and **as a Sezzle reviewer**, I want a root README that gets me from clone to a fully verified setup in under ten minutes using only that README.

## Context

This is phase 5, the last P0 phase (`docs/spec-phases.md`): it audits the finished UI (phases 3–4) and documents the services (phases 1–2). Today the SPA's own styles carry no `@media` queries and no guarantee of the 360px floor — `@repo/ui`'s CSS has exactly two, neither of them shell layout: a demo-page padding tweak (`design-system.css:84`) and a `prefers-reduced-motion` guard (`components.css:572`). Touch-target tokens already exist (`--tap-min: 44px`, `--key-size: 60px` in `.sc-key`). The readout renders results with JavaScript's own number-to-string conversion — phase 3's spec explicitly deferred "shrinking or truncating long numbers" to this phase. The root `README.md` is still the stock Turborepo starter, and no `.nvmrc` exists; phase 1's spec reserved both for this phase (XC-2). Per-workspace READMEs (calc-service, api-gateway, the SPA, contracts) already carry run and curl examples.

The request line named FE-12 (accessibility, WCAG 2.2 AA). The human's decision — on the record: **remove FE-12**, and strike it from the PRD too (interview entries 1–2). No audit tooling (axe/Lighthouse) is added; the existing accessibility foundations — native `<button>`/`<input>` elements, `aria-live` display, `role="alert"` errors — stay exactly as-is, with no new acceptance criteria of their own. This removal touches `docs/PRD-P0.md` (§2 goal 7, §7.2 FE-12, §11 phase rows) and `docs/spec-phases.md` (phase 4/5 rows).

## Acceptance criteria

- At a 360px-wide viewport the calculator shows no horizontal scroll, and every control's touch target is ≥44px.
- A long result on the readout shrinks to fit: the full value stays visible at 360px, never truncated or ellipsized.
- The responsive pass is vanilla CSS only (fixed constraint); the `@repo/ui` styling keeps hard borders, no soft shadows/gradients, and the design-system token rules.
- Existing behavior does not regress: all current test suites across the monorepo pass unchanged; keys, display, error presentations, and the busy state behave as phase 3–4 specced.
- The root `README.md` replaces the starter and carries, self-sufficiently: prerequisites with the Node pin (a root `.nvmrc` matching the `engines` floor, 22.22.2), install, run, and test commands that work from a fresh clone, an architecture diagram, and the assumptions and trade-offs (why sync HTTP, static config, one calc service).
- The root README may link the per-service READMEs for API details and curl examples, but a reviewer can install, run, and test the whole system following the root README alone — UC-11: clone → install → start both services and the SPA → run all test suites green → exercise UC-1…UC-8 via UI and curl, in under 10 minutes, with no undocumented steps.
- FE-12 no longer appears as a requirement in `docs/PRD-P0.md` or `docs/spec-phases.md`; the phase-5 task row no longer names it.

## Notes

- **FE-12 removal is a human decision, not a slip** (entries 1–2 of the interview log): "let's remove FE-12" → "Strike from PRD too". No audit dependency, no contrast/landmark work item. The spec step should not re-ask.
- **Readout: shrink to fit** (entry 3) — resolves phase 3's deferral in favor of shrinking; truncation was rejected.
- **README: root + links** (entry 4) — the root README must be self-sufficient for prerequisites/install/run/test plus architecture and trade-offs; per-service READMEs are the deep documentation it links to.
- The workflow's request line still reads "FE-6, FE-12, XC-2" (launch args are verbatim); within this task, "FE-12" means the strike described above, not implementation.
- `.nvmrc` value follows the repo's `engines.node >=22.22.2` floor (root `package.json`); the README should also cover the npm-major note (`devEngines` warns off-22, per AGENTS.md) so a reviewer on npm 11/12 knows the warning is expected.
- XC-3 (percentage definition "stated in README and API docs") was settled in phase 1 — the formula lives in `apps/calc-service/README.md`; XC-2's README may reference it, and this task does not re-litigate XC-3.
- Out of scope: typed keyboard shortcuts (FE-9, P1), health endpoints (P1), CI/CD and hosting (non-goal), arbitrary-precision arithmetic (non-goal).
