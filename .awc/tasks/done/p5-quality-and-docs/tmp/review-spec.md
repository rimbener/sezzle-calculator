# Spec review — p5-quality-and-docs

**Verdict: CHANGES_REQUESTED** — 0 blockers, 0 majors, 4 minors (all open; first review round, nothing prior to resolve).

Reviewed against: `tmp/user-story.md`, both interview logs, `docs/PRD-P0.md`, `docs/spec-phases.md`, `docs/PRD-P1.md`, `AGENTS.md`, and the current state of every path the bundle names (`packages/ui/src/display.tsx`, `packages/ui/src/styles/{components.css,design-system.css,tokens/*}`, `apps/sezzle-calculator/src/App.css`, root `README.md`, `.nvmrc`).

## Findings

### 1. minor — resolved — acceptance-criteria.md AC-9 verifies less of the spec-phases.md strike than subtask-3 promises

AC-9 scopes its `docs/spec-phases.md` check to "the phase-4/5 rows", but the audit/WCAG content also lives in:

- the ordering rationale, line 49: "a responsive pass and an accessibility audit need a working UI to run against";
- the phase-3 section's out-of-scope pointer, line 139: "the responsive pass and the accessibility audit (phase 5)";
- the phase-4 section's out-of-scope pointer, line 181 (same sentence);
- the phase-5 section heading, line 201 ("responsive pass, accessibility audit and README") and its in-scope bullet, lines 208–210 (WCAG 2.2 AA, axe/Lighthouse).

subtask-3's prose does promise the broader sweep ("any other place it is stated as this phase's scope"), so the bundle is internally inconsistent: a fix implementing AC-9 to the letter leaves stale sentences claiming phase 5 contains an accessibility audit, and AC-9 — the thing verified — passes anyway. (The launch-args code block at line 204 is verbatim history, like `docs/prompts.md`; leaving it is correct and not part of this finding.) Fix: broaden AC-9's parenthetical to the whole strike subtask-3 describes, e.g. "…or `docs/spec-phases.md` (the phase rows and every phase-3/4/5 scope sentence)".

**Resolved:** AC-9's `docs/spec-phases.md` clause is broadened to the whole strike subtask-3 describes — no sentence outside the verbatim launch-args code block may still name an accessibility audit or a WCAG 2.2 AA target as phase 5's scope — with the today-naming places enumerated (phase-5 row, ordering rationale, phase-3/4 out-of-scope pointers, phase-5 heading and in-scope text) so the check stays mechanical.

### 2. minor — resolved — subtask-3 leaves `docs/PRD-P1.md` citing a requirement it strikes

`docs/PRD-P1.md:33` (FE-9) reads: "(Basic keyboard operability of all controls is already P0 — FE-12; this adds typed shortcuts.)". After subtask-3 strikes FE-12 from PRD-P0, this P1 citation dangles — it asserts a P0 requirement that no longer exists. The recorded human decision (story interview entries 1–2) scoped the strike to PRD-P0 + spec-phases + the request line, and the reviewer does not relitigate that breadth — but the strike's unspecified edge is unaddressed everywhere: not in spec.md's Surfaces or non-goals, not in subtask-3's paths, and subtask-3 explicitly handles only `docs/prompts.md` (leave alone) and `docs/REQUIREMENTS.md` (leave alone). Fix: one line in subtask-3 — either sweep the dangling citation or record leaving it deliberately, the way `docs/prompts.md` is recorded.

**Resolved:** recorded as a deliberate leave, the way `docs/prompts.md` is recorded — subtask-3 now carries a "Leave `docs/PRD-P1.md` alone, deliberately" paragraph: the dangling FE-9 citation is named, the why is the recorded strike breadth (story entries 1–2, which does not reach PRD-P1), and the implementer is told to leave it as-is. Sweeping PRD-P1 was rejected because it would widen the human's locked strike scope without a human call.

### 3. minor — resolved — subtask-1's falsified-README guard contradicts spec.md's non-goal and its own paths

spec.md non-goals: "editing the per-service READMEs' content". subtask-1's paths list no README. Yet subtask-1's closing line instructs: "If a display change makes any README sentence false, fix that sentence here, not in a trailing subtask." A fix step honoring the non-goal would refuse the very edit the guard orders, and the guard's target file is outside the paths scope downstream reads. (Context: the guard should never fire — `apps/sezzle-calculator/README.md`'s readout claims are behavioral, not pixel-level, and `packages/ui` has no README — but the bundle as written holds the contradiction.) Fix: reconcile — either carve the guard out of the non-goal ("no planned edits, except the correctness guard in subtask-1") or add the README to subtask-1's paths.

**Resolved:** carved out of the non-goal (first of the reviewer's two options) — spec.md's non-goals now read "no planned edits; the single sanctioned exception is subtask-1's correctness guard", and subtask-1's guard line cites that carve-out explicitly. No README was added to paths: none is planned, so a paths entry would have been a phantom path.

### 4. minor — resolved — user-story.md's repo-fact claim is wrong as stated

`tmp/user-story.md` line 9: "Today the SPA has no `@media` queries anywhere (app or `@repo/ui` CSS)". Two `@media` rules exist in `@repo/ui`: `packages/ui/src/styles/design-system.css:84` (`max-width: 480px`, demo-page padding) and `packages/ui/src/styles/components.css:572` (`prefers-reduced-motion`). The substantive point survives — `apps/sezzle-calculator/src` genuinely has no responsive rules, and the two rules are a demo stylesheet tweak and a motion guard, not shell layout — and no downstream artifact (spec.md, ACs, subtasks) repeats the absolute claim. Recorded for trail accuracy; correct the sentence or leave it as a known slip.

**Resolved:** the sentence was corrected (verified against the repo: no `@media` in `apps/sezzle-calculator/src`; exactly two in `@repo/ui` styles) — user-story.md line 9 now reads that the SPA's own styles carry no `@media` queries, and names the two `@repo/ui` rules as non-shell-layout (demo-page padding tweak, `prefers-reduced-motion` guard).

## Verified sound (no finding)

- **Approach:** all three slices name their approach with a ruled-out alternative; each call is a recorded human decision (spec interview 1–2, story interview 1–4). The length-step mechanism, shrink-to-fit (truncation rejected), root+links README, and the FE-12 strike are all on the record — nothing here is the reviewer's taste.
- **Fit with locked design:** no new dependency (AC-10 bars axe/Lighthouse; nothing else added); `.nvmrc` value `22.22.2` matches root `package.json` `engines.node >=22.22.2` (verified); design-system rules carried in spec Approach + subtask-1 prose; CLAUDE.md → AGENTS.md symlink verified, so subtask-3's "follows automatically" holds (AGENTS.md:95 carries the WCAG line).
- **Current-state claims:** `.sc-display__value` does clip today (`overflow: hidden; text-overflow: ellipsis`, components.css:308–311); `--tap-min: 44px` / `--key-size: 60px` tokens exist and `.sc-key` uses them; root `README.md` is the stock starter; `.nvmrc` absent.
- **AC-10's DOM contract holds today:** `Display` is `role="status" aria-live="polite"` (display.tsx:16); `Key` renders native `<button>` with an aria-label fallback (key.tsx:22–26); `Callout` is `role="alert"`/`"status"` (callout.tsx:17). Nothing for the subtask to repair.
- **Criteria:** AC-1…AC-10 each observable/mechanically checkable, uniquely id'd, exactly one owning subtask; regression (AC-5) and preservation (AC-10) guard the strike's "foundations stay" rule.
- **Subtasks:** three vertical slices, independently green; ACs collectively covered with no orphan; `subtasks.md` index adds no per-subtask detail; `docs` discipline is in-slice (subtask-1 records its no-docs-needed call with a guard — see finding 3 for its wording; slices B and C are docs themselves); no `refactor:` entries, correctly — the readout change is new behavior owning AC-3/AC-4, not a behavior-preserving move.
- **Paths:** every path real and consistent with layering (`display.test.tsx` is the to-be-created test home beside `display.tsx`, matching the existing `keypad.test.tsx` convention, and its app-side alternative is already scoped by the following glob entry; `.nvmrc` marked new).
