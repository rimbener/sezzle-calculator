# Spec interview — p2-api-gateway

Read first: `tmp/user-story.md` (settled ground, never re-asked — it left no `## Open questions`), `docs/PRD-P0.md` §7/§8/§9, `docs/PRD-P1.md`, `docs/spec-phases.md`, `CLAUDE.md`, and the Phase 1 bundle under `.awc/tasks/done/p1-contract-calc-service/`.

Facts looked up, not asked:

- **The service's name and home are already fixed.** PRD §4 and BE-1 name it `api-gateway`; the repo splits runnable processes into `apps/` and shared code into `packages/` (Phase 1, spec-interview entry 1). So: `apps/api-gateway`, no workspace-glob change. Its tooling mirrors `apps/calc-service` — build-free source run under `node src/server.ts`, `@repo/eslint-config/base`, `@repo/typescript-config/base.json` with `erasableSyntaxOnly`, local `vitest.config.ts` with `environment: "node"`, `.ts` extensions on relative imports.
- **The Phase 1 layering is the template**: `src/app.ts` exporting `createApp()` + `app` (dependency-injectable, driven in tests through `app.fetch` with no port bound), `src/server.ts` with `start(env)` guarded by `import.meta.main`, `src/config.ts` with a pure `resolvePort(env)`.
- **What `@repo/contracts` exports today**: `OPERATIONS`, `OPERAND_COUNT`, `Operation`, `OperandCount`, `calculateRequestSchema` (a Zod schema with a transform), `CalculateRequest`, `CalculateResponse` (a *type*, no schema), `ERROR_CODES` (`VALIDATION_ERROR`, `DIVISION_BY_ZERO`, `NEGATIVE_SQRT`, `RESULT_NOT_FINITE`, `INTERNAL_ERROR` — **no `SERVICE_UNAVAILABLE`**), `ErrorCode`, `ErrorResponse` (a *type*, no schema), `ERROR_MESSAGES`, `INVALID_JSON_MESSAGE`, `OPERATION_REQUIRED_MESSAGE`, `operandsMessage`, `unknownOperationMessage`.
- **calc-service's HTTP layer**: `POST /calculate`, unversioned; `STATUS_BY_CODE` maps each error code to exactly one status; `fail(c, code, message)` sends the envelope; the raw body is read with `c.req.text()` and `JSON.parse`d by hand so invalid JSON is a 400 rather than a framework error.
- **Dependencies already in the repo**: `hono` 4.13.7, `zod` 4.5.4, `@hono/node-server` 2.1.1 (Phase 1 adopted it as Hono's Node adapter, explicitly "so the gateway reuses it"). CORS ships inside Hono itself as `hono/cors` — no new dependency. Node 22.22.2+ has global `fetch` and `AbortSignal.timeout`.
- **The Vite dev origin** is `http://localhost:5173`: `apps/sezzle-calculator/vite.config.ts` sets no `server.port`.
- **Root scripts** fan out through Turborepo; `npm run dev` is persistent and uncached, so adding the gateway makes it start both services in one shell — which is why Phase 1 chose the service-prefixed `CALC_SERVICE_PORT`.
- **The story's env-var sketch** (`GATEWAY_PORT`, `CALC_SERVICE_URL`, `CALC_SERVICE_TIMEOUT_MS`, `CORS_ORIGIN`) is consistent with that convention and with BE-9's "no hardcoded cross-service URLs"; adopted as-is, since the story recorded the naming as this step's call and these names collide with nothing.

## 1 — the shared contract's additions
Q: The gateway needs two things from `@repo/contracts` that Phase 1 did not ship. First, `SERVICE_UNAVAILABLE`, and the message(s) behind it — one sentence covering both 502 and 504, or a distinct sentence each ("unreachable" vs "did not answer in time"). Second, the story's rule that an unrecognisable downstream answer becomes 502 means the gateway must *check* what calc-service sent, and today the package exports `CalculateResponse` and `ErrorResponse` as bare types with no Zod schema to parse them against. What should the package gain?
A: **Two messages + response schemas.** `SERVICE_UNAVAILABLE` joins `ERROR_CODES` with two distinct exported sentences — one for unreachable, one for timed out — so a reviewer reading curl output sees which failure it was, and the SPA can still show one outage message. Plus `calculateResponseSchema` and `errorResponseSchema`, so the gateway parses the downstream reply against the contract instead of trusting it. Consequence: `ERROR_MESSAGES` stays one-sentence-per-code by excluding `SERVICE_UNAVAILABLE`, whose two sentences are named constants beside `INVALID_JSON_MESSAGE`.

```
@repo/contracts gains:
  ERROR_CODES.SERVICE_UNAVAILABLE
  SERVICE_UNREACHABLE_MESSAGE = "calculation service is unreachable"
  SERVICE_TIMEOUT_MESSAGE     = "calculation service did not respond in time"
  calculateResponseSchema  ({ result: finite number })
  errorResponseSchema      ({ error: { code, message } })

502 → "...is unreachable"    504 → "...did not respond in time"
```

## 2 — the downstream call
Q: What does the gateway actually send to calc-service, and how does it classify a call that fails? Two sub-choices ride together: whether the downstream body is the request the gateway itself parsed (re-serialised) or the client's raw bytes forwarded verbatim; and whether a refused connection gets one retry before the 502.
A: **Re-serialise, retry once.** The gateway parses the body with the shared schema and sends its own canonical `{operation, operands}` JSON downstream; a connection-level failure (refused, reset — never a timeout) is retried once before returning 502, so a calc-service restarting between requests can succeed instead of surfacing an outage. Costs accepted: the retry needs its own test, and a reviewer stopping calc-service waits slightly longer to see the 502.

```
client → gateway   {"operation":"add","operands":[2,3],"junk":1}
gateway → calc     {"operation":"add","operands":[2,3]}

refused → retry once → still refused → 502
TimeoutError → 504 (never retried)
```

## 3 — the downstream call
Q: The retry raises a timing question the previous answer left open. `TimeoutError` is never retried, so a hung downstream still answers 504 at ~3s either way — but a *refused* connection fails in milliseconds, so the second attempt starts almost immediately and would hit the same closed port. Should the timeout be a per-attempt budget or one shared deadline, and should the retry pause first?
A: **Shared deadline, short pause.** One 3s budget covers the whole call including the retry, and the second attempt waits a short fixed pause (~100ms) first, so it actually gives a restarting service a moment to come back rather than re-hitting a still-closed port. BE-6's "returns within ~3s" then holds literally for every path, not just the timeout one, and the pause is a constant a test can drive with fake timers.

```
budget 3000ms total, shared

refused at 5ms → pause 100ms → attempt 2 (2895ms left)
  succeeds        → 200
  refused again   → 502 is unreachable   (~105ms)
  hangs           → 504 did not respond in time (at 3000ms)

no path exceeds ~3s
```

## 4 — the test seam
Q: BE-11 wants the gateway's suite to run with the downstream **mocked**, and the seam chosen decides how much of the interesting logic — the shared deadline, the retry and its pause, the timeout/unreachable split, the schema check on the reply — is actually exercised rather than stubbed away. Where should the fake go?
A: **Inject a fetch-shaped function.** The app takes its downstream client as an injected dependency the way calc-service's `createApp` already takes `calculate`, and the client itself takes a fetch-shaped function. Every test runs the real client — real deadline, real retry, real classification, real schema check — against a fake that resolves, rejects or hangs on command. No ports bound, no globals patched, and the seam is visible in the types.

```
createApp({ calculate: createCalcClient({ fetch: fake, ...config }) })

fake rejects ECONNREFUSED twice → 502   (retry exercised)
fake never settles              → 504   (deadline exercised)
fake resolves 422 envelope      → 422   (pass-through)
fake resolves {"oops":1}        → 502   (schema check)

driven through app.fetch — no port bound
```

## 5 — reshaping existing code
Q: The gateway needs the same two small HTTP helpers calc-service already has — a `fail(c, code, message)` that sends the envelope, and a status lookup — plus the same hand-rolled `JSON.parse` of the raw body that makes invalid JSON a 400. Do I lift those into shared code and refactor calc-service onto them, or does the gateway keep its own? Note the two status tables genuinely differ: calc-service maps every code to exactly one status, while at the gateway `SERVICE_UNAVAILABLE` is 502 *or* 504 and the domain codes arrive with their status already chosen by the downstream.
A: **Share the data, not the glue.** Only the pure fact moves — calc-service's code→status map becomes an exported constant in `@repo/contracts` — while each service keeps its own Hono `fail` and body parsing. Smaller reach into Phase 1 than a full lift, accepting that the gateway uses only part of that map.

```
packages/contracts   + code, messages, schemas, STATUS_BY_CODE
apps/api-gateway     new, uses part of the map
apps/calc-service    imports the map instead of declaring it

glue still written twice
```

---

Every area this step must cover is settled: the story left no open questions; the shared contract's additions (1), failure semantics and the downstream call (1, 2, 3), the test seam (4), reshaping existing code (5), surfaces (looked up — `apps/api-gateway`, fixed by PRD §4/BE-1 and the repo's `apps/`/`packages/` split), non-goals and discarded alternatives (recorded in `spec.md`).

Taken by this step rather than asked, being representation rather than product: the shared `STATUS_BY_CODE` gives each code its **default** status, with `SERVICE_UNAVAILABLE` → 502; the gateway returns 504 explicitly on the timeout path, which is the one status not derivable from the code alone. Bundle written.
