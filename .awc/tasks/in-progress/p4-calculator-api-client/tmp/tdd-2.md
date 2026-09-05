# tdd-2 — slice 2, the hook and the wired app

Criterion → test map:

- AC-8 → `apps/sezzle-calculator/src/api/useCalculate.test.ts`: `useCalculate (AC-8) > returns Calculator's onRequest shape, built from the client module: one POST to the resolved gateway, resolving its outcome`
- AC-9 → `apps/sezzle-calculator/src/App.test.tsx`: `App — wired to the gateway (AC-9) > sends a full key sequence ending in = to the gateway and shows the mocked reply's result`
- AC-10 → the gate: `npx turbo run lint check-types test --output-logs=errors-only` — 15/15 tasks successful — plus the build leg: `npx turbo run build --output-logs=errors-only` — 1/1 task successful (16/16 across the gate)

Cycles:

- Cycle 1 — AC-8: wrote `useCalculate.test.ts` (renderHook, stubbed global fetch, returned function typed against `NonNullable<CalculatorProps['onRequest']>`, one POST to the default gateway, outcome resolved); RED — module absent. GREEN: created `src/api/useCalculate.ts` — `createCalculateClient({ gatewayUrl: resolveGatewayUrl(import.meta.env) })`, nothing else.
- Cycle 2 — AC-9: added the end-to-end case to `App.test.tsx` (render `App`, `fetch` stubbed once answering 200 `{ result: 17 }`, press 1 2 Add 5 Equals, display shows 17 over `12 + 5 =`, exactly one POST carrying `{ operation: 'add', operands: [12, 5] }`); RED — display stuck at the pending `5`, `fetch` never called. GREEN: `App.tsx` calls `useCalculate()` and passes it as `Calculator`'s `onRequest`.
- Gate — AC-10: full command green; one lint-only fix inside cycle 2's own test (unused `url` destructure dropped), no production code touched.

`refactor:` — subtask-2 carries none; nothing to pin.

Fix cycles (review-slice-2 findings):

- Fix F2 — AC-9's unary-key trigger unexercised end to end: added the unary case to the mapped AC-9 describe in `App.test.tsx` (press 9 Square root, one POST carrying `{ operation: 'sqrt', operands: [9] }`, display shows the mocked 3 over `sqrt(9) =`). Green on first run — the finding was the missing test, not missing behavior, so the test itself is the fix; no production line added.
- Fix F1 — AC-10's build leg exercised by no gate: ran the gate with `build` included and recorded the build leg in AC-10's map above.

closing-commit: fc845cb
