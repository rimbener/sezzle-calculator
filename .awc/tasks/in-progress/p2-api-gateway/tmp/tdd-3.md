# tdd-3 — slice 3, the public surface (subtask-4, subtask-5)

Verification: `npx turbo run lint check-types test --output-logs=errors-only` — 15/15 green at the slice gate; the gateway's suite is now 5 files / 86 tests (`app.test.ts` 45, `server.test.ts` 6, `no-arithmetic.test.ts` 3, plus slice 2's 32).

## Criterion → test

| Criterion | Test |
| --- | --- |
| AC-11 — 200 `{ result }` for all seven operations, the validated request handed to the client | `apps/api-gateway/src/app.test.ts` › "POST /api/v1/calculate — success (AC-11)" (× 7) |
| AC-12 — behavioural: an implausible number for `add(2, 3)` comes back exactly; no operation yields a result while the downstream fails | `app.test.ts` › "the gateway computes nothing (AC-12)" › "relays an implausible number…" and "yields no result for %s while the downstream is failing" (× 7) |
| AC-12 — structural: no module imports calc-service code or an operation implementation, none reaches for `Math` | `apps/api-gateway/src/no-arithmetic.test.ts` › three cases (scans every module; every import is the contract, Hono, Node, vitest or a sibling inside `src/`) |
| AC-13 — every malformed shape → 400 `VALIDATION_ERROR` with the contract's sentence, no downstream call, with calc-service unreachable | `app.test.ts` › "malformed requests (AC-13)" (× 12: unknown / absent / null / non-string operation, string / null / array body, too few / too many / missing operands, non-numeric, null operand) |
| AC-13 — a body that is not JSON → 400 `request body must be valid JSON`, no downstream call | `app.test.ts` › "a body that is not JSON (AC-13)" (× 4) and "stays up: answers a well-formed request right after a malformed one" |
| AC-14 — a domain error relayed as 422 with the downstream's code and message | `app.test.ts` › "a downstream domain failure (AC-14)" (× 3 codes) and "relays the downstream's message verbatim even when it is not the contract's sentence" |
| AC-15 — unreachable → 502 `calculation service is unreachable`; timeout → 504 `calculation service did not respond in time` | `app.test.ts` › "calc-service unavailable (AC-15)" (× 2) |
| AC-15 / AC-16 — no exception text reaches the caller: a client that rejects still answers the envelope at 502 | `app.test.ts` › "one envelope, no internal detail (AC-15, AC-16)" |
| AC-15 — live unreachable path, real client and real `fetch` | `apps/api-gateway/src/server.test.ts` › "answers a valid body with 502 SERVICE_UNAVAILABLE when CALC_SERVICE_URL points at nothing…" |
| AC-16 — every body exactly the envelope or exactly `{ result }` | every `toStrictEqual` on a body above (45 cases) |
| AC-17 — preflight from the configured origin allowed (origin, POST, `content-type`); another origin granted nothing; the actual POST marked allowed; no `Origin` header succeeds; `CORS_ORIGIN` moves the grant | `app.test.ts` › "CORS (AC-17)" (× 5) |
| AC-21 — recovery: two requests every attempt refused → 502, 502, then 200 with the downstream's number, one app instance, nothing reset | `app.test.ts` › "recovery after an outage (AC-21)" — through the real client with a fetch fake, four refusals then an answer |
| AC-18 — binds `GATEWAY_PORT`, 400 for a malformed body there, 502 for a valid one against a dead `CALC_SERVICE_URL`, the OS-picked port reported, no other port, released when stopped | `server.test.ts` › "start (AC-18)" (× 5) |
| AC-18 — `node src/server.ts` announces `api-gateway listening on port <n>`, answers, releases on exit | `server.test.ts` › "node src/server.ts — the entry point (AC-18)" |
| AC-18 — `GATEWAY_PORT` unset resolves to 3000 | `apps/api-gateway/src/config.test.ts` › "resolves the four dev defaults when none of the variables is set" (slice 2; not re-bound here — binding :3000 in a test would collide with a running gateway) |
| AC-19 — README: only public service, start and test commands, four variables with defaults, curl for a success / 400 / 422 / 502 with calc-service stopped | `apps/api-gateway/README.md` (docs, no test) |
| AC-20 — root lint / check-types / test green with the workspace; `npm run dev` schedules both services | the gate command (15/15); `npx turbo run dev --dry-run=json` lists `api-gateway#dev` and `calc-service#dev` (`node --watch src/server.ts` each) beside `sezzle-calculator#dev`. `npm run build` and a live `npm run dev` were not run — neither is in `Commands:` |

Neither subtask carries a `refactor:` entry, so no `refactor:` pin.

Deviation from `subtask-4.md`, recorded for the reviewer: `app.ts` exports `createApp` and no ready-made `app`. A ready-made `app` needs a client and a CORS origin, so it would have to read `process.env` at import time — which contradicts `subtask-5.md` and `spec.md` § Approach, where `server.ts`'s `start(env)` is the one place the production wiring is assembled and the client is built from the `env` argument. `spec.md` wins; tests reach the app through `createApp({ calcClient, corsOrigin })` and bind no port, which is what the ready-made export was for.

Docs landed in this slice: `apps/api-gateway/README.md` (new); `AGENTS.md` § What this is no longer says "mostly not yet built" / "the gateway is not built" and names the gateway; the Node-version bullet says both services run their `.ts` sources directly; § Monorepo layout gains the `apps/api-gateway` entry beside calc-service's. The suites list, the `@types/node` count and the `@repo/eslint-config` consumers were already updated in slice 2.

## Cycles

1. subtask-4 → in_progress. RED `app.test.ts` AC-11 seven operations through a fake client → GREEN `app.ts`: `createApp({ calcClient, corsOrigin })`, `POST /api/v1/calculate` parsing with `calculateRequestSchema` and serialising a `result`.
2. RED AC-12 implausible number (green on arrival — the 42 of cycle 1 already was one) + seven "no result while failing" → GREEN `fail` helper (status from `STATUS_BY_CODE`) and the `unavailable` → 502 branch.
3. RED AC-15 timeout → 504 → GREEN `fail` takes an optional explicit status; `GATEWAY_TIMEOUT = 504` on the timeout reason.
4. RED AC-14 three domain codes + a verbatim non-contract message → GREEN the `domain-error` branch; the outcome `if` chain became an exhaustive `switch`, dropping the placeholder throw.
5. RED AC-13 twelve malformed shapes, client never called → GREEN `safeParse` before the call, first issue's message at 400.
6. RED AC-13 four non-JSON bodies + stays-up pin → GREEN `parseJson` over `c.req.text()`, `INVALID_JSON_MESSAGE` at 400.
7. RED AC-15/16 a rejecting client leaks Hono's plain-text 500 → GREEN `app.onError` answering the 502 envelope.
8. Pin AC-21 (green on arrival — the app holds no state): real `createCalcClient` with a fetch fake, four refusals across two requests then an answer; asserts 502, 502, 200 and five fetch calls.
9. RED AC-17 five CORS cases (preflight 404, no allow-origin) → GREEN `hono/cors` on the route with `origin: corsOrigin`, `allowMethods: ["POST", "OPTIONS"]`, `allowHeaders: ["content-type"]`.
10. Pin AC-12 structural: `no-arithmetic.test.ts`. Prettier over `app.test.ts`. subtask-4 → done, subtask-5 → in_progress.
11. RED `server.test.ts` AC-18 (module missing) → GREEN `server.ts` — `start(env)` resolving config, building the real client on the global `fetch`, `createApp`, `serve`; `import.meta.main` announce — and the `dev`/`start` scripts in `package.json` that point at it. Server suite 475 ms: the 502 cases settle on the second refused connection, not the deadline.
12. Docs: `README.md`, `AGENTS.md`; Prettier; `turbo run dev --dry-run=json` lists both services' dev tasks; subtask-5 → done. Root gate.

closing-commit: 9afe3d9
