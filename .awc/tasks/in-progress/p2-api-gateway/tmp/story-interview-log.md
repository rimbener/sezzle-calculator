# Story interview — p2-api-gateway

Source (inline): `BE-2, BE-6, BE-10 + gateway half of BE-1, BE-3, BE-5, BE-8, BE-9, BE-11: api-gateway with proxy and failure mapping` — requirement ids refer to sections of `docs/PRD-P0.md`.

## From the source
### Settled
- who — the Reviewer (PRD §5, primary persona): a Sezzle engineer who reads the code, runs the suites, and calls the gateway with curl (UC-11, UC-6, UC-7). The End user is served indirectly — the SPA (Phase 4) talks only to this service.
- what — a second runnable Hono app, `api-gateway`, public on :3000, exposing `POST /api/v1/calculate` as its only route (BE-2): Zod validation against the shared schemas (BE-3), forwarding valid requests to calc-service over HTTP, the shared error envelope (BE-5), no arithmetic of any kind (BE-8), env-var config (BE-9), CORS for the frontend dev origin (BE-10), its own port, scripts and Vitest suite (BE-1, BE-11), and 502/504 `SERVICE_UNAVAILABLE` mapping for downstream failure (BE-6).
- why — Phase 2 of PRD §11: it is the public boundary the SPA calls, so the browser never learns calc-service's address and the two-service requirement (PRD §2 goal 2) becomes observable — including the reviewer's UC-7 check of stopping calc-service and watching the gateway stay up.
- when/where — PRD §11 Phase 2, after Phase 1 (`.awc/tasks/done/p1-contract-calc-service/`). The repo already holds `packages/contracts` (`@repo/contracts`, consumed as source, no build step) and `apps/calc-service` (Hono on `CALC_SERVICE_PORT`, default 3001, answering `POST /calculate`, build-free `node src/server.ts`, `@hono/node-server`). No gateway exists.
- surface (coarse) — one new runnable app workspace beside `apps/calc-service`, plus whatever the shared contract package must gain for the gateway's own failure code. `apps/sezzle-calculator` and `packages/ui` are untouched (Phases 3–4).
- success — PRD acceptance clauses: all seven operations return `200 { "result": number }` through the gateway (BE-2); malformed input returns 400 `VALIDATION_ERROR` and never a 500 or a crash, including with calc-service down (BE-3, BE-1); 422 domain errors reach the caller unchanged (BE-4 pass-through); calc-service unreachable → 502 and timeout → 504, both `SERVICE_UNAVAILABLE`, never a hung request or a raw fetch error (BE-6, UC-7); env vars change the port and the calc-service URL with working defaults and no hardcoded cross-service URL (BE-9); the gateway contains no calculator logic and imports no calc-service code (BE-8, BE-1); its own suite runs with one documented command and covers validation failures, proxying with the downstream mocked, 422 pass-through and 502/504 mapping (BE-11).
- edges — the failure list is PRD-fixed: malformed input (unknown operation, wrong operand count, non-numeric/`NaN`/`Infinity` operands, invalid JSON) → 400 rejected at the gateway with no downstream call (UC-6); valid-but-impossible maths → 422 with the exact code from calc-service (UC-2, UC-3, UC-4); calc-service stopped → 502; calc-service hung → 504 within ~3s (UC-7). Every error body is `{ "error": { "code": string, "message": string } }` (BE-5), and error messages name the operation's real operand count — 1 for `sqrt` — which `@repo/contracts` already fixes as exported constants.
- surface (docs) — settled by repo precedent, not a question: every workspace here carries its own README (`packages/contracts/README.md`, `apps/calc-service/README.md`) with what it is, how to run it and how to test it; the root README and the architecture write-up stay XC-2's job (Phase 5).
- edges (error code) — `SERVICE_UNAVAILABLE` is required by PRD §9 for 502/504 but is absent from `@repo/contracts`' `ERROR_CODES` today (Phase 1 shipped `VALIDATION_ERROR`, `DIVISION_BY_ZERO`, `NEGATIVE_SQRT`, `RESULT_NOT_FINITE`, `INTERNAL_ERROR`). It joins the shared set in this slice — settled by the PRD, not open.

### Open
- ~~edges — what does a caller observe when calc-service *does* answer, but with something the contract does not cover: a `500 INTERNAL_ERROR`, an unexpected status, or a body that is not a valid contract response?~~ (settled by entry 1)
- ~~success — `docs/spec-phases.md` says the 3s timeout is "configurable by env var", but `docs/PRD-P1.md` BE-13 makes a configurable timeout P1. Is the timeout a fixed 3s constant in this slice, or an env var with a 3s default?~~ (settled by entry 2)
- ~~when/where — which origin(s) does CORS allow, and is that list fixed or env-configurable?~~ (settled by entry 3)

## 1 — edges
Q: PRD §9 fixes what the gateway returns for the cases it names: 200, 400, 422 pass-through, 502 unreachable, 504 timeout. It says nothing about a calc-service that *does* answer, but with something outside that list — its own `500 INTERNAL_ERROR` (Phase 1 added that code), an unexpected status, or a 200 whose body is not a valid `{ result }`. What should the caller (curl, and later the SPA) observe in those cases?
A: **Anything unrecognised → 502.** The gateway only ever passes through what the contract names: 200 `{result}` and 422 domain errors (and 400 it raises itself). Every other downstream answer — 500 INTERNAL_ERROR, an unexpected status, a body that fails the contract schema — becomes 502 SERVICE_UNAVAILABLE. A downstream that answers wrongly is treated as one that is unavailable, so the public surface has exactly the five outcomes PRD §9 lists.

```
downstream 200 {result}      → 200 {result}
downstream 422 <domain code> → 422 <same code+message>
downstream 500 INTERNAL_ERROR→ 502 SERVICE_UNAVAILABLE
downstream 503 / 404 / html  → 502 SERVICE_UNAVAILABLE
downstream 200 {"oops":1}    → 502 SERVICE_UNAVAILABLE
unreachable                  → 502 SERVICE_UNAVAILABLE
>3s                          → 504 SERVICE_UNAVAILABLE
```

## 2 — success
Q: The timeout has a conflict in the docs. `docs/spec-phases.md` (Phase 2, "answers to have ready") says "Timeout is 3s by default, configurable by env var", but `docs/PRD-P1.md` BE-13 makes exactly that — "the 3s default (BE-6) can be changed by env var" — a P1 item, and P1 work is not to start before P0 is done. PRD-P0 BE-6 itself only fixes the 3 seconds and calls it "(default)". Which do you want in this slice?
A: **Env var now, 3s default.** Follow `docs/spec-phases.md`: the timeout is a named env var alongside the port and the calc-service URL, defaulting to 3000ms with nothing set. This pulls BE-13 forward into P0 — it costs one more config value in the same resolver BE-9 already needs, and makes the 504 path testable without waiting 3 real seconds. BE-13 is then already done when P1 starts.

```
GATEWAY_PORT        default 3000
CALC_SERVICE_URL    default http://localhost:3001
CALC_SERVICE_TIMEOUT_MS  default 3000   ← BE-13, pulled into P0

BE-6 acceptance still holds: unset env → 504 at ~3s
```

(Variable names above are the human's illustration; final naming is the spec step's call.)

## 3 — when/where
Q: BE-10 says the gateway "allows the frontend dev origin", and the SPA runs on Vite's default `http://localhost:5173` (no port is set in `apps/sezzle-calculator/vite.config.ts`). How should the allowed origin be decided — fixed in code, configurable like the other three values, or open to any origin?
A: **Env var, 5173 default.** One more configurable value beside the port, the calc-service URL and the timeout: an allowed-origin env var defaulting to `http://localhost:5173`, so an unconfigured checkout works with `npm run dev` and a reviewer whose Vite picked another port fixes it without touching code. Matches BE-9's "no hardcoded cross-service URLs" spirit and keeps the browser allowlist to exactly one origin.

```
no env set  → allow http://localhost:5173
CORS_ORIGIN=http://localhost:4173 → allow that one

browser at 5173  → preflight OK, call succeeds
browser elsewhere→ blocked by the browser
curl (no Origin) → unaffected, always works
```
