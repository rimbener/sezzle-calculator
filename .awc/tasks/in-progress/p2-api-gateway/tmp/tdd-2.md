# tdd-2 — slice 2, the client (subtask-2, subtask-3)

Verification: `npx turbo run lint check-types test --output-logs=errors-only` — 15/15 green at the slice gate (the gateway adds three tasks to slice 1's twelve).

## Criterion → test

| Criterion | Test |
| --- | --- |
| AC-5 — the four dev defaults with nothing set | `apps/api-gateway/src/config.test.ts` › "resolves the four dev defaults when none of the variables is set" |
| AC-5 — the variable names and defaults, one exported source | `config.test.ts` › "exports the defaults it resolves to and the spec's four variable names" |
| AC-5 — each variable moves its value with no code edit | `config.test.ts` › "reads each variable when it is set, with no code edit" |
| AC-5 — nothing else moves it (`CALC_SERVICE_PORT`, `PORT`) | `config.test.ts` › "ignores every other variable, calc-service's port included…" |
| AC-6 — one POST, `<url>/calculate`, JSON content type, body exactly `{ operation, operands }` with the caller's extra key dropped | `apps/api-gateway/src/calc-client.test.ts` › "the request (AC-6)" › "sends one POST to <url>/calculate…" |
| AC-6 — trailing slash on the base URL | `calc-client.test.ts` › "joins /calculate onto a base URL that already ends in a slash without doubling it" |
| AC-7 — a 200 result yields the number unaltered (`0.30000000000000004` survives) | `calc-client.test.ts` › "a recognisable answer (AC-7)" › "yields the downstream's number unchanged…" |
| AC-7 — a 422 with each of the three domain codes relays code and message | `calc-client.test.ts` › "relays code and message unchanged for a 422 whose envelope carries %s" (× 3) |
| AC-7 / AC-2 — an extra key on a valid result or envelope is dropped, not an outage | `calc-client.test.ts` › "drops an unrecognised key on an otherwise valid result…" and "…envelope…" |
| AC-8 — 500, 400, 503, 200 with an invalid body (string result, missing field, null, an envelope), 422 with a result / unknown code / non-domain code / non-string message | `calc-client.test.ts` › "every other answer is unreachable (AC-8)" › "reports %s as unreachable" (× 11) |
| AC-8 — a body that is not JSON, at 200 and at 422 | `calc-client.test.ts` › "reports a %i whose body is not JSON as unreachable" (× 2) |
| AC-9 — refused then success: one retry after ~100 ms (not at 99), the result | `calc-client.test.ts` › "one retry on a refused connection (AC-9)" › "retries once after about 100 ms…" |
| AC-9 — two refusals: unreachable, exactly two attempts, never a third | `calc-client.test.ts` › "reports two refused attempts as unreachable and never makes a third" |
| AC-9 — deadline during the pause after a refusal: unreachable, attempt 2 skipped | `calc-client.test.ts` › "a refusal already seen beats the deadline (AC-9)" › "…during the retry pause…" |
| AC-9 / AC-10 — deadline mid-attempt-2: unreachable; the whole call settles exactly at the budget (150 ms, not 100 + 150) | `calc-client.test.ts` › "…mid-second-attempt, and the whole call still ends at the budget" |
| AC-10 — never answers, never refused: timeout at the deadline (not at 2999 ms), one attempt, no retry | `calc-client.test.ts` › "the deadline (AC-10)" › "reports a downstream that never answers as timed out…" |
| AC-10 — a fetch that honours the signal (rejects with AbortError) still reads as timeout, no retry | `calc-client.test.ts` › "reads a fetch rejected by its own aborted signal as the deadline, not a refusal…" |
| AC-10 — the signal handed to fetch is aborted at the deadline (a real socket is released) | `calc-client.test.ts` › "hands fetch a signal that is aborted at the deadline…" |

Neither subtask carries a `refactor:` entry, so no `refactor:` pin. One refactor on green happened anyway, logged at cycle 12.

Docs landed in this slice: `AGENTS.md`'s three statements slice 2 falsifies — the `@types/node` workspace count (four), the suites list (`apps/api-gateway/src/*.test.ts`), the `@repo/eslint-config` consumers (`apps/api-gateway`). "The gateway is not built" (§ What this is) and the `apps/api-gateway` layout entry stay for slice 3 as `spec.md` § Surfaces allocates them: with no HTTP surface, no `server.ts` and no `dev`/`start` script, the gateway as a service is still not built, and its entry would describe modules that are half there.

## Cycles

1. Scaffold `apps/api-gateway` (package.json without `dev`/`start` — subtask-5's; tsconfig / vitest.config / eslint.config copied from calc-service). `npm install` under Node 22's npm 10.9.8 (`~/.nvm/versions/node/v22.23.2`): the shell's npm 12 strips every `"peer": true` flag and drops the hoisted optional `@types/node@26.4.1` / `undici-types@8.3.0` from both lockfile and `node_modules`, so that run was reverted and the npm 10 run kept — lockfile diff is the additive +38 (workspace block, nested `@types/node` 22.20.1 + `undici-types` 6.21.0, the `node_modules/api-gateway` link). RED config.test.ts defaults → GREEN `config.ts` constants + `resolveConfig` returning them.
2. RED config.test.ts reads each of the four variables (+ the names/defaults pin) → GREEN `text` / `integer` helpers reading `env`.
3. Pin (green on arrival): `CALC_SERVICE_PORT` and `PORT` leave the config unchanged. Workspace lint + check-types green; subtask-2 → done, subtask-3 → in_progress.
4. RED calc-client.test.ts AC-6 request shape → GREEN `createCalcClient` posting `{ operation, operands }` to `<base>/calculate`, a placeholder outcome.
5. Pin trailing slash (green on arrival — cycle 4's join helper already strips it); RED AC-7 200 → result → GREEN `classify` through `calculateResponseSchema`, body read with `parseJson`.
6. RED AC-7 422 × three domain codes → GREEN `errorResponseSchema` + `isDomainErrorCode` (`DOMAIN_ERROR_CODES` set).
7. Pins (green on arrival — `classify`'s default branch): AC-8's eleven status/body cases, non-JSON at 200/422, extra key on result / envelope. Narrowing in `classify` restructured so `tsc` sees the type guard on `code`.
8. RED AC-9 refused-then-success, second call at 100 ms not 99 → GREEN catch, `pause(RETRY_PAUSE_MS)`, second attempt.
9. RED AC-9 two refusals → unreachable, two calls → GREEN the second attempt's rejection → `unreachable`.
10. RED AC-10 hang → timeout at 3000 not 2999, one call; signal aborted at the deadline → GREEN `AbortController` + `setTimeout` deadline (cleared in `finally`), `signal` in the request init, `Promise.race` of the attempts against the abort — a fetch that ignores the signal still cannot hold the call.
11. RED AC-9 deadline during the pause → unreachable, one call → GREEN `refused` flag + `expired()` read by the deadline path, `pause` abortable, attempt 2 skipped once aborted.
12. Pin: a signal-honouring fetch (rejects with `AbortError` on abort) reads as timeout with no retry — green on arrival, but only because `onAbort().then(expired)` won the microtask race against the rejection climbing two `await`s into the catch. Refactor on green: the catch checks `controller.signal.aborted` before counting a refusal, so the reading is explicit. Suite still green.
13. Pin (green on arrival): deadline mid-attempt-2 → unreachable, two calls, settled at exactly 150 ms.
14. Prettier over the workspace; `AGENTS.md`'s three statements; workspace lint / check-types / test green; subtask-3 → done. Root gate.
