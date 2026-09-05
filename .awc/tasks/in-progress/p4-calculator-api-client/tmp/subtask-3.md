# subtask-3 — Busy state, error presentations and docs

- **slice:** 3 — busy state, error presentations and docs
- **criteria:** AC-11, AC-12, AC-13, AC-14, AC-15
- **status:** done
- **paths:** `apps/sezzle-calculator/src/calculator/display.ts`, `apps/sezzle-calculator/src/calculator/display.test.ts`, `apps/sezzle-calculator/src/calculator/Calculator.test.tsx`, `apps/sezzle-calculator/src/App.test.tsx`, `apps/sezzle-calculator/README.md`, `apps/sezzle-calculator/src/scope-docs.test.ts`, `AGENTS.md`

`display.ts`'s `pending` case changes its projected `state` from `'idle'` to `'busy'` — the one line `p3-calculator-ui`'s own spec named as deferred here (AC-11). Update `display.test.ts`'s pending cases to expect `'busy'`. `Calculator.test.tsx` has two existing assertions that pending is `'idle'` (the "driven end to end" and "pending is frozen" describe blocks) — both now expect `'busy'`; nothing else in those tests changes, since the reducer's freezing behavior is unchanged (still AC-11's second half: no extra request while pending).

`App.test.tsx` gains one end-to-end case per failure kind in `spec.md`'s error-contract table — a mocked `fetch` answering with each of a domain-error body, a 502/504 outage body, a thrown network error, and an unrecognised/malformed body — asserting `Display` shows that case's exact message in its error state over the failed calculation (AC-12), and that a following digit press clears it back to a fresh entry while `C` resets from either a result or an error (AC-13; reconfirming `p3-calculator-ui`'s reducer rule with real outcomes now flowing through the wired client, not new recovery behavior).

`README.md`'s "What the calculator does today" section no longer says `=` is a dead end: describe the client module, the hook, the gateway URL's env var and its dev default, the busy indicator, and the four error messages (domain error, outage, network failure, unexpected response), each named the way `spec.md`'s error-contract table names it (AC-14). `scope-docs.test.ts`'s last README block currently pins the old "dead end... Phase 4... onRequest" wording — update its assertions to pin the new wording instead (the client module, the hook, and that `=` is no longer a dead end), so an unrelated future change can't silently break a stale assertion.

`AGENTS.md`'s opening paragraph says the SPA "does not yet call the gateway... makes no network calls of its own" — correct that sentence to say it now does, through the client and hook this task ships (AC-15; `CLAUDE.md` is a symlink to `AGENTS.md`, so it updates with it). Root `lint`, `check-types`, `test` and `build` stay green.
