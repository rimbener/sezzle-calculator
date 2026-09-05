# tdd-3 — slice 3, busy state, error presentations and docs

Criterion → test map:

- AC-11 → `apps/sezzle-calculator/src/calculator/display.test.ts`: `display — pending holds the emitted calculation still, in the busy state (AC-18, AC-11)` (it.each over add/sqrt/percentage) + `apps/sezzle-calculator/src/calculator/Calculator.test.tsx`: the pending assertions in `Calculator — a calculation driven end to end through the UI (AC-25)` (`displayState() === 'busy'`) and `Calculator — pending is frozen through the UI (AC-18)` (`displayState() === 'busy'`; the second `=` press still emits no second request — the reducer's freezing is unchanged, only the projected state moved)
- AC-12 → `apps/sezzle-calculator/src/App.test.tsx`: `App — the four error presentations (AC-12) > shows <each> 's message over the failed calculation, in the error state` (it.each over the spec's error-contract table: domain error 422 relayed, backend outage 502 rewritten, network failure (fetch throws), unexpected response (stray 400))
- AC-13 → `apps/sezzle-calculator/src/App.test.tsx`: `App — recovery after an outcome (AC-13)` — `a digit after <each of the four> clears the error and starts a fresh entry` (it.each), `a decimal point after the error starts a fresh entry too`, `C after the error returns the calculator to its starting state`, `C after a result returns the calculator to its starting state`
- AC-14 → `apps/sezzle-calculator/src/scope-docs.test.ts`: `the app README describes what the calculator does today > describes the client module and the hook that carry = to the gateway` / `names the gateway URL env var and its dev default` / `describes the busy indicator and the four error messages` / `no longer describes = as a dead end`
- AC-15 → `apps/sezzle-calculator/src/scope-docs.test.ts`: `AGENTS.md says the SPA calls the gateway through the client and hook (AC-15)` (both its) + the gate: `npx turbo run lint check-types test --output-logs=errors-only` — 15/15 tasks successful — plus the build leg: `npx turbo run lint check-types test build --output-logs=errors-only` — 16/16 tasks successful (build fresh, the rest cached)

Cycles:

- Cycle 1 — AC-11: RED — flipped `display.test.ts`'s pending it.each to `state: 'busy'`, taught `Calculator.test.tsx`'s `displayState()` the `sc-display--busy` class, flipped the "pending is frozen" assertion to `'busy'` and added the busy assertion to the AC-25 block (the subtask counts it as one of the two pending assertions; it had none, only the readout). 5 failing. GREEN — the one line `display.ts` reserved: the `pending` case projects `state: 'busy'`. 29/29.
- Cycle 2 — AC-12: RED — the four-case it.each in `App.test.tsx`, one end-to-end case per row of spec.md's error-contract table, each asserting the exact message in the value slot over the failed calculation and the `sc-display--error` class. Green on first run — the client's classification (slice 1) and the reducer's error path (p3) already carried every row; the missing piece was the coverage, so the tests themselves are the fix and no production line was added. 9/9.
- Cycle 3 — AC-13: RED — the recovery describe in `App.test.tsx`: a digit after each of the four errors, the decimal point, `C` from an error, `C` from a result. Green on first run — the reducer's `settled` rule (p3) already covers every recovery; these re-confirm it with real outcomes flowing through the wired client, which is what the subtask says AC-13 is. 16/16.
- Cycle 4 — AC-14: RED — the four new README pins in `scope-docs.test.ts` (client module + hook, env var + default, busy indicator + the four messages, no "dead end"), 4 failing against the old README. GREEN — README rewritten: intro no longer claims the app makes no network calls; the pending paragraph names the busy state (`Ready` → `Working`); the dead-end paragraph replaced by the client/hook/env-var paragraph and the four-presentation list; `src/api/` files described in "How it is built". One wrap fix mid-cycle so the quoted "Something went wrong — try again." stays on one line (the pin reads the literal). 15/15.
- Cycle 5 — AC-15: RED — the AGENTS.md describe in `scope-docs.test.ts` (no longer "does not yet call the gateway" / "makes no network calls of its own"; says it calls the gateway, naming client and hook), 2 failing. GREEN — `AGENTS.md`'s opening sentence corrected: the SPA calls the gateway through `src/api/client.ts` and `useCalculate`, its only network call the one `POST /api/v1/calculate`. 17/17.
- Gate — `npx turbo run lint check-types test --output-logs=errors-only`: 15/15 tasks successful. AC-15's build leg is not in this invocation's command list; it rides the fix step's gate, as slice 2's F1 established.

`refactor:` — subtask-3 carries none; nothing to pin.

Fix cycles (review-slice-3 findings):

- Fix F1 — AC-15's build leg exercised by no gate: ran the gate with `build` included and recorded the build leg in AC-15's map above. Test-step fix, as the review ruled — production code not implicated and no new test to write; the finding was the unexercised check, and the check has now run.

closing-commit: fea1680
