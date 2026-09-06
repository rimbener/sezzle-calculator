# dod.md — p5-quality-and-docs · validate · base: main

## Verdict

**PASS** — all dimensions checked against the working tree, evidence cited per row. Objective gate re-run by this validator: `npx turbo run lint check-types test --output-logs=errors-only` → **15 successful / 15 total** (turbo input-hash cache keyed to this exact tree; the trail's forced runs — tdd-2's `--force` 15/15, the post-shrink gate — populate it). Working tree clean except one untracked trail file (`tmp/review-verdict.md`). Dependency diff vs `main` (`git diff main -- '**/package.json' '**/package-lock.json'`) is **empty**.

Review state: `review.md` verdict **RESOLVED — all findings resolved**; zero open blockers/majors/minors (finding 3, the only minor, is resolved and pinned by a test, not merely accepted — nothing needs human-acceptance listing). Resolutions checked for run-evidence: finding 1 was RED-proven by a temporary `axe-core` injection, since reverted (no axe/Lighthouse in any workspace manifest — verified by grep, zero hits); finding 2's import is now `@repo/ui/display` (`display-fit.test.ts:3` — verified); finding 3's README fix landed (`README.md:99` keeps "x% of y" + pointer, formula/example gone — verified) with the pinning tests in `scope-docs.test.ts:132` and `README.md` added to the SPA test task's turbo inputs (`apps/sezzle-calculator/turbo.json` — verified). Note for the trail: `tmp/review-verdict.md` still holds the round-4 raw verdict (`CHANGES_REQUESTED`, 22:47); the durable `review.md` record (22:49, after fix commits c08e26b/006d679) supersedes it with the resolved findings table — judged by its own shape, as §Protocol 4 requires.

## Checklist

### Functionality
- [x] **AC-1** — `App.test.tsx:237` `App shell styles — the 360px floor (AC-1)`; token arithmetic 4×48+3×8+2×16+2×2 (+2×12 shell padding) = 276 ≤ 360. Green in the gate.
- [x] **AC-2** — `keypad.test.tsx:83` `keys meet the 44px touch floor at any width, 360px included (AC-2)`; key tokens 60/48 ≥ `--tap-min` 44. Green in the gate.
- [x] **AC-3** — `display.test.tsx:19` (spec examples `123456789012345`→step 2, `1e+21`→step 0), `:53` (ladder fit arithmetic ≤ 285px at 0.6em, no `text-overflow`/`ellipsis` — re-verified in `components.css`: only `[data-fit="1".."10"]` rules, no truncation property), `display-fit.test.ts:8` (every producible value ≤ step 10). Green in the gate.
- [x] **AC-4** — `display.test.tsx:7` (equal-length→equal step, monotone); `readoutFitStep` (`display.tsx:14-22`) is a pure function of `value.length`, `data-fit={readoutFitStep(value)}` at `display.tsx:40`. No runtime measurement. Green in the gate.
- [x] **AC-5** — gate 15/15 (re-run by this validator); the two edited existing test files (`App.test.tsx`, `keypad.test.tsx`) are additions only — `git diff main` shows **0 deleted lines** across both.
- [x] **AC-6** — `.nvmrc` = `22.22.2` = `engines.node >=22.22.2` (root `package.json:19`); README prerequisites carry the npm-major `EBADDEVENGINES`-by-design note (`README.md:47-51`); every documented command exists as a root script (`dev`, `test`, `test:watch`, `build`, `lint`, `check-types`, `format` — verified against `package.json:4-12`; `npm install` is npm built-in). tdd-2 ran the commands verbatim from a fresh clone, forced, 15/15.
- [x] **AC-7** — README diagram SPA :5173 → api-gateway :3000 → calc-service :3001 (`README.md:59-74`, matches the services' env defaults); `## Assumptions and trade-offs` (`README.md:107`) names sync HTTP, static env-var config, one calc service; links to all four per-service READMEs + `docs/PRD-P0.md`/`docs/PRD-P1.md` (`README.md:132-142`) — all paths exist.
- [x] **AC-8** — tdd-2's live UC-11 walkthrough (record, run as written): suites forced 15/15, both services bound :3001/:3000, UC-1/2/3/4/5/6/7/8 exercised via curl and UI under the 10-minute budget; the README's walkthrough curl targets `POST /api/v1/calculate` with contract-matching outcomes (400 `VALIDATION_ERROR`, 422 domain codes, 502/504 `SERVICE_UNAVAILABLE`).
- [x] **AC-9** — `docs-fe12-strike.test.ts:19-40` (three tests: docs scan, AGENTS.md keep+drop, launch-args record preserved), green in the gate. Independent re-verification by this validator: case-insensitive grep `FE-12|WCAG|axe|Lighthouse|accessibility|4\.5:1` over `docs/PRD-P0.md`, `docs/spec-phases.md`, `AGENTS.md` → the **only** hit is the verbatim launch-args line `docs/spec-phases.md:203`, AC-9's sanctioned carve-out.
- [x] **AC-10** — `no-a11y-tooling.test.ts:22` (root + all seven workspaces, four dependency sections) green; this validator re-grepped every workspace `package.json` for axe/Lighthouse → zero hits; foundations untouched: `display.tsx:34` `role="status" aria-live="polite"`, `callout.tsx:17` `role="alert"/"status"`, `key.tsx:22` native `<button>`; `display.test.tsx:42` and `callout.test.tsx` pin the contract.
- [x] No `refactor:` entries exist for this task (spec.md, subtasks.md, all three tdd records) — no `preserves:` clause owed.
- [x] Task does what spec.md says, error paths included: no runtime/API/error-envelope change (services absent from the diff; display change is presentational); spec examples pinned as tests.

### Conventions
- [x] Per-workspace style holds where the diff touches: `packages/ui` semicolons/double quotes (`display.tsx` read by this validator); `apps/sezzle-calculator` single quotes/no semicolons (test files read). Design-system rules in the new CSS: no raw hex/px (pinned by the green ladder test, which scans the Display section); hard borders / zero-blur shadows / `steps(1,end)` blink untouched (not in the diff's touched rules).
- [x] Token mirror rule honored: the new `--text-readout-2xs` exists in `packages/ui/src/styles/tokens/typography.css` and the design-system skill copy; `BRAND.md` type-scale line updated (`.agents/` and `.opencode/` hardlinked — one edit, both copies).

### Architecture & dependencies
- [x] Layering intact: `apps/calc-service` and `apps/api-gateway` are absent from `git diff main --name-only` — services still never import each other; no arithmetic moved; the SPA still owns no arithmetic (display change is sizing only).
- [x] **No dependency change**: manifest/lockfile diff vs `main` is empty — nothing needs a recorded human decision; tdd-1's temporary axe-core injection left no residue (verified).
- [x] No surface its design docs don't call for: every changed file sits in spec.md's Surfaces list or is the convention-mandated token mirror (`BRAND.md`/skill tokens) or `.awc/` trail bookkeeping; `.nvmrc` is specced (XC-2/AC-6); `apps/sezzle-calculator/turbo.json`'s input addition is finding 3's recorded fix.

### User surface
- [x] New user-facing behavior = the readout fits instead of clipping — spec's own examples are the pinned tests; no behavior, message, or API change otherwise (existing suites green, additions-only test edits).
- [x] Docs updates landed: root README + `.nvmrc` (slice B), FE-12 strike in `docs/PRD-P0.md` / `docs/spec-phases.md` / `AGENTS.md` (slice C, verified above), `BRAND.md` mirror (slice A).

### Security
- [x] No secret in the diff: README/`.nvmrc` carry versions, ports, and env-var names only (grep for secret-shaped strings → one prose hit, benign); no logs, no committed credentials.
- [x] Nothing user-controlled reaches a path, command, or query: tests read fixed repo-relative paths; the display renders values through React's text escaping; no shell/interpreter anywhere in the diff.
- [x] Resources: nothing spawned or opened that needs teardown (no new handles, processes, or sockets in the diff).

### Testing rigor
- [x] Every criterion traceable to a test across tdd-1/tdd-2/tdd-3's maps; this validator confirmed the named test files/describes exist (`display.test.tsx:7,19,42,53`, `keypad.test.tsx:83`, `App.test.tsx:237`, `display-fit.test.ts:8`, `no-a11y-tooling.test.ts:22`, `docs-fe12-strike.test.ts:19-37`, `scope-docs.test.ts:132`, `callout.test.tsx`) and all pass in the re-run gate. Docs-slice criteria (AC-6/7/8) ride the scanner tests + the tdd-2 live walkthrough record.
- [x] AC-10's no-tooling clause has a test that demonstrably bites (RED under axe-core injection, reverted) — not a tautology.

### Observability & docs
- [x] Logs/state: nothing new to observe (no runtime behavior added); the display's `role="status"` announcement contract unchanged and pinned.
- [x] Project docs updated and consistent with the code: README documents only commands that exist (verified against root scripts) and only routes/codes the contract and gateway implement (re-verified by review-slice-2 and spot-checked here); AGENTS.md/PRD/spec-phases carry no stale WCAG-audit claim (grep evidence above); slice A's "docs: none needed" call verified — no doc claims the readout clips/truncates.

### Open findings
- [x] `review.md` has no open blocker, major, or minor. `review-spec.md`'s 4 minors: all resolved (spec-bundle edits, verified in the current spec/AC text). `review-slice-1`'s 2 majors: resolved with run evidence. `review-slice-2`/`-3`: APPROVED, zero findings. Nothing requires human acceptance.
- [x] No finding was resolved by inspection alone (§Protocol 3): finding 1's fix has RED-then-green evidence, findings 2/3 have green gates plus the pinning tests this validator re-read.
- [x] Review history non-empty and well-shaped: `review.md` (verdict + findings table, all `resolved`), `review-spec.md` (verdict + 4 resolved minors), `review-slice-1/2/3.md` (verdicts + findings), `shrink-comments.md` (one line per rewritten file + "nothing to cut" section).

## Notes for the workflow
- The one line this validator would flag for trail hygiene (not a DoD failure): `tmp/review-verdict.md` (raw round verdict, `CHANGES_REQUESTED`) predates the resolved-state `review.md`; the durable record governs.
- Opening and merging the PR is the manual human step afterward.
