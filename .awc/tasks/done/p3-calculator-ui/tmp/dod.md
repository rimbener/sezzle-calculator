# dod — p3-calculator-ui

**Verdict: PASS**

Mode `validate`. `Commands:` `npx turbo run lint check-types test --output-logs=errors-only`. `Base: main`. Run from the worktree root `/Users/hernanlaura/projects/personal/sezzle-calculator/.worktrees/p3-calculator-ui` on branch `task/p3-calculator-ui` at `2266fe4`, working tree clean (`git status --porcelain` empty).

## Objective checks

| Check | Command | Result |
| --- | --- | --- |
| lint + check-types + test | `npx turbo run lint check-types test --output-logs=errors-only` | exit 0 — `Tasks: 12 successful, 12 total`, `Cached: 12 cached, 12 total` (`FULL TURBO`). Cache hits are keyed on the current tree's hash — every tracked and untracked file in each workspace plus, for `sezzle-calculator#test`, `$TURBO_ROOT$/docs/*.md` and `$TURBO_ROOT$/AGENTS.md` (`apps/sezzle-calculator/turbo.json:6`) — so the replay stands for exactly this tree. No error output was printed. |
| build | not in `Commands:` — not run here | AC-25's fourth gate. Evidence is a recorded run, not inspection: `tdd-3.md` cycle 22 and its verification line — `npx turbo run build --output-logs=errors-only`, 1/1 tasks (`sezzle-calculator`), exit 0 — run in the fix step for `review-slice-3.md` F-1, before closing commit `d42252f`. The two commits after it (`8eff70c` adds `apps/sezzle-calculator/turbo.json`; `2266fe4` rewrites comments only — `shrink-comments.md` records identical code fingerprints for all 7 files) change no production code, and `tsc -b`, the first half of the app's `build` script, is what my `check-types` run just re-executed. |
| smoke | the surfaces the task touched are the rendered calculator and the `@repo/ui` keypad; both are driven in the test run above | `apps/sezzle-calculator/src/calculator/Calculator.test.tsx:127-137` renders `<Calculator onRequest={stub} />`, clicks `1`,`2`,`Add`,`5`,`Equals` by accessible name and asserts the stub was called once with `{ operation: 'add', operands: [12, 5] }` with the readout at `5` / `12 + 5 =`; `:140-158` drive a result and an error outcome to the DOM; `packages/ui/src/keypad.test.tsx:63-74` renders the gallery and finds the `Keypad` section. |

## Review history

- `review.md` (11,800 B): verdict `CHANGES_REQUESTED`, one finding F-1 **minor**, marked `resolved` with a run as its check (`npx turbo run test --dry-run=json --filter=sezzle-calculator` inputs 25 → 32 incl. `../../AGENTS.md` and `../../docs/*.md`; gate 12/12). No open blocker, no open major, **no remaining minor** — so nothing needs a human-accepted entry in `spec.md`.
- `review-spec.md` (15,866 B): F1–F14, every one `resolved`. `review-slice-1.md` (7,842 B), `review-slice-2.md` (7,785 B), `review-slice-3.md` (5,909 B): one finding each, each `resolved` with the gate re-run recorded (12/12 exit 0; slice 3 additionally ran `build`). `shrink-comments.md` (1,594 B): one line per rewritten file, seven files, 609 → 603 lines, gate passing. All six verdict files are 18-byte `CHANGES_REQUESTED` records matching their reviews.
- Resolutions by inspection: none found. Every `resolved` finding cites a command that ran (`grep -n "inspection\|could not run" tmp/review*.md` finds only `review.md`'s statement that the built bundle was "inspected, not regenerated" — that is the [perf] observation, not a finding's resolution, and the bundle's build is itself recorded in `tdd-3.md`).
- Every `subtask-N.md` (N = 1..7) has `status: done`; none carries a `refactor:` entry, so there is no `preserves:` clause to pin.

## Dependency diff against `main`

`git diff main..HEAD -- package.json package-lock.json apps/*/package.json packages/*/package.json`: two lines.

| Change | Named in `review.md` | Recorded in `spec.md` |
| --- | --- | --- |
| `apps/sezzle-calculator/package.json:15` `"@repo/contracts": "*"` added to `dependencies` | yes — Dependency diff table, **accepted** (XC-1; `OPERAND_COUNT` and types only) | yes — "Surfaces touched": "`apps/sezzle-calculator/package.json`, `package-lock.json` — `@repo/contracts` as a dependency" |
| `package-lock.json:58` the matching workspace link | yes — **accepted**, no external package, no lifecycle script | same row |

No external package added, upgraded or patched; no `patches/`, no `.npmrc`. Note: `main` has moved two commits past the merge-base `18431a2` (`d0b8e56`, `fa452c0` — the `p2-api-gateway` spec bundle under `.awc/tasks/spec-ready/`, 14 files, docs only, no manifest). The manifest diff is identical from the merge-base and from `main`'s tip.

## Dimensions

- [x] **Functionality** — every criterion AC-1..AC-25 has a passing test in the 12/12 run (table below); no `refactor:` entries exist; the spec's state machine, display contract and error contract are implemented line for line in `reducer.ts` / `display.ts` (replace-only-the-operation `reducer.ts:91`; retained second operand appended via `build()` `:52-58`; `=` gated on `OPERAND_COUNT` `:48-49`; `sqrt` refused with an operation recorded `:88-90`; `pending` admits only `outcome` `:122`; error refuses operation/`=`/`sqrt` `:109-112`; carried message in the value slot with `state: 'error'` `display.ts:47`; `pending` projected `idle` `display.ts:43`). Error paths: refusals return the same object (`toBe` assertions), the error outcome renders the carried message and nothing this phase defines.
- [x] **Conventions** — `packages/ui` files use semicolons/double quotes; app files no semicolons/single quotes; lint exits 0 with `--max-warnings 0`. No hand-written `useMemo`/`useCallback` (`Calculator.tsx`). `Keypad` is thin: semantic `div`, `clsx("sc-keypad", className)`, rest props forwarded (`keypad.tsx:9-14`); its classes live in `components.css:263-273` and it is exported from `index.ts:18-19`. BRAND: `.sc-keypad` has `border: var(--border-2) solid var(--border-strong)` and `box-shadow: var(--shadow-panel)`; my sweep of the added CSS in `components.css` and `App.css` for `#hex` / `Npx` found none, and `keypad.test.tsx:56-60` + `App.test.tsx:24-27` pin it.
- [x] **Architecture & dependencies** — `@repo/ui` imports nothing from `@repo/contracts` (`keypad.test.tsx:76-81`); the app owns the machine; `reducer.ts` imports only `@repo/contracts`, `./keys`, `./state` — no React, no I/O; components contain no fetch (`frontend-purity.test.ts` scans both roots for `fetch(`, `XMLHttpRequest`, `WebSocket`, `Math.`, `eval(`, `parseFloat(`, `parseInt(`, and confines `Number(` to `reducer.ts`). The only new surface is the `onRequest` prop the spec names (`Calculator.tsx:14`). One dependency change, ruled in `review.md` and recorded in `spec.md` (table above).
- [x] **User surface** — 20 native `<button>`s with accessible names (`Calculator.test.tsx:39-68`, `key.tsx:22-26`), no sign toggle, `<DesignSystem />` gone from the app (`grep -rn DesignSystem apps/sezzle-calculator/src` → no hits; `App.test.tsx:8-12`). Docs landed: `docs/PRD-P0.md` FE-1 (no `+/-`), FE-3 (15 characters, point included), OQ5 `(Resolved)` → `p3-calculator-ui`; `docs/spec-phases.md` Phase 3 scope; `AGENTS.md` (`CLAUDE.md` symlink) barrel list gains `Keypad` and the Tests paragraph names all four suites; `apps/sezzle-calculator/README.md` describes today's behaviour and the `=` dead end via `onRequest`. All pinned by `scope-docs.test.ts`.
- [x] **Security** — no secret in the diff (regex sweep of `git diff main..HEAD` for key/token/password/PEM/AKIA/sk- patterns hit only review prose); the only untrusted string rendered is the outcome's `message`, reaching `Display` as a React text child (`display.tsx:22`), never `dangerouslySetInnerHTML`; no path, command or query built from user input (the file-reading tests resolve from `__dirname` constants only); `dist/` is gitignored (`apps/sezzle-calculator/.gitignore:11`); RTL `afterEach(cleanup)` registered in both `src/test/setup.ts` files; no timers or processes to tear down.
- [x] **Testing rigor** — `tdd-1.md`, `tdd-2.md`, `tdd-3.md` each carry a criterion → test table; every AC traces to a named, present test (verified against the files, table below). Pins are declared as pins. Refusals are asserted by reference equality; the emitted request is checked against `calculateRequestSchema` (`reducer.test.ts:152,167`).
- [x] **Observability & docs** — no logs or persisted state in scope (the spec forbids network and persistence in this phase); docs updated and consistent with code as listed under User surface, and `apps/sezzle-calculator/turbo.json` makes the docs pins re-hash on a docs edit (F-1 resolution, pinned by `scope-docs.test.ts:101-113`).

## Criterion → passing test

| AC | Test (all green in the 12/12 run) |
| --- | --- |
| AC-1 | `packages/ui/src/keypad.test.tsx` — children in the pad `:10-26`, `clsx` `:28-36`, barrel `:38-42`, grid + hard border + `--shadow-panel` `:50-54`, tokens only `:56-60`, gallery section `:63-74`, no `@repo/contracts` `:76-81` |
| AC-2 | `Calculator.test.tsx:39-68` (digits, point, seven operations, `Equals`, `Clear` as `BUTTON`; no sign-toggle; exactly 20); `keys.test.ts:5-11`; `App.test.tsx:7-13`; `scope-docs.test.ts:9-32` |
| AC-3 | `Calculator.test.tsx:31-37`; `display.test.ts:6-8` |
| AC-4..AC-9 | `reducer.test.ts:16-74` |
| AC-8 docs half | `scope-docs.test.ts:35-51` |
| AC-10 | `Calculator.test.tsx:71-125` |
| AC-11 | `reducer.test.ts:78-92`; `display.test.ts:15-26` |
| AC-12 | `reducer.test.ts:94-104`, `:178-183` |
| AC-13 | `reducer.test.ts:106-115`, `:181-182` |
| AC-14 | `reducer.test.ts:119-131`, `:170-172` |
| AC-15 | `reducer.test.ts:143-154` |
| AC-16 | `reducer.test.ts:133-141` |
| AC-17 | `reducer.test.ts:156-184` |
| AC-18 | `reducer.test.ts:186-193`; `display.test.ts:28-38`; `Calculator.test.tsx:160-174` |
| AC-19 | `reducer.test.ts:197-207`; `display.test.ts:40-51`; `Calculator.test.tsx:141-148` |
| AC-20 | `reducer.test.ts:212-220` |
| AC-21 | `reducer.test.ts:222-233` |
| AC-22 | `reducer.test.ts:239-247`; `display.test.ts:53-58`; `Calculator.test.tsx:150-157` |
| AC-23 | `reducer.test.ts:249-265` |
| AC-24 | `frontend-purity.test.ts:17-37` |
| AC-25 | `Calculator.test.tsx:127-138` (boundary once, pending readout); lint/check-types/test re-run here 12/12 exit 0; `build` recorded in `tdd-3.md` cycle 22 (exit 0) — see Objective checks |

## Notes for the human

- `build` was not in this validation's `Commands:`; its evidence is the recorded run in `tdd-3.md`, which post-dates the last production-code change (`2266fe4` is comments only). If the workflow wants it re-run at DoD time, add it to `Commands:`.
- The running app's `=` freezes the calculator in `pending` until reload — that is the spec's accepted "preview" cost (`spec.md` § Non-goals), documented in `apps/sezzle-calculator/README.md:66-71`, not a defect.
- `main` is two docs-only commits ahead of the merge-base (`p2-api-gateway` spec bundle); no overlap with this diff's paths.
