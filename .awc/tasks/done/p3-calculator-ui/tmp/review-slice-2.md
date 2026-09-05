# review-slice-2 — slice 2, entry (subtasks 3 and 4)

**Verdict: CHANGES_REQUESTED** — one finding, docs parity. The code, the tests and the two scope-doc edits are sound; the app's own README, the document the spec assigns to "what the calculator does today", was left at the Vite template while this slice made the calculator type.

## Suite

`npx turbo run test --output-logs=errors-only` — exit 0, 4/4 tasks successful. Both runs replayed from the Turborepo cache (`FULL TURBO`), so the result stands for the exact inputs hashed — tracked and untracked files under each workspace — and no test output was printed; the build record's own count for `sezzle-calculator` is 30 tests in 6 files. No failing test, so no `test-step` blocker from the run.

## Diff reviewed

Base `1262dde` (slice 1's `closing-commit:` in `tdd-1.md`) to the working tree, plus the untracked files. Trail bookkeeping raised no finding: the `eab822f` commit (`tdd-1.md`), the `status: todo → done` flips in `subtask-3.md` / `subtask-4.md`, and the new `tdd-2.md`.

Reviewed:

- `apps/sezzle-calculator/src/calculator/state.ts` (new), `reducer.ts` (new), `display.ts` (new)
- `apps/sezzle-calculator/src/calculator/reducer.test.ts` (new), `display.test.ts` (new), `Calculator.test.tsx` (+65)
- `apps/sezzle-calculator/src/calculator/Calculator.tsx`
- `apps/sezzle-calculator/src/scope-docs.test.ts` (+20)
- `docs/PRD-P0.md` (FE-3), `docs/spec-phases.md` (Phase 3)

## Findings

### F-1 — `apps/sezzle-calculator/README.md:1` — docs parity — **major** — resolved

The spec's "Surfaces touched" table (`spec.md:22`) names `apps/sezzle-calculator/README.md` as the doc that states "what the calculator does today, and that `=` is a dead end until Phase 4". Today, after this slice, the calculator accepts entry — digits build an operand, a leading zero is absorbed, one decimal point, a 15-character cap, `C` resets — while the operation and `=` keys stay inert. The README in the tree is the unmodified Vite template ("This template provides a minimal setup to get React working in Vite with HMR…") and says nothing about a calculator; it is not in this slice's diff and no subtask carries it, so the slice deferred its docs. Fix in this slice: replace the template text with what the calculator does after slice 2 (the entry rules above; operation, `sqrt` and `=` keys not yet wired). The "`=` is a dead end until Phase 4" half is slice 3's, when `pending` exists — leave it for that slice's README edit.

The template content predates this slice (slice 1 replaced the gallery with the calculator without touching it); the finding here is that this slice's behaviour change is not reflected in the doc the spec assigns to it.

## Lens rulings

### 1. Correctness against the contract — pass

`criterion → test` map present in `tdd-2.md` and checked against the files:

| Criterion | Test | Ruling |
| --- | --- | --- |
| AC-4 | `reducer.test.ts:12-16` | `1`,`2` → `12`. Covered. |
| AC-5 | `reducer.test.ts:18-24` (pin) | `0` → `0`; `0`,`0` → `0`; `0`,`0`,`5` → `5`. Covered; honestly recorded as a pin that was green on first run. |
| AC-6 | `reducer.test.ts:26-31` | `.` → `0.`; `.`,`0`,`0`,`7` → `0.007`. Covered. |
| AC-7 | `reducer.test.ts:33-40` | second point returns the same object (`toBe`), operand `1.5`. Covered. |
| AC-8 | `reducer.test.ts:42-65` | 16th digit, 16th point, cap reached with the point inside (`1.2345678901234`, length 15). Covered — the character count is pinned, not a digit count. |
| AC-8 docs half | `scope-docs.test.ts:37-52` | FE-3 line rejects "significant digits", requires "15 characters" and "decimal point included"; Phase 3 section rejects "significant.digit", requires "15-character cap". Covered. |
| AC-9 | `reducer.test.ts:67-71` | `1`,`.`,`5`,`C` → `INITIAL_STATE`. Covered. |
| AC-10 | `Calculator.test.tsx:63-117` | six UI re-drives — digits, leading zero, point zeros, second point, cap, `C` — through `user-event` clicks by accessible name. Covered. |

No `refactor:` entry on subtask 3 or 4, so no `preserves:` clause to rule on. No behaviour built ahead of a scenario: `state.ts:2` declares the four statuses subtask-3 says it declares while only `entering` is reachable; `reducer.ts:23-24` returns `undefined` for operation and equals keys so they stay inert as subtask-4 states; `display.ts:12` projects exactly the spec's "building the first operand" row. No scope creep past the two subtasks.

Note, not a finding: AC-7's and AC-9's "emits no request" clauses are unobservable in this slice — the `onRequest` boundary is subtask 6's. Slice 3's reviewer should expect those two to be re-driven with the request stub asserting zero calls once the boundary exists.

### 2. Project conventions — pass

- `reducer.ts` imports only a type from `./keys` and `./state`; no React, no I/O — the spec's pure reducer. `Calculator.tsx:10` drives it with `useReducer`, as the spec's approach section names.
- No arithmetic on operands anywhere in the diff: entry is string append, absorption and a `length` comparison (`reducer.ts:12`). No `fetch`. Honors the frontend rule in `CLAUDE.md` and the `spec.md` non-goals ahead of AC-24.
- No hand-written `useMemo`/`useCallback` — the React Compiler rule in `CLAUDE.md` is respected.
- App-side files follow the app's own `@stylistic` flat config (no semicolons, single quotes, the leading-`=` union style already used by `keys.ts`).
- `@testing-library/user-event` is declared in `apps/sezzle-calculator/package.json` devDependencies (`^14.6.7`), not merely hoisted.
- `Key.onPress` and `Display.state` / `DisplayState` are existing `@repo/ui` props and exports (`packages/ui/src/key.tsx:14`, `display.tsx:4,10`, `index.ts:13`) — nothing was added to the design system for this slice, matching the spec's "Not touched" line.

### 3. User surface — pass

The readout while entering is value = operand as typed, expression empty, `idle`, per the spec's display contract row. Every refusal (second point, 16th character) leaves the display unchanged and shows no message — the spec's "every refusal is silent". Keys remain native `<button>`s with their slice-1 accessible names; the tests drive them by those names (`Decimal point`, `Clear`, the digit). No new user-visible names introduced.

### 4. Docs parity — one finding (F-1)

- `docs/PRD-P0.md:124` FE-3 now reads "an operand capped at 15 characters, the decimal point included" — matches `reducer.ts:10` and its guard. Correct.
- `docs/spec-phases.md:122` Phase 3 now reads "15-character cap with the decimal point counted". Correct.
- `docs/prompts.md:56` still says "max 15 significant digits" — that is a verbatim prompt log, not a description of behaviour; not a finding.
- `CLAUDE.md:42` already names the frontend suite glob `apps/sezzle-calculator/src/**/*.test.ts(x)`, which the new `reducer.test.ts` and `display.test.ts` fall under. Nothing to update there.
- `apps/sezzle-calculator/README.md` — **F-1** above.

## Summary

| # | Lens | File | Severity | Status |
| --- | --- | --- | --- | --- |
| F-1 | docs parity | `apps/sezzle-calculator/README.md:1` | major | resolved |

**Resolution (fix step):** `apps/sezzle-calculator/README.md` rewritten — the app, how to run it, the entry rules as the reducer enforces them (digits append, leading zero absorbed, one decimal point, 15 characters with the point counted, `C` resets, refusals silent), the operation, `√` and `=` keys named as rendered but not wired yet, the `src/calculator/` layout and the test suite. The "`=` is a dead end until Phase 4" half is left for slice 3, as the finding directs. Pinned by three new `scope-docs.test.ts` tests (template gone; entry rules stated; unwired keys named). Suite 12/12, exit 0.
