# review-slice-1 — p5-quality-and-docs, slice A (360px shell and fit-to-view readout)

## Suite

Commands run: `npx turbo run test --output-logs=errors-only` — 5 tasks (contracts, ui, calc-service, api-gateway, sezzle-calculator), 5 successful, all turbo-cached (cache is keyed on the current inputs, so this is a green suite on the working tree). No reds. AC-5's gate holds.

## Diff scope

Slice 1 from `Base: main`: branch commit `b23bb8a` (the workflow's own opening bookkeeping — no findings raised on the `.awc/` files it adds) plus the working tree: `packages/ui/src/display.tsx`, `packages/ui/src/styles/components.css`, `packages/ui/src/styles/tokens/typography.css`, `.agents/skills/design-system/{tokens/typography.css,BRAND.md}` (mirror), and pure-addition edits to `packages/ui/src/keypad.test.tsx` and `apps/sezzle-calculator/src/App.test.tsx`, plus three new untracked test files (`packages/ui/src/display.test.tsx`, `packages/ui/src/callout.test.tsx`, `apps/sezzle-calculator/src/calculator/display-fit.test.ts`). Both test-file edits are additions only (0 deleted lines) — no existing test was touched. No `refactor:` entries exist for this task (spec.md and subtasks.md record none), so none had to be ruled.

## Lens 1 — Correctness against the contract

Every map entry in `tdd-1.md` was checked against the diff and is present and concrete:

- AC-4 → `readoutFitStep` purity/monotonicity tests (`display.test.tsx:7-17`) — real, and the implementation (`display.tsx:15-22`) is a pure function of `value.length`. Holds.
- AC-3/AC-4 (DOM) → `data-fit` carried on the value (`display.tsx:42`), both spec examples pinned (`123456789012345` → `2`, `1e+21` → `0`) and the longest error message at step 10 (`display.test.tsx:19-40`). Holds — the 53-char outage message lands on step 10 as claimed.
- AC-10 → readout role/status/scan contract (`display.test.tsx:42-51`), Callout roles (`callout.test.tsx`), keys as native `<button>`s with accessible names pinned by the existing `Calculator.test.tsx:43-70`. Holds.
- AC-3/AC-4 (CSS) → the ladder tests (`display.test.tsx:53-118`): non-increasing per display size (verified against the token values: md 44→44→30→28→23→19→16→14→12→11→8), the 285px × 0.6em fit arithmetic (285 is the 360px column minus conservative scrollbar margin), no `text-overflow`/`ellipsis`, tail step wraps (`overflow-wrap: anywhere`), token exists, no raw hex/px in the section. Holds.
- AC-2 → keypad tap-floor tests (`keypad.test.tsx` new block): `--key-size` 60 ≥ `--tap-min` 44, `--key-size-sm` 48 ≥ 44, column floor pinned. Holds.
- AC-1 → shell arithmetic (`App.test.tsx:237-256`): 4×48 + 3×8 + 2×16 + 2×2 = 276 inside `2 × --space-4` (12px) shell padding ≤ 360. Verified against `App.css` — the keypad is the only fixed-floor child; display/callout are fluid. Holds.
- AC-3 (coverage) → `display-fit.test.ts`: 15-char operand cap, `-1.7976931348623157e+308`, all contract error messages and the three app failure messages all ≤ step 10. Holds.
- AC-5 → the Commands gate above, plus zero edits to existing tests. Holds.

**Finding 1 (test-step, major, resolved)** — AC-10's first clause ("No accessibility tooling is added — no axe or Lighthouse dependency in any workspace", `acceptance-criteria.md:13`) has no concrete test; the map at `tdd-1.md:7` covers only the foundations half of AC-10. The tree today satisfies the clause (no axe/Lighthouse in any package.json or source), but nothing pins it against a later slice adding one — the repo's own purity-scan pattern (`apps/api-gateway/src/no-arithmetic.test.ts`, `apps/sezzle-calculator/src/frontend-purity.test.ts`) is the established shape for exactly this kind of pin. Fix is a test → routed to the test step. *Resolved in the fix step: `apps/sezzle-calculator/src/no-a11y-tooling.test.ts` scans the root and every workspace package.json's four dependency sections for axe/Lighthouse names; demonstrated RED by temporarily injecting `axe-core` into the app's devDependencies, reverted, green on the clean tree.*

## Lens 2 — Project conventions

Design-system rules hold in the diff: no raw hex/pixel in the new CSS (the scan layer's raw `1px`/`3px` stops were tokenized to `--border-1`/`--border-3`, keeping the section inside its own no-raw-px rule), hard borders/zero-blur shadows untouched, busy blink unchanged. Both design-system skill token copies carry the new token (`.agents` and `.opencode` share inode 869636246 — one edit, both copies), and `BRAND.md`'s type-scale line was updated — the AGENTS.md "change both when a token changes" rule is honored. Per-workspace code style matches (semicolons/double quotes in `packages/ui`, single quotes/no semicolons in `apps/sezzle-calculator`). The production changes stay inside subtask-1's named paths plus the convention-mandated token mirror.

**Finding 2 (lens 2, major, open, resolved)** — `apps/sezzle-calculator/src/calculator/display-fit.test.ts:3` imports `readoutFitStep` via a four-level relative path into another workspace's source (`'../../../../packages/ui/src/display'`), reaching around `@repo/ui`'s export map. AGENTS.md documents the package's public surface as `.` and `./*` subpath imports — `@repo/ui/display` resolves `./src/display.tsx` and is the documented way to reach a module the barrel doesn't re-export — and the same file already imports `@repo/contracts` by package name (line 2), so the inconsistency is within one import list. The existing cross-workspace precedent (`frontend-purity.test.ts:9`, `App.test.tsx:240-241`) touches `packages/ui` paths through the filesystem only, never as module imports. Fix is a one-line test import → test-step tagged. *Resolved in the fix step: the import is now `@repo/ui/display`, through the export map as AGENTS.md documents; the display-fit suite stays green unchanged.*

## Lens 3 — User surface

Not N/A — the slice touches the calculator UI. Verified against the spec: the readout now fits instead of clipping (spec's own examples are the pinned tests), no runtime behavior, message, or API changed (the DOM contract test plus the untouched existing suites cover this), and the new names follow existing conventions: `data-fit` (data-attribute), `readoutFitStep`/`FIT_STEP_LIMITS` (camelCase exports), `--text-readout-2xs` (joins the `--text-readout-*` family). No finding.

## Lens 4 — Docs parity

Behavior changed (clipping → fit) in this slice. Subtask-1 records "docs update: none needed" with the sanctioned guard for false README sentences. Grepped all READMEs, AGENTS.md, and `docs/PRD-P0.md`/`docs/spec-phases.md`: no sentence claims the readout clips, ellipsizes, or truncates (PRD-P0.md:213 and spec-phases.md:220 say "shrink or truncate" — permissive, satisfied by shrink-only), and no README names a readout font-size. The one doc the slice's token touches (`BRAND.md`) is updated in this diff. No finding.

## Verdict

**CHANGES_REQUESTED** — 2 findings, both open at review time, both resolved in the fix step:

| # | Severity | Lens | Tag | Location | Finding | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | major | 1 | test-step | tdd-1.md:7 / acceptance-criteria.md:13 | AC-10's no-tooling clause has no concrete test pinning it | resolved |
| 2 | major | 2 | test-step | apps/sezzle-calculator/src/calculator/display-fit.test.ts:3 | Cross-workspace relative module import bypasses `@repo/ui`'s export map; same file imports `@repo/contracts` by name | resolved |

## Fix step

Commands after the fixes: `npx turbo run lint check-types test --output-logs=errors-only` — 15/15 green.

- **Finding 1 (resolved)** — `apps/sezzle-calculator/src/no-a11y-tooling.test.ts` pins the clause in the purity-scan shape: the root `package.json` and every workspace's (`apps/*`, `packages/*`) `package.json` are scanned; its four dependency sections must name no axe or Lighthouse package. The scan surface is pinned (all seven workspaces + root named in the test). RED demonstrated by temporarily injecting `axe-core` into the app's devDependencies — the pin failed naming the hit — then reverted; green on the clean tree.
- **Finding 2 (resolved)** — the import is now `@repo/ui/display` (`moduleResolution: "bundler"` resolves the `"./*": "./src/*.tsx"` export to `display.tsx`); the display-fit suite passes unchanged.
