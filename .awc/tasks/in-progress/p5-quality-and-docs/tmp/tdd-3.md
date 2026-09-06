# tdd-3.md — Slice C — the FE-12 docs strike (subtask-3)

Criterion → test map:

- AC-9 (docs scan) → `apps/sezzle-calculator/src/docs-fe12-strike.test.ts`: `FE-12 is struck from the docs (AC-9) > names no audit or WCAG target in PRD-P0 or spec-phases outside the launch-args record` (both files scanned line-by-line for `\bFE-12\b|WCAG|axe|Lighthouse|accessibility|4\.5:1`; the verbatim p5 launch-args line is the one carve-out and is excluded)
- AC-9 (AGENTS.md keep+drop) → same file: `states the 360px floor and native elements in AGENTS.md without the WCAG target` (no `WCAG` anywhere; the native `<button>`/`<input>` elements and the 360px-wide floor still stated — the strike must not eat the foundations)
- AC-9 (record preserved) → same file: `keeps the verbatim p5 launch-args record` (the launch-args line survives the strike, per AC-9's carve-out)
- The scan's `docs/` truthfulness rides the red evidence: pre-strike the scan named exactly the 12 lines AC-9 lists (goal 7, the FE-12 entry, §11's phase row, the coverage list + depends-on cell, the ordering rationale, the phase-3 and phase-4 out-of-scope pointers, the phase-5 heading and in-scope text, AGENTS.md's WCAG target); `docs/prompts.md`, `docs/PRD-P1.md` and `docs/REQUIREMENTS.md` sit outside the scan (historical records, strike breadth as recorded in the story interview) and are untouched in the diff.

Cycles:

1. AC-9 — RED: scanner test written against the struck-requirements tree as it stood (goal 7, FE-12 entry, audit rows all present) → 2 of 3 tests failed, each naming the exact offending lines; GREEN: PRD-P0 (goal 7 dropped, FE-12 entry deleted, §11 phase-4 row loses "accessibility audit (FE-12)"), spec-phases (coverage list `FE-6, XC-2`, depends-on cell "the UI it finishes", rationale loses the audit, both out-of-scope pointers, heading, in-scope text replaced with the readout-fit clause), AGENTS.md (WCAG target dropped; native elements + 360px floor kept — the `CLAUDE.md` symlink follows).
2. Full-suite gate: `npx turbo run lint check-types test --output-logs=errors-only` → 15 successful / 15 total.

No `refactor:` entries (the spec records none for this task).
