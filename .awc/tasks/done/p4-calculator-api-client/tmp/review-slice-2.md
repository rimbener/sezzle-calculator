# review-slice-2 — the hook and the wired app

- **task:** p4-calculator-api-client
- **slice:** 2 — the hook and the wired app (subtask-2, AC-8, AC-9, AC-10)
- **verdict:** CHANGES_REQUESTED
- **suite:** `npx turbo run test --output-logs=errors-only` — 5/5 tasks successful, all cached (`FULL TURBO`); green. The npm `EBADDEVENGINES` warning (npm 12.0.2 vs `^10.0.0`, `onFail: warn`) is the documented working-as-intended warning, not a finding.

## Trail

- Diff base: slice 1's `closing-commit: c3a81bf`, read from `tdd-1.md:22` — trail intact. Diff = `c3a81bf`..worktree plus untracked `tdd-2.md`, `src/api/useCalculate.ts`, `src/api/useCalculate.test.ts`. Commit `d445fde` is the trail bookkeeping recording slice 1's review and closing-commit — no findings raised on it.
- Slice 2's diff: `App.tsx` (wires `useCalculate()` to `Calculator`'s `onRequest`), `App.test.tsx` (the AC-9 end-to-end case), the new hook and its test, `subtask-2.md` status flip, `tdd-2.md`.
- `refactor:` — subtask-2 carries none ("nothing to pin"); nothing to check, nothing omitted.

## Findings

- **F1 — [lens 1, test-step] [major] [resolved] — AC-10's `build` leg is exercised by no gate.** `acceptance-criteria.md:19` requires root `lint`, `check-types`, `test` **and `build`** all passing. `tdd-2.md:7` maps AC-10 to `npx turbo run lint check-types test --output-logs=errors-only` — 15/15 tasks — which omits `build`: `turbo.json:27` declares `test` with no `dependsOn`, and only `apps/sezzle-calculator/package.json` carries a `build` script (5 lint + 5 check-types + 5 test = 15; build would be a 16th task). The build leg rests on nothing in the record, and this review's Commands covered `test` only. Fix: run the gate with `build` included and record it in AC-10's map. (Behavior-side code is not implicated — the fix is the gate, hence test-step.)
- **F2 — [lens 1, test-step] [major] [resolved] — AC-9's unary-key trigger is unexercised end to end.** `acceptance-criteria.md:18`: "a full key sequence ending in `=` **(or an immediately-firing unary key)** reaches the client…". The slice's only wired test (`apps/sezzle-calculator/src/App.test.tsx:17-43`) drives the `=` sequence alone; no test sends a unary key (e.g. `9`, `Square root` — the press that `reducer.ts:87` fires immediately) through the wired app to the mocked client. The p3-era `Calculator.test.tsx:177-186` case proves the unary press through a stub, not through the client this slice wired. Fix: add the unary case to the mapped AC-9 test (AC-8's no-component-fetch clause is covered — the pre-existing `frontend-purity.test.ts:34-38` scan now sweeps `useCalculate.ts` too and stays green).

No other findings:

- **Lens 2 (project conventions):** the hook is the one-line construction the spec approved (no hand-written `useMemo`; `App.tsx` is the only hook caller; `Calculator.tsx` untouched at the locked `onRequest` prop); new files follow the app's flat ESLint style; nothing added past subtask-2's three paths.
- **Lens 3 (user surface):** the wired success path matches the spec — one POST with the contract body, the display showing the mocked reply's result over the completed expression. Busy state and the four error presentations are slice 3 by the approved spec's own phasing (AC-11/AC-12), so their absence here is not a finding.
- **Lens 4 (docs parity):** the README/`AGENTS.md` updates are slice 3 criteria (AC-14/AC-15) per the approved spec's "Surfaces touched"; this diff introduces no doc that contradicts the code.
