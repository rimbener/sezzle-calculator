# subtask-2 — The hook and the wired app

- **slice:** 2 — the hook and the wired app
- **criteria:** AC-8, AC-9, AC-10
- **status:** todo
- **paths:** `apps/sezzle-calculator/src/api/useCalculate.ts`, `apps/sezzle-calculator/src/App.tsx`, `apps/sezzle-calculator/src/App.test.tsx`

`useCalculate.ts` is the whole hook FE-7 asks for: it builds one client from `client.ts`'s factory and the resolved gateway URL, and returns the function — nothing else. The React Compiler covers memoizing that construction (`CLAUDE.md`: no hand-written `useMemo`/`useCallback`).

`App.tsx` calls the hook and passes what it returns as `Calculator`'s `onRequest` — the seam `p3-calculator-ui` already fixed, so `Calculator.tsx` and the reducer are not touched (AC-8).

`App.test.tsx` gains an end-to-end case: render `App`, drive a full key sequence through the rendered UI ending in `=`, with `fetch` mocked at the global level (no port, no real network) to answer once with a successful body, and assert the display ends up showing that result (AC-9) — this is FE-8's "a successful calculation (API mocked)" case, proven above the unit level `client.test.ts` already covers. Root `lint`, `check-types`, `test` and `build` all stay green (AC-10).
