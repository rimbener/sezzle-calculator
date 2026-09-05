# tdd-1 — slice 1, the calculator shell (subtasks 1 and 2)

Verification: `npx turbo run lint check-types test --output-logs=errors-only` — 12/12 tasks (`--force`, uncached, exit 0). `@repo/ui` runs 7 tests in 1 file (`keypad.test.tsx`), `sezzle-calculator` 11 tests in 4 files (`App.test.tsx` 3, `calculator/Calculator.test.tsx` 4, `calculator/keys.test.ts` 1, `scope-docs.test.ts` 3). Diff base: `bcb83d0` — the task-opening commit, **rebased onto `main`** at the start of the slice: the branch was cut from `6c4f0b9`, one commit behind `18431a2` (Node 22 migration), and without that commit's `devEngines.packageManager` block Turbo could not resolve the workspace, so the verification command could not run at all. The rebase replayed the bundle move only (`f11bdbc` → `bcb83d0`); no code changed.

## Criteria → tests

| Criterion | Test |
| --- | --- |
| AC-1 pad renders `Key` children into a grid, carries `sc-keypad`, forwards props | `packages/ui/src/keypad.test.tsx` › Keypad › renders its Key children inside a pad carrying the sc-keypad class |
| AC-1 composes class names with `clsx` | keypad.test.tsx › Keypad className › composes a caller's className with sc-keypad |
| AC-1 exported from the barrel | keypad.test.tsx › @repo/ui barrel › exports Keypad from the package root |
| AC-1 classes in `components.css`: grid, hard border, `--shadow-panel` | keypad.test.tsx › sc-keypad styles › lays the pad out as a grid with the standard hard border and offset panel shadow |
| AC-1 tokens only — no raw hex, no raw px | keypad.test.tsx › sc-keypad styles › uses only design-system custom properties |
| AC-1 gallery shows a Keypad section | keypad.test.tsx › design-system gallery › shows a Keypad section built from the component |
| AC-1 imports nothing from `@repo/contracts` | **pin** — keypad.test.tsx › Keypad purity (negative constraint; passed on first run, never red) |
| AC-2 app no longer renders `<DesignSystem />` | `apps/sezzle-calculator/src/App.test.tsx` › App › no longer renders the design-system gallery anywhere |
| AC-2 keys `0`–`9` and the decimal point, native buttons, accessible names | `calculator/Calculator.test.tsx` › the key set › has a native button for every digit and for the decimal point |
| AC-2 one operation key per contract operation, named from `@repo/contracts` | `calculator/keys.test.ts` › has exactly one operation key per contract operation (pulls `@repo/contracts` into the app's dependencies) |
| AC-2 seven operations, `=` and `C` rendered as native buttons | Calculator.test.tsx › operations, equals and clear › has a native button for all seven operations, for equals and for clear |
| AC-2 no sign-toggle key (20 keys exactly) | **pin** — Calculator.test.tsx › FE-1 amended › has no sign-toggle key (negative constraint; passed on first run) |
| AC-2 docs: no sign toggle in FE-1, FE-3, OQ5, Phase 3; OQ5 resolved by this bundle | `scope-docs.test.ts` › three tests over `docs/PRD-P0.md` and `docs/spec-phases.md` |
| AC-3 value `0`, expression empty before any key | Calculator.test.tsx › the shell › starts with the value 0 and an empty expression line |
| shell layout — `.calculator` capped at `--shell-max`, centred, tokens only (BRAND.md) | App.test.tsx › App shell styles › two tests |
| review-slice-1 F-1 — `AGENTS.md` Tests paragraph names the frontend and `@repo/ui` suites and `afterEach(cleanup)`, no "still have none" | scope-docs.test.ts › AGENTS.md names every workspace with a test suite |

No subtask in this slice carries a `refactor:` entry.

## Cycles

1. RED `Keypad` renders children + `sc-keypad` (module missing) → GREEN `packages/ui/src/keypad.tsx`, a `div` spreading its props.
2. RED caller `className` composes with `sc-keypad` → GREEN `clsx("sc-keypad", className)`. Test infra: `packages/ui/src/test/setup.ts` gains `afterEach(cleanup)` — RTL only auto-cleans with a global `afterEach`, and the second render was finding the first test's DOM.
3. RED barrel exports `Keypad` → GREEN two lines in `src/index.ts` (`Keypad`, `KeypadProps`).
4. RED `.sc-keypad` CSS contract (grid, `var(--border-2) solid var(--border-strong)`, `var(--shadow-panel)`, tokens only) → GREEN a `Keypad` section in `components.css` after `Key`. Test infra: `types: ["node"]` in `packages/ui/tsconfig.json` so the file-reading test type-checks (mirrors `apps/calc-service`); the barrel test became a static import — NodeNext rejects an extensionless dynamic `import()`.
5. RED gallery has a `Keypad` heading with a pad of keys → GREEN `design-system.tsx` gains a `Keypad` section; the Key section's hand-rolled `ds-keypad` specimen moved into it on `<Keypad>`, and the now-dead `.ds-keypad` rule left `design-system.css`.
6. PIN `keypad.tsx` imports nothing from `@repo/contracts`. Docs: `AGENTS.md` (`CLAUDE.md`) barrel list gains `Keypad`. `@repo/ui` lint/check-types/test green → subtask 1 done.
7. RED `App` shows no "Design System" heading → GREEN `App.tsx` renders `<Calculator />`, a bare labelled `<section>`. Test infra: `apps/sezzle-calculator/src/test/setup.ts` gains the same `afterEach(cleanup)`.
8. RED readout `{ value: '0', expression: '' }` → GREEN `<Display size="lg" value="0" expression="" />`.
9. RED buttons `0`–`9`, `Decimal point` → GREEN `calculator/keys.ts` (`KEYS`, `CalculatorKey` with `digit`/`point`), `Calculator` maps `KEYS` into `<Keypad><Key/></Keypad>`.
10. RED operation keys ≙ `OPERATIONS` from `@repo/contracts` → GREEN `operation` kind carrying `Operation`; `@repo/contracts: "*"` added to the app's `package.json`, `npm install` records the workspace link in `package-lock.json` (+1 line).
11. RED buttons for the seven operations, `Equals`, `Clear` → GREEN `equals` and `clear` kinds; the pad is a full 4×5 grid (`C √ ^ ÷ / 7 8 9 × / 4 5 6 − / 1 2 3 + / % 0 . =`).
12. PIN no sign-toggle key, exactly 20 buttons. RED scope docs (three tests) → GREEN `docs/PRD-P0.md` FE-1, FE-3 and OQ5 (now `(Resolved)`, pointing at this bundle), `docs/spec-phases.md` Phase 3 scope; the dropped key is named as `+/-`, never as the banned phrase.
13. RED `App.css` `.calculator` block: `max-width: var(--shell-max)`, `margin … auto`, tokens only → GREEN the shell rule. App `check-types` needed `types: ["vite/client", "node"]` in `tsconfig.app.json`; `eslint --fix` moved one `=` for `@stylistic/operator-linebreak` in `keys.ts`.
14. **Fix step (review-slice-1 F-1).** RED fourth `scope-docs` test over `AGENTS.md` (stale "still have none") → GREEN the Tests paragraph rewritten to name all four suites and the RTL cleanup convention. `npx turbo run lint check-types test --output-logs=errors-only --force` exit 0, 12/12. Slice committed.

closing-commit: 1262dde
