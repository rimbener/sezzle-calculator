# Phase 2 — the public gateway: one address the browser knows, and a graceful failure when the one behind it is gone

**As a** reviewer evaluating this codebase (a Sezzle engineer who reads the code, runs the suites, calls the API with curl, and deliberately stops a service to see what happens)
**I want** a second, public service that is the only address a client ever calls — validating every request itself, forwarding the valid ones to the calculation service, and turning every way that call can fail into a clear, structured answer
**so that** the browser never learns the calculation service's address, the two-service boundary is observable rather than asserted, and a downstream outage produces a documented status code instead of a hung request or a raw fetch error.

## Context

Covers `BE-2`, `BE-6`, `BE-10`, and the gateway half of `BE-1`, `BE-3`, `BE-5`, `BE-8`, `BE-9`, `BE-11` — Phase 2 of `docs/PRD-P0.md` §11.

Phase 1 is built and in history: `packages/contracts` (`@repo/contracts` — the seven operation names, their operand counts, the Zod request schema, the `{ result }` and `{ error: { code, message } }` shapes, the error codes and every message string; consumed as source with no build step) and `apps/calc-service` (a Hono app answering `POST /calculate` on `CALC_SERVICE_PORT`, default 3001, run build-free as `node src/server.ts`). This slice adds the second service beside it. The SPA and `@repo/ui` are untouched — the frontend that will call this gateway is Phases 3 and 4.

The one gap Phase 1 left for this slice: `SERVICE_UNAVAILABLE`, which PRD §9 requires for 502 and 504, is not among the error codes the shared package exports today. It joins the shared set here, so both the gateway and the later SPA read it from one place.

Three points the PRD left open, and the human's calls on them:

- **A downstream that answers, but wrongly.** PRD §9 covers 200, 400, 422, 502 and 504, and says nothing about calc-service returning its own `500 INTERNAL_ERROR`, an unexpected status, or a 200 whose body is not a valid result. The call: the gateway passes through only what the contract names — a result and a 422 domain error — and treats every other downstream answer as an unavailable downstream, i.e. `502 SERVICE_UNAVAILABLE`. The public surface therefore has exactly the five outcomes §9 lists, and no sixth.
- **A configurable timeout.** `docs/spec-phases.md` calls the 3s timeout env-configurable, while `docs/PRD-P1.md` BE-13 files exactly that as P1 — a collision, since P1 work is not to start before P0 is done. The human's call: pull BE-13 forward. The timeout is an env var defaulting to 3 seconds, resolved beside the port and the calc-service URL, so BE-6's acceptance (a hung downstream returns 504 in ~3s with nothing configured) still holds and the 504 path is testable without waiting three real seconds.
- **The CORS origin.** BE-10 asks only for "the frontend dev origin"; the SPA runs at Vite's default `http://localhost:5173`. The call: one allowed origin, from an env var defaulting to that, so an unconfigured checkout works and a shifted Vite port is a config change rather than a code edit.

No collision with a stated non-goal otherwise: health endpoints (BE-7), the 404 envelope (BE-19), request logging (BE-12) and rate limiting (BE-16) all stay out, and the gateway performs no arithmetic of any kind — that is the assessment's hard requirement, not a preference.

## Acceptance criteria

- The gateway is a second service that starts, runs and tests entirely on its own: its own entry point, port, scripts and suite, no import of calc-service code in either direction, and communication only over HTTP.
- `POST /api/v1/calculate` is its only public route, and all seven operations — add, subtract, multiply, divide, power, sqrt, percentage — return `200 { "result": number }` through it, with the same numbers calc-service produces directly. `sqrt` takes one operand; every other operation takes two.
- The gateway performs no arithmetic: no operation logic exists in it, and no result is computed, adjusted, rounded or defaulted anywhere in it.
- Malformed input is rejected by the gateway itself with `400 VALIDATION_ERROR` and no downstream call is made: unknown operation, missing fields, non-numeric operands, wrong operand count, `NaN`, `Infinity`, and syntactically invalid JSON. The message names the operation's real operand count — 1 for `sqrt`, 2 otherwise.
- Validation still answers with calc-service stopped: a malformed request returns its 400 whether or not the downstream is running.
- A valid request whose maths is impossible reaches the caller as calc-service's own `422` with the code and message unchanged: `DIVISION_BY_ZERO`, `NEGATIVE_SQRT`, `RESULT_NOT_FINITE`.
- With calc-service stopped, any valid operation returns `502` with code `SERVICE_UNAVAILABLE`, the gateway stays up, and restarting calc-service restores service without restarting the gateway.
- A calc-service that accepts the connection but does not answer in time returns `504` with code `SERVICE_UNAVAILABLE` within approximately the configured timeout — about 3 seconds with nothing configured. No request hangs indefinitely and no raw fetch or network error reaches the caller.
- Any other downstream answer — a 500, an unexpected status, or a body that is not a valid contract response — returns `502 SERVICE_UNAVAILABLE`.
- Every error response, at every status, has the body `{ "error": { "code": string, "message": string } }`, with codes and messages read from the shared contract package rather than restated. No response carries a stack trace or internal detail.
- The gateway's port, the calc-service URL and the request timeout all come from environment variables; with nothing set the gateway listens on 3000, calls calc-service on 3001 and times out at 3 seconds, and setting each variable changes that behaviour with no code change. No cross-service URL is hardcoded.
- A browser page served from the configured frontend dev origin — `http://localhost:5173` by default — can call the gateway successfully; the allowed origin moves with its environment variable. Non-browser callers such as curl are unaffected.
- The gateway's test suite runs with one documented command, with the downstream mocked rather than live, and covers: each validation failure, a successful proxied call for the operations, 422 pass-through, 502 for an unreachable downstream, 504 for a slow one, and 502 for an unrecognisable answer.
- The gateway carries its own README stating what it is, how to run it, how to configure it and how to test it, with a curl example for a success and for an error.
- What must not regress: `@repo/contracts` keeps every export Phase 1 shipped and gains only the new error code; calc-service keeps answering exactly as it does today; the SPA and `@repo/ui` still build, lint, type-check and test; the root README stays untouched.

## Notes

- The human settled three things that need no re-asking: unrecognised downstream answers map to `502 SERVICE_UNAVAILABLE` (only `{ result }` and 422 domain errors pass through); the timeout is env-configurable with a 3s default, deliberately pulling P1's BE-13 into this slice; the CORS allowlist is exactly one origin, env-configurable, defaulting to `http://localhost:5173`.
- The env-var names sketched during the interview (`GATEWAY_PORT`, `CALC_SERVICE_URL`, `CALC_SERVICE_TIMEOUT_MS`, `CORS_ORIGIN`) were illustration, not a decision — naming is the spec step's call, as is where in the workspace the service lives and how the timeout is implemented.
- Package-local documentation only, following the pattern Phase 1 set and the repo already shows: the new service gets its own README; the root README and the architecture write-up remain XC-2's job in Phase 5.
- Settled upstream and not open here: the public surface is versioned (`/api/v1/*`) while the internal route stays unversioned, because the gateway is the compatibility boundary (PRD §9); 422 is for valid-but-impossible maths and 400 for malformed (§10 Q3); Vitest is the test runner (§10 Q4); two services with no further split (§10 Q1); IEEE-754 doubles (§3).
- Out of scope by the PRD's own phasing: health endpoints (BE-7, BE-18), the 404 envelope (BE-19), request logging (BE-12), rate limiting and an expression endpoint (BE-15, BE-16), and every frontend change — the SPA does not call this gateway until Phase 4.
