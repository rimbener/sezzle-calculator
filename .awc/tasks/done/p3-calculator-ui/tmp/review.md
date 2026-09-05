# review — p3-calculator-ui (full review, all three slices)

**Verdict: CHANGES_REQUESTED** — one minor finding (F-1); every other lens passes.

Mode `full-review`, `Base: main`, verdict-writer `workflows/spec-to-code/scripts/write-verdict-file.sh`. The slice reviews (`review-slice-1.md`, `review-slice-2.md`, `review-slice-3.md`) each closed with one finding that its fix step resolved — those are not re-litigated here.

## Suite

Not re-run (the workflow gates on it separately). The trail shows no red suite: `tdd-3.md:3` records `npx turbo run lint check-types test --output-logs=errors-only` 12/12 exit 0 after every cycle and `npx turbo run build --output-logs=errors-only` 1/1 exit 0 in the fix step (AC-25's fourth gate, review-slice-3 F-1). `apps/sezzle-calculator/dist/assets/` (built 17:38, before the closing commit `d42252f`) is that build's output and was inspected, not regenerated.

## Diff reviewed

`git diff --stat main...HEAD`: 7 commits (`bcb83d0` open → `532241f` close), 55 files, +1573/−91. Code and docs: `packages/ui/src/{keypad.tsx,keypad.test.tsx,index.ts,design-system.tsx,test/setup.ts,tsconfig.json,styles/components.css,styles/design-system.css}`; `apps/sezzle-calculator/{package.json,README.md,tsconfig.app.json,src/App.tsx,src/App.css,src/App.test.tsx,src/frontend-purity.test.ts,src/scope-docs.test.ts,src/test/setup.ts,src/calculator/*}`; `AGENTS.md` (`CLAUDE.md` is a symlink to it); `docs/PRD-P0.md`; `docs/spec-phases.md`; `package-lock.json` (+1). The remaining files are the task trail under `.awc/`.

Read: `spec.md`, `acceptance-criteria.md`, `subtasks.md`, `subtask-1.md` … `subtask-7.md`, `tdd-1.md`, `tdd-2.md`, `tdd-3.md`, the three slice reviews. **No subtask carries a `refactor:` entry**, so there is no `preserves:` clause to pin.

## Dependency diff — ruled, every entry

| Entry | Where | Ruling |
| --- | --- | --- |
| `@repo/contracts: "*"` added to `dependencies` | `apps/sezzle-calculator/package.json:15` | **accepted** — `spec.md` "Surfaces touched" names it; PRD XC-1 requires every app to import the shared package; the app uses `OPERAND_COUNT` and the request/response types only |
| workspace link recorded | `package-lock.json:58` | **accepted** — the one lockfile line; no external package added, bumped or removed; no new lifecycle script; no major-version jump |
| patches / vendored code | — | **none** — no `patches/` directory, no `.npmrc` change |
| transitive: `zod ^4.5.4` now reaches the browser bundle | via `@repo/contracts`' barrel | **accepted**, see [perf] below |

## Scope & tests

Every criterion maps to at least one concrete test, checked against the files (not only `tdd-N.md`):

| Criterion | Test |
| --- | --- |
| AC-1 | `packages/ui/src/keypad.test.tsx` (children in the pad, `clsx` composition, barrel export, `components.css:263-274` grid + `var(--border-2) solid var(--border-strong)` + `var(--shadow-panel)`, no raw hex/px, gallery section, no `@repo/contracts` import) |
| AC-2, AC-3 | `calculator/Calculator.test.tsx:31-69` (readout `0`/empty, 11 digit/point buttons, 9 operation/equals/clear buttons, no sign-toggle, exactly 20 buttons); `calculator/keys.test.ts` (one key per `OPERATIONS` entry); `App.test.tsx:8-12` (no gallery); `scope-docs.test.ts:11-34` (FE-1, FE-3, OQ5 `(Resolved)` → `p3-calculator-ui`, Phase 3) |
| AC-4 – AC-9 | `calculator/reducer.test.ts:16-74` (`toBe` on every refusal; cap pinned with the point inside) |
| AC-10 | `Calculator.test.tsx:71-125` — the six rules re-driven by `user-event` clicks |
| AC-11 – AC-16 | `reducer.test.ts:78-148`; `display.test.ts:15-25` (six glyphs, `12% of`) |
| AC-17 | `reducer.test.ts:156-181` — request `toEqual`, `calculateRequestSchema.safeParse(...).success`, `5.` → `5`, percentage `[12, 50]`, replaced operation over retained operands |
| AC-18 | `reducer.test.ts:184-191` (`it.each` six keys, `toBe`); `display.test.ts:27-35`; `Calculator.test.tsx:160-174` (six keys ignored, boundary called once, `idle`) |
| AC-19 – AC-23 | `reducer.test.ts:195-265`; `display.test.ts:37-56`; `Calculator.test.tsx:139-158` |
| AC-24 | `frontend-purity.test.ts` — scans every non-test `.ts/.tsx` under the app and `packages/ui/src` for `fetch(`, `XMLHttpRequest`, `WebSocket`, `Math.`, `eval(`, `parseFloat(`, `parseInt(`; `Number(` allowed in `calculator/reducer.ts` only |
| AC-25 | `Calculator.test.tsx:127-137` (stub called once with `{ add, [12, 5] }`, readout `5` / `12 + 5 =`); the four gates in `tdd-3.md:3` |

Scope matches `spec.md`'s "Surfaces touched" table. Nothing outside it: the `.ds-keypad` rule leaving `design-system.css` follows from moving the gallery specimen onto `<Keypad>`; the `AGENTS.md` Tests paragraph, the FE-3 cap wording and the README rewrite were each directed by a slice review; the two `types: ["node"]` additions and both `afterEach(cleanup)` setup files are test infrastructure (`@types/node` already a devDependency in both workspaces). `spec.md`'s "Not touched" list holds — no token, no existing component, nothing in `packages/contracts`, neither service, not the root `README.md`.

## Findings

### F-1 — minor — `[code]` — `apps/sezzle-calculator/src/scope-docs.test.ts:7,49` — resolved

The docs-parity pins read files outside the workspace: `docs/PRD-P0.md` and `docs/spec-phases.md` through `docs()` (`:7`, used at `:12-13,40-41`) and `AGENTS.md` at `:49`. Turbo's `test` task is `{}` (`turbo.json:23`), so its hash covers the workspace's own tracked files plus the global inputs (root `package.json`, lockfile, `turbo.json`) and nothing else. Verified without running the suite: `npx turbo run test --dry-run=json --filter=sezzle-calculator` lists 25 inputs for `sezzle-calculator#test`, none under `docs/` and not `AGENTS.md`, and reports the task `HIT` from the local cache. So under the project's documented command (`npm run test`, AGENTS.md § Commands) an edit that reintroduces "sign toggle" in FE-1, restores "significant digits" in FE-3, or reverts the Tests paragraph replays the cached green and the guard never fires — exactly the situation `review-slice-2.md` § Suite already observed ("Both runs replayed from the Turborepo cache"). The criterion's code half is unaffected and the tests are green on a cold cache, hence minor — but a pin that goes silent on the very files it pins is not the guard the build records describe it as.

Fix, one of: declare the files as inputs of the app's `test` task — `"inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/docs/*.md", "$TURBO_ROOT$/AGENTS.md"]`, either on the root task in `turbo.json` (then update the characterization `packages/contracts/src/turbo-tasks.test.ts:26` that pins `test` to `{}`, recording it as the decision it is) or in a workspace `apps/sezzle-calculator/turbo.json` that `extends` the root; or `globalDependencies: ["docs/*.md", "AGENTS.md"]` if invalidating every task on a docs edit is acceptable. Verify with the same `--dry-run=json` — the three files must appear in the task's `inputs`.

**Resolution** (fix-review-findings): `apps/sezzle-calculator/turbo.json` now `extends` the root and declares the app's `test` task inputs as `["$TURBO_DEFAULT$", "$TURBO_ROOT$/docs/*.md", "$TURBO_ROOT$/AGENTS.md"]` — the workspace form, so the root `test: {}` pin in `packages/contracts/src/turbo-tasks.test.ts` stays true and only the workspace that reads those files re-hashes on a docs edit. Pinned RED-first by `scope-docs.test.ts` § "the test task hashes the docs it pins" (extends `//`, keeps `$TURBO_DEFAULT$`, lists both root globs). Verified with `npx turbo run test --dry-run=json --filter=sezzle-calculator`: `sezzle-calculator#test` inputs 25 → 32, now including `../../AGENTS.md` and all five `../../docs/*.md`, cache `MISS`. `npx turbo run lint check-types test --output-logs=errors-only`: 12/12 successful.

## Lens notes

### `[arch]` — pass

- Layering as `spec.md` draws it: `@repo/ui` gains a grid that knows no operation (`keypad.tsx`, 15 lines, `clsx` + rest props, pinned against `@repo/contracts`); the app owns the machine. `reducer.ts` imports only `@repo/contracts` (`OPERAND_COUNT`, types), `./keys`, `./state` — no React, no I/O. `display.ts` imports only types. `Calculator.tsx` is wiring: `useReducer`, `toDisplay`, one dispatch per key, one effect for the seam. No component calls `fetch` (AC-24 pin).
- The Phase 4 seam is exactly the one prop the spec names (`Calculator.tsx:9-10`). Arity from `OPERAND_COUNT` (`reducer.ts:45,49,88`), never a literal; an eighth operation is a `keys.ts` line and a `RENDER` entry.
- No new abstraction, indirection or config surface past the spec. The two `tsconfig` `types` additions follow `apps/calc-service/tsconfig.json`'s precedent.
- `sent` ref (`Calculator.tsx:17-23`): keyed on request identity, so StrictMode's dev replay (`main.tsx:7` wraps in `<StrictMode>`), a changed `onRequest` identity while pending, and a repeat of the same calculation after a result all behave — each `emit()` builds a fresh object. `pending` admits only `outcome` (`reducer.ts:121`), so at most one request is in flight and no stale outcome can land. `.then` without `.catch` is the spec's "never rejects" contract, recorded as a resolved decision.
- Compatibility: no persisted state, no schema — **N/A**.

### `[perf]` — pass, one observation recorded

- The built bundle (`dist/assets/index-B4SfhVji.js`, 260,122 B / 79,566 B gzip) contains Zod v4 (293 `_zod` references) although this phase uses only `OPERAND_COUNT` and types: `@repo/contracts`' barrel re-exports `calculate.ts`, whose top-level `z.object(...).transform(...)` is side-effectful at import, so rolldown keeps it; the contract's message strings are shaken out. Not a finding: PRD XC-1 makes every app import the shared package, `docs/spec-phases.md` Phase 4 uses the shared schemas in the browser ("anything that fails to match the shared schemas is the unexpected-response message"), the spec rejected local types as an alternative, and `packages/contracts` exports only `"."` — avoiding it would mean touching a package the spec lists as not touched. Recorded so Phase 4 does not count it as its own regression.
- No repeated I/O, no busy-wait, no unbounded buffering: `toDisplay` is a switch per render; the effect runs once per request; the file-scanning tests read each source once per run.

### `[security]` — N/A surfaces, checked

- The only untrusted string the UI renders is the outcome's carried `message`; it reaches `Display` as a React text child (`packages/ui/src/display.tsx:22` `{value}`), never `dangerouslySetInnerHTML`. Operand text is constrained to digits and one point by the reducer before `Number()`; a promoted result is `String(number)`.
- No shell, query, interpreter, or path built from user input — the file-reading tests build paths from `__dirname` constants only. No secrets, no logging, no persisted state, no committed sensitive file. No spawned process or timer to tear down.

### `[code]` — F-1 above; otherwise pass

Behaviour matches `spec.md`'s state-machine rules and display contract line by line (replacement retains the second operand, `sqrt` refused with an operation recorded, `=` gated on `OPERAND_COUNT`, `5.` → `5`, error refuses operation/`=`/`sqrt`, `C` resets from result and error, pending frozen with `idle`). Style matches each workspace's config (double quotes + semicolons in `packages/ui`; `@stylistic` single quotes, no semicolons in the app; no hand-written `useMemo`/`useCallback`). BRAND.md: every new CSS value is a token; hard border and zero-blur panel shadow on the pad.

## Summary

| # | Lens | File | Severity | Status |
| --- | --- | --- | --- | --- |
| F-1 | code | `apps/sezzle-calculator/src/scope-docs.test.ts:7,49` (+ `turbo.json:23`) | minor | resolved |
