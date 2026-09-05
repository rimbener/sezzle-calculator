# review-slice-1 — slice 1, the calculator shell (subtasks 1 and 2)

**Verdict: CHANGES_REQUESTED** — one docs-parity major; every other lens passes.

## Suite

`npx turbo run test --output-logs=errors-only` — exit 0, 4 tasks successful, 0 failed (`@repo/contracts`, `@repo/ui`, `calc-service`, `sezzle-calculator`; `@repo/eslint-config` and `@repo/typescript-config` carry no `test` script). Run once with `--force` to bypass the cache and once exactly as given (cache hit, same result). `@repo/ui` runs `keypad.test.tsx` (7 tests); `sezzle-calculator` runs `App.test.tsx`, `calculator/Calculator.test.tsx`, `calculator/keys.test.ts`, `scope-docs.test.ts` (11 tests). No red test.

## Diff reviewed

Slice 1: `Base: main` (`18431a2`, also the merge-base). Commits `main..HEAD` = `bcb83d0` only, which moves the bundle `spec-ready → in-progress` and touches nothing outside `.awc/`. Working tree: 15 tracked files changed (+54/−19 incl. `package-lock.json` +1) and 8 untracked files added — `packages/ui/src/keypad.tsx`, `keypad.test.tsx`; `apps/sezzle-calculator/src/App.test.tsx`, `scope-docs.test.ts`, `calculator/{Calculator.tsx,Calculator.test.tsx,keys.ts,keys.test.ts}`. Subtask files read: `subtask-1.md` (AC-1), `subtask-2.md` (AC-2, AC-3); build record `tdd-1.md` with its criterion → test map. Neither subtask carries a `refactor:` entry, so there is no `preserves:` clause to rule on.

## Findings

### F-1 — major · docs parity · `resolved`

`AGENTS.md:42` (`CLAUDE.md` is a symlink to it) still reads: "`packages/contracts/src/*.test.ts` and `apps/calc-service/src/**/*.test.ts` are the suites so far, and `apps/sezzle-calculator` and `packages/ui` still have none." This slice adds `packages/ui/src/keypad.test.tsx` and four suites under `apps/sezzle-calculator/src/` (`App.test.tsx`, `scope-docs.test.ts`, `calculator/Calculator.test.tsx`, `calculator/keys.test.ts`), plus the `afterEach(cleanup)` setup both workspaces now rely on (`packages/ui/src/test/setup.ts:2-6`, `apps/sezzle-calculator/src/test/setup.ts:2-6`). The sentence now contradicts the code, and the slice already edited this file for the barrel list (`AGENTS.md:62`), so the docs update belongs in this diff. Fix: rewrite the "suites so far" clause to name the frontend and `@repo/ui` suites (and, if wanted, the RTL `afterEach(cleanup)` convention) — wording only.

**Resolution:** `AGENTS.md` Tests paragraph rewritten to name all four suites (`packages/contracts`, `apps/calc-service`, `apps/sezzle-calculator/src/**/*.test.ts(x)`, `packages/ui/src/*.test.tsx`) and the `afterEach(cleanup)` setup both React workspaces register. Pinned by `apps/sezzle-calculator/src/scope-docs.test.ts` › AGENTS.md names every workspace with a test suite — red on the stale sentence, green after the rewrite. `npx turbo run lint check-types test --output-logs=errors-only --force` exit 0, 12/12.

## Lenses

### 1. Correctness against the contract — pass

- AC-1: covered by `keypad.test.tsx:10-25` (children in a pad carrying `sc-keypad`, props forwarded via `data-testid`), `:28-36` (`clsx` composition), `:38-42` (barrel export), `:44-61` (`components.css:263-274` — `display: grid`, `var(--border-2) solid var(--border-strong)`, `var(--shadow-panel)`, no raw hex/px in the section), `:63-74` (gallery `Keypad` section, `design-system.tsx:141-169`), `:76-81` (pin: no `@repo/contracts` import).
- AC-2: `App.test.tsx:8-12` (no gallery heading), `Calculator.test.tsx:23-30` (digits + point as native buttons), `:34-42` (seven operations, `Equals`, `Clear`), `keys.test.ts:6-10` (one operation key per `OPERATIONS` entry, names from `@repo/contracts`), `Calculator.test.tsx:46-51` (pin: no sign-toggle, exactly 20 buttons), `scope-docs.test.ts:14-32` (FE-1, FE-3, OQ5, Phase 3 carry no "sign toggle"; OQ5 `(Resolved)` and points at `p3-calculator-ui`).
- AC-3: `Calculator.test.tsx:15-19` — value `0`, expression empty, read through `Display`'s DOM.
- Every referenced custom property exists in `packages/ui/src/styles/tokens/`: `--shell-max` (spacing.css:26), `--key-size-sm`, `--surface-shell`, `--radius-lg`, `--space-3/4/5/7`, `--shadow-panel`, `--border-2`, `--border-strong` — so the `.calculator` cap and the pad's edge and shadow resolve at runtime, not only in the regex tests.
- No behaviour ahead of a scenario: `Calculator.tsx:7` hard-wires `value="0" expression=""` and no key has a handler; no reducer, no `onRequest`, no state.
- Scope: the `.calculator` shell rule (`App.css:2-8`) and its two style tests are the layout the shell needs and `App.css` is a listed path. Dropping the dead `.ds-keypad` rule (`design-system.css`) follows from moving the specimen onto `<Keypad>`; it is not a component or a token. Both test `setup.ts` files and the two `types` additions (`packages/ui/tsconfig.json:4`, `tsconfig.app.json:7`) are test infrastructure; `@types/node` was already a devDependency in both workspaces and `apps/calc-service/tsconfig.json:4` is the precedent.

### 2. Project conventions — pass

- `packages/ui`: semicolons + double quotes (`keypad.tsx`, `keypad.test.tsx`, `index.ts`, `design-system.tsx`); thin component, semantic `div`, `clsx`-composed `sc-*` class, rest props forwarded; classes in `components.css` beside `.sc-key`; exported from the barrel with its props type. Trailing-semicolon-less last declaration at `components.css:273` matches the file's existing style (`:260`).
- `apps/sezzle-calculator`: no semicolons, single quotes, `@stylistic` layout (`keys.ts:12-17` operator-linebreak form); no hand-written `useMemo`/`useCallback`; no arithmetic; no fetch; the only `@repo/contracts` use is `Operation`/`OPERATIONS` names (`keys.ts:1`, `keys.test.ts:1`), with the dependency recorded in `package.json:15` and `package-lock.json:58`.
- BRAND.md: `.sc-keypad` has the hard `--border-2`/`--border-strong` edge and the zero-blur `--shadow-panel`; no gradients, blur or transparency; no raw hex or px in either new CSS block.
- Design system stays a vocabulary: `Keypad` knows no operation names (pinned).

### 3. User surface — reviewed (UI touched)

- Every key is a native `<button type="button">` (`key.tsx:22-23`) with an accessible name: digits by label, glyphs via `ariaLabel` — `Add`, `Subtract`, `Multiply`, `Divide`, `Power`, `Square root`, `Percentage`, `Equals`, `Clear`, `Decimal point` (`keys.ts:26-45`, `Calculator.tsx:10`). Names follow the vocabulary the gallery already used (`Percentage`, `Decimal point`, `Equals`).
- Glyphs `+ − × ÷ ^ √ %` match the spec's expression-line glyph set. Faces per `subtask-2.md`: `number` for digits/point, `operator` for the six binary operations, `function` for `sqrt`, `equals`, `clear`.
- Readout: `Display` (`role="status"`, `aria-live="polite"`) starts at value `0`, expression empty, `state` defaulting to `idle`; `busy` is not elected, per the spec's deferral.
- Layout: `<section aria-label="Calculator">` (`Calculator.tsx:6`), 4×5 grid `C √ ^ ÷ / 7 8 9 × / 4 5 6 − / 1 2 3 + / % 0 . =`, no sign-toggle key.

### 4. Docs parity — F-1 resolved

- Done in this diff: `AGENTS.md:62` barrel gains `Keypad`; `docs/PRD-P0.md:120,124,255` (FE-1 key list, FE-3 rule list, OQ5 `(Resolved)` pointing at this bundle); `docs/spec-phases.md:120-126` (Phase 3 scope). Grep of `docs/`, `README.md`, `AGENTS.md`, `apps/*/README.md`, `packages/*/README.md` finds no other "sign toggle" and no claim that the app renders the gallery. `apps/sezzle-calculator/README.md` is owned by `subtask-7.md` (slice 3), not this slice.
- Was stale: `AGENTS.md:42` — F-1 above, resolved in the fix step.

## Not raised

- `docs/PRD-P0.md:124` FE-3 still says "15 significant digits" where the spec caps at 15 characters counting the point — that is slice 2's rule (AC-8) and outside this diff.
- Performance and security are outside these lenses.
