# tdd-2.md — Slice B — README (subtask-2)

## Criterion → test/check map

| Criterion | Verified by |
| --- | --- |
| AC-6 | `.nvmrc` pins `22.22.2`, matching `engines.node` (>=22.22.2, 22 line); README's prerequisites section carries the npm-major `EBADDEVENGINES` warning note and its intended-by-design rationale. Commands verified verbatim: `npm install` state, `npm test` → 15/15 tasks green (run with `--force`, not cache) |
| AC-7 | README carries the three-workspace architecture diagram (SPA :5173 → api-gateway :3000 → calc-service :3001, HTTP only), the assumptions/trade-offs section (sync HTTP + 3s deadline, static env-var config, one calc service), and links all four per-service READMEs without contradicting them (operation table, error envelope, statuses match their docs) |
| AC-8 | UC-11 performed live against the written README |

## Cycles

1. AC-6 — absent `.nvmrc` (red) → `.nvmrc` = `22.22.2` (green); README rewritten from the Turborepo starter: prerequisites with the Node pin, install/run/test/build/lint commands, per-workspace turbo filters.
2. AC-7/AC-8 — README had no architecture diagram or walkthrough (red) → diagram + assumptions/trade-offs + UC-11 walkthrough added (green).
3. Full-suite gate: `npx turbo run lint check-types test --force` → 15 successful / 15 total, 0 cached.

## UC-11 walkthrough (live, against the README's own commands)

| Step | Result |
| --- | --- |
| Suites (`npm test` equivalent, forced) | 15/15 green |
| Start calc-service + api-gateway | both bound :3001 / :3000 |
| UC-1 `add [2,3]` via curl | `200 {"result":5}` |
| UC-2 `divide [8,0]` | `422 {"code":"DIVISION_BY_ZERO"}` |
| UC-3 `power [2,10]` | `200 {"result":1024}` |
| UC-5 `percentage [15,200]` | `200 {"result":30}` |
| UC-6 wrong operand count | `400 {"code":"VALIDATION_ERROR","message":"operation 'sqrt' requires exactly 1 finite operand"}`; direct calc-service `sqrt` → `{"result":12}` |
| UC-7 calc-service stopped | `502 {"code":"SERVICE_UNAVAILABLE","message":"calculation service is unreachable"}`; gateway stayed up |
| UC-8 gateway stopped | SPA path covered by its suite (fetch-failure → connection-error presentation, gateway URL in client only); UI check per README ("Can't reach the calculation service — try again") |
| UC-4 sqrt in UI | `144`, `√` → fired immediately, curl equivalent verified on :3001 |

All exercisable under the 10-minute budget, no undocumented steps.
