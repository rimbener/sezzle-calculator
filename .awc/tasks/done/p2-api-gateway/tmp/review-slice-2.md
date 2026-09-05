# review-slice-2 — slice 2, the client (subtask-2, subtask-3)

**Verdict: APPROVED**

Reviewed once against slice 1's recorded closing commit, `9f9870a` (read from `tdd-1.md`'s `closing-commit:` line), commits and working tree, plus every untracked file the slice added under `apps/api-gateway/`. The only commit past `9f9870a` is `4403615` ("close slice 1 record with its commit hash") — the trail commit that wrote the line I read the hash from; no finding on it. The `status: todo → done` flips on `subtask-2.md` / `subtask-3.md` and the new `tdd-2.md` are the slice's own bookkeeping.

## Suite

`npx turbo run test --output-logs=errors-only` from the launch directory: `Tasks: 5 successful, 5 total`, seven packages in scope (`api-gateway` now among them; `@repo/eslint-config` and `@repo/typescript-config` have no `test` script, as before). The first run replayed from Turbo's cache (`5 cached`), so I ran the same command once more with `--force` to bypass it: `5 successful, 5 total, 0 cached`. Turbo's per-package log confirms the gateway's suite executed inside that — `apps/api-gateway/.turbo/turbo-test.log`: `src/config.test.ts (4 tests)`, `src/calc-client.test.ts (28 tests)`, `32 passed (32)`; calc-service still `14 files, 90 passed`. No failing test.

## Diff reviewed

Tracked: `AGENTS.md` (+3/−3 statements), `package-lock.json` (+38, additive: the `apps/api-gateway` workspace block, its nested `@types/node` 22.20.1 + `undici-types` 6.21.0 mirroring calc-service's own nested pair at lockfile `:72-82`, and the `node_modules/api-gateway` link). Untracked: `apps/api-gateway/{package.json,tsconfig.json,vitest.config.ts,eslint.config.mjs}`, `apps/api-gateway/src/{config,config.test,calc-client,calc-client.test}.ts`. Nothing under `apps/calc-service`, `apps/sezzle-calculator`, `packages/*` or `turbo.json` moved.

## Lens 1 — correctness against the contract

| Criterion | Test | Ruling |
| --- | --- | --- |
| AC-5 — the four dev defaults with nothing set | `apps/api-gateway/src/config.test.ts:16` — `resolveConfig({})` equals `{ 3000, http://localhost:3001, 3000, http://localhost:5173 }` | covered |
| AC-5 — the spec's four variable names, one exported source | `config.test.ts:25` — `GATEWAY_PORT`, `CALC_SERVICE_URL`, `CALC_SERVICE_TIMEOUT_MS`, `CORS_ORIGIN` pinned by value against the exported constants | covered |
| AC-5 — each variable moves its value with no code edit | `config.test.ts:39` — all four set at once, each resolved value follows | covered |
| AC-5 — no collision with calc-service | `config.test.ts:55` — `CALC_SERVICE_PORT` and `PORT` leave the config untouched | covered |
| AC-6 — one POST, `<url>/calculate`, JSON content type, body exactly `{ operation, operands }`, caller's extra key dropped | `calc-client.test.ts:50` — `toHaveBeenCalledTimes(1)`, URL, method, header via `Headers`, `toStrictEqual` on the parsed body with `junk` gone | covered |
| AC-6 — trailing slash on the base URL | `calc-client.test.ts:68` | covered |
| AC-7 — 200 result yields the number unaltered | `calc-client.test.ts:78` — `0.30000000000000004` survives `toStrictEqual` | covered |
| AC-7 — 422 with each of the three domain codes relays code and message | `calc-client.test.ts:84` (`it.each` × 3, message from `ERROR_MESSAGES`) | covered |
| AC-7 / AC-2 — extra key on a valid result or envelope is not an outage | `calc-client.test.ts:95`, `:101` | covered |
| AC-8 — every other answer is unreachable | `calc-client.test.ts:118` (× 11: 500, 400, 503, four bad 200 bodies, four bad 422 bodies) and `:144` (non-JSON body at 200 and 422) | covered |
| AC-9 — refused then success: one retry after ~100 ms, the result | `calc-client.test.ts:159` — second call absent at 99 ms, present at 100 ms | covered |
| AC-9 — two refusals: unreachable, exactly two attempts | `calc-client.test.ts:174` | covered |
| AC-9 — deadline during the pause after a refusal: unreachable, attempt 2 skipped | `calc-client.test.ts:251` | covered |
| AC-9 / AC-10 — deadline mid-attempt-2: unreachable, and the call settles exactly at the budget | `calc-client.test.ts:268` — unsettled at 149 ms, settled at 150 ms, not 100 + 150 | covered |
| AC-10 — never answers, never refused: timeout at the deadline, one attempt, no retry | `calc-client.test.ts:192` — unsettled at 2999 ms, settled at 3000 ms, `toHaveBeenCalledTimes(1)` | covered |
| AC-10 — a fetch honouring the signal (rejects `AbortError`) still reads as timeout, no retry | `calc-client.test.ts:213` | covered |
| AC-10 — the signal handed to fetch is aborted at the deadline | `calc-client.test.ts:230` | covered |

Every criterion the slice owns (AC-5 … AC-10) has a concrete test, and `tdd-2.md`'s `criterion → test` map names each one. Neither subtask carries a `refactor:` entry, so there is no `preserves:` clause to rule on; the on-green refactor `tdd-2.md` logs at cycle 12 (the catch reads `controller.signal.aborted` before counting a refusal) is inside the slice's own new code, covered by `calc-client.test.ts:213`.

Code read against the spec's § The downstream call, `apps/api-gateway/src/calc-client.ts`:

- `classify` (`:61-75`) decides by `calculateResponseSchema` at 200 and `errorResponseSchema` + `isDomainErrorCode` at 422, everything else `unreachable` — the spec's table, row for row. The `DOMAIN_ERROR_CODES` set (`:38-42`) is built from `ERROR_CODES`, no restated string.
- One `AbortController` + `setTimeout(timeoutMs)` per call (`:115-116`), cleared in `finally` (`:166`); the signal rides in the request init (`:124`) so a real socket is released. The `Promise.race` against `onAbort(...).then(expired)` (`:161-164`) means a fetch that ignores the signal still cannot hold the call — AC-10's "no call takes materially longer".
- `attempts` (`:141-156`): a non-abort rejection sets `refused`, pauses `RETRY_PAUSE_MS` (abortable, `:81-92`), re-checks the signal, then makes exactly one more attempt whose rejection is `unreachable`. A rejection with the signal already aborted is `expired()`, never a refusal — so no third attempt is possible on any path and a timeout is never retried.
- `expired()` (`:139`) returns `unreachable` once `refused` is set, `timeout` otherwise — the spec's "a refusal already observed wins" in one place, read by both the race and the catch.
- `attempts()` cannot reject: the first attempt is inside `try`, the second carries `.catch`, `pause` and `expired` never throw, `parseJson` swallows, `safeParse` does not throw. So the route will never see a `Response`, a status or a thrown error, as subtask-3 promises.

Nothing built ahead of a scenario: no `app.ts`, no `server.ts`, no Hono import, no `dev`/`start` script, no 502/504 mapping — the client returns the discriminated union and stops. Exports beyond what the tests use (`CalcOutcome`, `CalcClient`, `CalcClientOptions`, `DomainErrorCode`, `GatewayConfig`) are the types slice 3's `createApp` consumes, not behaviour.

## Lens 2 — project conventions

- Tooling mirrors `apps/calc-service` byte-for-byte where subtask-2 says it should: `tsconfig.json`, `vitest.config.ts` and `eslint.config.mjs` are identical to calc-service's; `package.json` carries the same dependency set and versions, minus the `dev`/`start` pair subtask-2 deliberately leaves to subtask-5 (a `dev` pointing at a missing `server.ts` would break root `npm run dev` for the length of the slice). No new third-party dependency; `turbo.json` untouched, as the spec's Surfaces table says.
- BE-1 respected: the gateway imports only `@repo/contracts` and Node built-ins — nothing from `apps/calc-service`, and nothing from Hono yet. No arithmetic anywhere in the diff.
- BE-9 respected: `config.ts` is pure in `env` (`resolveConfig(env)`, `:47-58`), reads no `process.env` at import time, and the only URL in the service is the dev default `DEFAULT_CALC_SERVICE_URL`. Variable names follow Phase 1's service-prefixed convention; `integer()`'s `Number(value)` reading mirrors calc-service's `resolvePort` exactly (same absence of validation — the spec asks for none).
- Style: `@repo/eslint-config` workspace conventions (semicolons, double quotes), `.ts` extensions on relative imports, `type` imports under `verbatimModuleSyntax`. `npx prettier --check` over `apps/api-gateway/**` and `AGENTS.md`: all files conform.
- Lockfile: additive only; the nested `@types/node` 22.20.1 / `undici-types` 6.21.0 pair under `apps/api-gateway/node_modules` is the same shape calc-service already has, keeping the `^22.20.1` pin below the hoisted 26.x.

No finding.

## Lens 3 — user surface

The slice adds no CLI, route or UI; the one user-facing surface it touches is **configuration**. The four variables and their defaults (`config.ts:8-16`) are exactly those of `spec.md` § Configuration — `GATEWAY_PORT` 3000, `CALC_SERVICE_URL` `http://localhost:3001`, `CALC_SERVICE_TIMEOUT_MS` 3000, `CORS_ORIGIN` `http://localhost:5173` — and the names follow the service-prefixed convention `CALC_SERVICE_PORT` set. The 100 ms retry pause is a constant (`calc-client.ts:78`), not a variable, as the spec settles. No output or error text reaches a user from this slice; HTTP output and errors are slice 3's and will be reviewed there.

## Lens 4 — docs parity

In this slice's diff:

- `AGENTS.md:40` — "`@types/node` … in all four workspaces that depend on it": verified, four `package.json`s declare it (`apps/api-gateway`, `apps/calc-service`, `apps/sezzle-calculator`, `packages/ui`).
- `AGENTS.md:42` — suites list now includes `apps/api-gateway/src/*.test.ts`: accurate (flat `src`, two test files).
- `AGENTS.md:56` — `apps/api-gateway` added to the `@repo/eslint-config` consumers: accurate (`eslint.config.mjs:1`).

`spec.md` § Surfaces allocated these three sentences to slice 3, but its governing rule is "each updated in the slice that falsifies it", and slice 2 is the slice that falsifies them; pulling them forward is the rule applied, not a deviation. Slice 3 will find them already done.

Left for slice 3, as the spec allocates and `tdd-2.md` explains: `AGENTS.md:7` "the gateway is not built" and the missing `apps/api-gateway` entry under § Monorepo layout. With no `app.ts`, no `server.ts`, no route and no `dev`/`start` script, the gateway as a runnable service is indeed still not built, and a layout entry now would describe modules that are half there. Not a contradiction with the code; not deferred docs of behaviour this slice changed.

Checked for other stale statements: `apps/calc-service/README.md:8` ("Only the API gateway calls it") and `:33` were already written in anticipation and stay true; `packages/contracts/README.md` names no consumer; root `README.md` untouched. `apps/api-gateway/README.md` is AC-19's and subtask-5's, not this slice's.

## Note on the other root tasks

`Commands:` named the test task only, so I ran that (twice, the second uncached) and nothing else from the gate. `tdd-2.md:3` reports `lint check-types test` 15/15 green at the slice gate; the task-level gate that runs all four root scripts should confirm `lint`, `check-types` and `build`.

## Findings

None. All four lenses pass; the suite is green with the gateway's 32 tests confirmed to have run; every criterion the slice owns is mapped to a concrete test; nothing is built ahead of slice 3's scenarios.
