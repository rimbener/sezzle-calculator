# review — p5-quality-and-docs · full-review · base: main

Verdict: **CHANGES_REQUESTED** — 1 new finding (minor). Two earlier findings from
review-slice-1 are kept below as `resolved`.

Diff basis: `main..HEAD` (4 slice commits + trail commit 605be2e), working tree clean.
Suites NOT re-run (hard rule — the workflow gates on them): the trail records
15/15 green at tdd-2 (forced) and tdd-3, and review-slice-3 confirmed the turbo
cache keyed to this exact tree; HEAD since adds only `.awc/` trail bookkeeping.
No red suite appears anywhere in the trail.

## Dependency diff (ruled every round)

`git diff main -- '**/package.json' '**/package-lock.json'` is **empty — no
dependency change**: no manifest, lockfile, or patch touched; no new lifecycle
script, version pin, or major jump; nothing newly trusted. (tdd-1's fix step
temporarily injected `axe-core` to prove the no-tooling pin bites, then
reverted — nothing of it remains.)

## Lens 1 — spec scope & test traceability `[code]`

Every AC maps to ≥1 concrete test (per-slice records verified against the diff):

- AC-1 → `apps/sezzle-calculator/src/App.test.tsx:237` (token arithmetic: 4×48+3×8+2×16+2×2 = 252, +2×12 shell padding = 276 ≤ 360; tokens re-checked in `spacing.css`: space-3=8, space-4=12, space-5=16, border-2=2, key-size-sm=48). Holds.
- AC-2 → `packages/ui/src/keypad.test.tsx:82` (key min 60/44 ≥ --tap-min 44; column floor --key-size-sm 48 ≥ 44). Holds.
- AC-3 → `packages/ui/src/display.test.tsx` (spec examples pinned: `123456789012345`→step 2, `1e+21`→step 0; ladder CSS fits 285px at 0.6em — re-computed by hand: 60×0.6×7=252, 30×0.6×15=270, 19×0.6×25=285, 8×0.6×59=283.2, all ≤285; no `text-overflow`/`ellipsis`; tail wraps) + `apps/sezzle-calculator/src/calculator/display-fit.test.ts` (15-char operand cap, 24-char extreme double, all contract+app messages ≤ step 10). Holds.
- AC-4 → `display.test.tsx:7-17` (equal-length→equal step, monotone) — `readoutFitStep` (`display.tsx:20-28`) is a pure function of `value.length`, `data-fit` on the value (`display.tsx:42`). Holds.
- AC-5 → gate recorded 15/15; the two edited existing test files (`App.test.tsx`, `keypad.test.tsx`) are additions only (0 deleted lines). Holds.
- AC-6/AC-7/AC-8 (docs) → re-verified mechanically: `.nvmrc`=`22.22.2` = `engines.node >=22.22.2`; every README command exists in the root `package.json` scripts; turbo filter names `api-gateway`/`calc-service` are real workspace names; all six linked paths exist; diagram matches the config defaults (3000/3001/5173, CORS, 3s deadline, one retry); walkthrough routes/codes match the contract and tdd-2's live UC-11 run. Holds.
- AC-9 → `apps/sezzle-calculator/src/docs-fe12-strike.test.ts` + independent case-insensitive grep over PRD-P0/spec-phases/AGENTS.md: the only surviving hit is the verbatim launch-args line (`docs/spec-phases.md:203`), the one AC-9 carve-out. `CLAUDE.md` is a symlink to AGENTS.md (propagates). Holds.
- AC-10 → `apps/sezzle-calculator/src/no-a11y-tooling.test.ts` (root + 7 workspaces, four dependency sections) + untouched foundations (`role="status"`/`aria-live` pinned in `display.test.tsx:59`, `role="alert"`/`"status"` in `callout.test.tsx`, native `<button>` keys pinned by the pre-existing `Calculator.test.tsx`). Holds.

**Finding 3 (minor, [code], OPEN)** — `README.md:99` re-states XC-3's percentage
definition — `x% of y = `(x / 100) × y` — so % of 15 over 200 is 30` — a
formula-plus-worked-example duplicate of `apps/calc-service/README.md:57`. The
spec's non-goals bar exactly this: "re-stating XC-3's percentage definition in
the root README (it lives in `apps/calc-service/README.md` — the root README may
reference it)"; subtask-2 grants only "may reference XC-3's percentage
definition where it lives"; the story's note 30 says the same. The compliant
reference already exists at `README.md:135`. Fix: one docs line — the
`percentage` row keeps "x% of y" and drops the formula/example. Not
human-decision-covered: the interview logs record no such call, and the spec's
Resolved-decisions table lists only `.nvmrc`.

Scope: every diff file is inside the spec's surfaces — production
(`display.tsx`, `components.css`, both `typography.css` copies), tests
(subtask-1/3's named paths), docs (`README.md`, `.nvmrc`, PRD-P0, spec-phases,
AGENTS.md), plus the `.awc/` trail (exempt bookkeeping) and `BRAND.md`
(`.agents/…` + hardlinked `.opencode/…`, inode 869636246 — the AGENTS.md
"change both copies" rule mandates this mirror). `App.css` listed in
subtask-1's paths was correctly untouched (AC-1 holds by characterization, per
the spec's "guarantee, not a rework"). No `refactor:` entries exist (spec and
subtasks record none) — nothing to pin with `preserves:`.

## Lens 2 — architecture & dependencies `[arch]`

Layering respected: `packages/ui` gains only the specced length-step mechanism
(specced as "a `data-` attribute or class"); it imports nothing new. The SPA's
tests reach `@repo/ui` through the export map (`@repo/ui/display` — slice-1
finding 2's fix) and read repo files via fs only, matching the established
purity-test precedent. No new dependency, abstraction, indirection, or config
surface (`.nvmrc` is specced by XC-2/AC-6). Services untouched — gateway and
calc-service still never import each other; no arithmetic moved anywhere.
Compatibility: no persisted state, schema, or wire format changed; the DOM
addition (`data-fit`) is additive. Clear.

## Lens 3 — performance `[perf]`

Not docs-only (display + CSS changed), so judged: `readoutFitStep` is a
≤10-iteration loop over a constant array per render — trivial, and sizing work
stays in CSS. No serialization of concurrent work, no busy-wait, no unbounded
buffering, no repeated I/O (all fs reads are test-time), nothing heavy loaded
on cold paths. The busy blink keeps `steps(1,end)`. Clear.

## Lens 4 — security `[security]`

N/A — no trust boundary is touched: no shell/query/interpreter anywhere in the
diff; no secrets (README/.nvmrc carry versions and ports only); no
user-controlled value becomes a path segment (tests read fixed `__dirname`-
derived paths); no process spawning or handles to tear down; rendered values
go through React's text escaping. N/A with these reasons recorded.

## Durable findings trail

| # | Lens | Severity | Location | Finding | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | [code] | major | tdd-1.md:7 / acceptance-criteria.md:13 | AC-10's no-tooling clause had no concrete test | resolved — `no-a11y-tooling.test.ts`, RED proven by axe-core injection, reverted |
| 2 | [arch] | major | apps/sezzle-calculator/src/calculator/display-fit.test.ts:3 | Cross-workspace relative module import bypassed `@repo/ui`'s export map | resolved — import is now `@repo/ui/display`, suite green unchanged |
| 3 | [code] | minor | README.md:99 | Re-states XC-3's percentage definition + worked example, which the spec's non-goals forbid (calc-service README is its home; root README may only reference it — reference already at README.md:135) | resolved — row keeps "x% of y" plus a pointer to the calc-service README; formula/example dropped; pinned by the `the root README references XC-3, not restates it` tests in `scope-docs.test.ts` (README.md added to the SPA test task's turbo inputs) |

## Verdict

**RESOLVED** — all findings resolved.
