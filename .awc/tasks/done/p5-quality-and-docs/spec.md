# Spec — p5-quality-and-docs (Phase 5: responsive pass, root README, FE-12 strike)

## Summary

The last P0 phase closes the PRD out with three vertical slices: (1) a responsive pass that guarantees the 360px floor and makes the readout fit long values instead of clipping them; (2) a root `README.md` + `.nvmrc` that let a reviewer go from clone to a fully verified setup in under ten minutes; (3) the human-approved removal of FE-12 (WCAG 2.2 AA) from the PRD and repo guidance. Acceptance criteria: [acceptance-criteria.md](acceptance-criteria.md).

## Surfaces touched

- `packages/ui/src/display.tsx` — length-step sizing on the readout value
- `packages/ui/src/styles/components.css` (+ a token if a new readout size step is needed) — step-to-size mapping, 360px checks
- `apps/sezzle-calculator/src/App.css` — shell behavior at the 360px floor
- `README.md` (root, replaces the Turborepo starter), `.nvmrc` (new, repo root)
- `docs/PRD-P0.md`, `docs/spec-phases.md`, `AGENTS.md` (the FE-12 strike)

## Approach

**Readout: length-step sizing** — `Display` derives a size step from the value's character count and emits it as a `data-` attribute or class; CSS maps each step to a smaller readout size from the type scale. Runtime measurement was rejected as nondeterministic and hard to test; the spec's constraint is the determinism property (AC-4), not the exact steps — thresholds are chosen in implementation. The readout never truncates: the full value stays visible at 360px.

**README: root + links** — the root README is self-sufficient for prerequisites, install, run, test, the architecture diagram, and the assumptions/trade-offs; it links the per-service READMEs (calc-service, api-gateway, SPA, contracts) as the deep documentation for API details and curl examples. Everything inline would duplicate the per-service docs and drift; UC-11 needs the root README to carry the verification path, not every detail.

**FE-12: struck, not implemented** — FE-12 (WCAG 2.2 AA audit) is struck from `docs/PRD-P0.md` (§2 goal 7, §7.2, §11 phase rows), `docs/spec-phases.md` (phase 4/5 rows), and `AGENTS.md` (the "Target is WCAG 2.2 AA…" line keeps its native-elements and 360px-floor parts). No audit tooling (axe/Lighthouse) is added; the existing accessibility foundations (native `<button>`/`<input>`, `aria-live` display, `role="alert"` errors) are untouched. An unstruck FE-12 would leave the PRD claiming an unimplemented must-have.

## Error contract

None new. No runtime behavior, message, or API change; the shared error envelope and every existing error presentation are untouched. The README's only correctness obligation is truthfulness: every documented command must work from a fresh clone (UC-11).

## Non-goals

Audit tooling of any kind (FE-12 struck); typed keyboard shortcuts (FE-9, P1); health endpoints (P1); CI/CD and hosting (PRD non-goal); arbitrary-precision arithmetic (PRD non-goal); truncating readout values; re-stating XC-3's percentage definition in the root README (it lives in `apps/calc-service/README.md` — the root README may reference it); editing the per-service READMEs' content (the single sanctioned exception is subtask-1's correctness guard: if a display change makes a README sentence false, fix that sentence in slice A); any reshaping beyond the surfaces listed.

## Resolved decisions

| Decision | Call | Why |
| --- | --- | --- |
| `.nvmrc` value | `22.22.2` | The repo's `engines.node >=22.22.2` floor (root `package.json`); the PRD requires the pin via `.nvmrc` and `engines` |

The readout mechanism, long-result behavior, README shape, FE-12 removal, and docs-strike breadth are decided in **Approach** above; their testable forms live in [acceptance-criteria.md](acceptance-criteria.md).

No `refactor:` entries.
