# review-slice-3 — slice 3, operations, requests and outcomes (subtasks 5, 6 and 7)

**Verdict: CHANGES_REQUESTED** — one finding, resolved in the fix step.

## Suite

`npx turbo run test --output-logs=errors-only`, run from the worktree root: exit 0, 4 test tasks successful (all four served from Turbo's cache for the current tree, no failures surfaced). Green.

## Diff reviewed

From `afe5e56` (slice 2's `closing-commit:` in `tdd-2.md`) to the working tree: `apps/sezzle-calculator/README.md`, `src/calculator/{state,reducer,display}.ts`, `Calculator.tsx`, their four test files, `src/scope-docs.test.ts`, plus the new untracked `src/frontend-purity.test.ts`. The trail commit `ca8b38d` (tdd-2.md's closing-commit line) and the `status: done` edits to subtask-5/6/7.md are bookkeeping — no finding. Subtask files 5, 6 and 7 carry no `refactor:` entry, so there is no `preserves:` clause to rule on.

## Findings

### F-1 — AC-25's `build` gate is unverified — major — lens 1 (correctness against the contract) — resolved

- `.awc/tasks/in-progress/p3-calculator-ui/tmp/tdd-3.md:3` — the verification line runs `lint check-types test` and states outright: "`build` is not in this invocation's `Commands:` and was not run."
- `.awc/tasks/in-progress/p3-calculator-ui/acceptance-criteria.md` AC-25 — "Root `lint`, `check-types`, `test` and `build` all pass with the calculator in place"; `tmp/subtask-7.md` restates it as the slice's closing gate.

Every other clause of AC-25 has evidence (the end-to-end UI test in `Calculator.test.tsx:127-137`; lint/check-types in the record's verification line). The `build` clause has none — this review's `Commands:` did not include it either, so it stays unverified on both sides. The slice cannot close on a criterion whose gate was never run. Fix: run root `npx turbo run build` in the worktree, record the result in `tdd-3.md`'s verification line, and fix whatever it surfaces. Not `test-step`: the fix is running and recording a gate (and any production fix it exposes), not a test.

**Resolution.** `npx turbo run build --output-logs=errors-only` run from the worktree root in the fix step: 1/1 tasks (`sezzle-calculator`), exit 0, nothing surfaced, so no production change followed. Recorded in `tdd-3.md`'s verification line and as cycle 22.

## Lens notes (no findings)

**Lens 1 — correctness.** Every criterion AC-11 through AC-24 maps to a concrete test in the diff, and I checked each against the code:

- Recording/replacing (AC-11–13): `reducer.ts:86-91` replaces only `operation`; `build()` (`:52-58`) opens the right operand from `0` only while `awaitingOperand`, so after a replacement the retained `5` is still the live operand (`12 × 57`). Tests `reducer.test.ts:78-113`, `display.test.ts:15-25`.
- `=` gating (AC-14, AC-17): `complete()` (`:48-49`) takes arity from `OPERAND_COUNT`, never a literal; `emit()` (`:64-68`) maps operands with `Number(text)`, so `5.` sends `5`; percentage keeps entry order. The emitted request is asserted against `calculateRequestSchema` (`reducer.test.ts:159, 178`).
- `sqrt` (AC-15, AC-16): unary fires on the press only with no operation recorded (`:88-90`); `toBe` refusal tests at `:142-148`.
- Pending frozen (AC-18): `reducer.ts:121-122` admits only `outcome`; `it.each` over six keys with `toBe` (`:198-205`), and through the UI with the boundary called once (`Calculator.test.tsx:160-174`). Projection holds the entered operand and `12 + 5 =` / `sqrt(9) =` with `idle` (`display.ts:43`).
- Outcomes (AC-19–23): `settle()` splits on `'result' in outcome`; `settled()` (`:102-114`) starts fresh on digit/point from either ending, resets on `C`, promotes only a result via `String(value)` (no recomputation), refuses operation/`=`/`sqrt` on an error. All covered at `reducer.test.ts:209-265`, `display.test.ts:37-56`, `Calculator.test.tsx:139-158`.
- AC-24: `frontend-purity.test.ts` scans every non-test source under the app and `packages/ui/src` for `fetch(`, `XMLHttpRequest`, `WebSocket`, `Math.`, `eval(`, `parseFloat(`, `parseInt(`, and pins `Number(` to `calculator/reducer.ts` alone — a real guard rail, not a claim.
- `Calculator.tsx:21-29`: the effect sends each pending request once, keyed on the request object's identity through a ref, which also absorbs StrictMode's replay and a changed `onRequest` identity while pending. `.then` without `.catch` is by the spec's contract that the prop never rejects. Omitting the prop leaves `=` a dead end, as decided.
- No behaviour built ahead of a scenario: `enter`'s `case 'outcome'` and `settled`'s `default` exist for exhaustiveness and return state unchanged; nothing extra is reachable.

**Lens 2 — conventions.** App-local ESLint style (no semicolons, single quotes) matched; no hand-written `useMemo`/`useCallback` under the React Compiler; no arithmetic and no `fetch` in the frontend; arity and types from `@repo/contracts`; the request/outcome boundary is the one `onRequest` prop the spec names; components hold no fetch. Nothing added that `spec.md` does not call for.

**Lens 3 — user surface.** UI-facing slice. Expression glyphs `+ − × ÷ ^`, `sqrt(9)`, `12% of 50`, and the ` =` suffix match the display contract (`display.ts:16-30`). The error outcome puts the carried message in the value slot with `Display` in `error`; pending elects `idle` (busy is Phase 4's). Every refusal is silent. Accessible key names are unchanged from slice 1. No finding.

**Lens 4 — docs parity.** `apps/sezzle-calculator/README.md` is updated in this diff: the operation rules, the frozen `pending`, both outcomes, the `=` dead end naming `onRequest` and Phase 4, the `src/calculator/` layout with all four statuses reachable, and the new purity test — pinned by `scope-docs.test.ts:87-99`. `docs/spec-phases.md` Phase 3, `docs/PRD-P0.md` FE-1/FE-3/OQ5 and `CLAUDE.md`'s barrel list agree with the code. No finding.
