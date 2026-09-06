# Story interview — p5-quality-and-docs

Source (recorded before any entry): `FE-6, FE-12, XC-2: responsive pass, WCAG 2.2 AA audit and README` — inline request text pointing into `docs/PRD-P0.md` (FE-6 §7.2, FE-12 §7.2, XC-2 §7.3, UC-11 §8, Goals §2.6–2.7, Users §5). Repo facts read: root `README.md` (still the stock Turborepo starter), no `.nvmrc` anywhere, root `engines.node >=22.22.2`, no axe/Lighthouse dependency in any workspace, no `@media` query in `apps/sezzle-calculator` or `packages/ui` CSS, `--tap-min: 44px` / `--key-size: 60px` tokens exist and `.sc-key` uses them, `Display` is `role="status" aria-live="polite"`, keys are native `<button>` with accessible names, `Callout` uses `role="alert"`/`role="status"`, no `<main>`/`<h1>`/`<label>` in app markup, per-workspace READMEs exist for the app, calc-service, api-gateway, and contracts, phase-1 spec reserved the root `README.md` and `.nvmrc` for this phase (XC-2), phase-3 spec deferred "shrinking or truncating long numbers" on the readout to this phase under FE-6.

## From the source

### Settled
- who — the end user on desktop or mobile (≥360px) for FE-6; the Sezzle reviewer for XC-2 (PRD §2 goal 6, §5 Users, US-7, UC-11). ~~FE-12's assistive-tech user~~ — struck: FE-12 removed (entries 1–2).
- what — responsive layout from 360px with ≥44px touch targets and no horizontal scroll, vanilla CSS only (FE-6); ~~WCAG 2.2 AA with an automated audit, keyboard-only operability, ≥4.5:1 contrast (FE-12)~~ — struck: FE-12 removed (entries 1–2); a root README covering prerequisites, install/run/test commands, an architecture diagram, API documentation with examples, and assumptions/trade-offs (XC-2).
- why — goal 6: a first-time user can perform any operation without instructions on any screen; the reviewer can evaluate the work (it is an assessment).
- success — each remaining requirement's own acceptance line, plus UC-11: a reviewer clones, installs, starts both services and the frontend, runs all test suites green, and exercises UC-1…UC-8 with the UI and curl — under 10 minutes, no undocumented steps.
- surface — the SPA's styles/markup and `@repo/ui` styles for FE-6; the root `README.md` and `.nvmrc` for XC-2 (phase 1's spec explicitly reserved both for this phase).
- out of scope — FE-12 and its audit (struck from the PRD per entries 1–2; existing aria/native-element foundations stay as-is, no audit tooling added), typed keyboard shortcuts (FE-9, P1), health endpoints (P1), CI/CD and hosting (non-goals), arbitrary-precision arithmetic (non-goal; doubles with documented display limitation).
- carried into this phase — long-result handling on the readout, explicitly deferred here by phase 3's spec under FE-6; the root README and `.nvmrc`, explicitly reserved here since phase 1.

### Open
- ~~audit — which tool (PRD allows "axe or Lighthouse") and how it is run — inside the test suite's one documented command, or as its own command the reviewer runs?~~ (settled by removal of FE-12 — entry 1)
- ~~readout — what must a long result do on the readout at 360px: stay fully visible (shrink to fit), or be truncated in a defined way?~~ (settled — entry 3: shrink to fit)
- ~~README — must the root README carry the API docs/examples inline, or may it delegate to the per-service READMEs that already exist?~~ (settled — entry 4: root README self-sufficient for prerequisites/install/run/test + architecture, links to per-service READMEs for API details)

All areas settled — who, what, why, when/where, success, edges, surface, and the one collision (FE-12) have their call. Nothing open; story written.

## 1 — audit
Q: FE-12's acceptance is "an automated audit (axe or Lighthouse) reports no WCAG AA violations." Which tool should this phase standardize on, and where should it run — integrated into the existing Vitest suite (so `npm test` itself would fail on violations) or as a separate command documented in the README that you run against the dev server?
A: let's remove FE-12.

## 2 — scope (collision with the PRD's locked P0 list)
Q: "Remove FE-12" — does that mean drop it from this task's scope only (the PRD keeps FE-12 as an open P0 item), or also strike FE-12 from `docs/PRD-P0.md` (§2 goal 7, §7.2, phase 4/5 in `docs/spec-phases.md`) and from this task's request line? Removing it from the PRD is itself a docs change someone would have to make.
A: Strike from PRD too (Recommended).

## 3 — readout
Q: Phase 3's spec explicitly deferred this to Phase 5 under FE-6: "Results render with JavaScript's own number-to-string conversion — shrinking or truncating long numbers is Phase 5's." On a 360px-wide screen, what must the readout do with a long result (e.g. `123456789012345` or `1e+21`): shrink the readout text to fit so the full number stays visible, or truncate it (ellipsis / scientific notation) with the full value never shown?
A: Shrink to fit (Recommended).

## 4 — README
Q: XC-2's acceptance is UC-11: "a reviewer can install, run, and test using only the README." The repo already has per-workspace READMEs (calc-service, api-gateway, the SPA, contracts) with run and curl examples. Must the new root README carry everything inline — architecture diagram, API documentation with examples, commands — so the reviewer never needs to open a per-service README, or may it stay shorter and point to those READMEs as the deep documentation?
A: Root + links.
