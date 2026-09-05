# Spec — p2-api-gateway

The public API gateway: validation, proxying and failure mapping. Covers `BE-2`, `BE-6`, `BE-10` and the gateway half of `BE-1`, `BE-3`, `BE-5`, `BE-8`, `BE-9`, `BE-11` — Phase 2 of `docs/PRD-P0.md` §11.

Problem and observable success: [`tmp/user-story.md`](tmp/user-story.md). Verifiable behaviours: [`acceptance-criteria.md`](acceptance-criteria.md). Work breakdown: [`tmp/subtasks.md`](tmp/subtasks.md). Decisions below were taken with the human in [`tmp/spec-interview-log.md`](tmp/spec-interview-log.md).

## Summary

Add the second service: a public Hono app on :3000 with one route, `POST /api/v1/calculate`. It validates every request against the shared schema, forwards the valid ones to calc-service over HTTP, relays a result or a domain error unchanged, and turns every other outcome — unreachable, too slow, or an answer outside the contract — into `SERVICE_UNAVAILABLE` at 502 or 504. It computes nothing. `@repo/contracts` grows the pieces both services now need; calc-service's behaviour does not change.

## Surfaces touched

| Surface | Change |
| --- | --- |
| `packages/contracts` (`@repo/contracts`) | `SERVICE_UNAVAILABLE` added to `ERROR_CODES`; `SERVICE_UNREACHABLE_MESSAGE` and `SERVICE_TIMEOUT_MESSAGE`; `calculateResponseSchema` and `errorResponseSchema` for parsing a reply; `STATUS_BY_CODE` moved in from calc-service as the default status per code |
| `apps/calc-service` | imports `STATUS_BY_CODE` from the contract instead of declaring it — behaviour-preserving, no response changes (`tmp/subtask-1.md`) |
| `apps/api-gateway` | new — config resolver, calc-service client, Hono app, server entry, tests, README |
| `AGENTS.md` (root; `CLAUDE.md` is a symlink to it) | the statements this task falsifies, each updated in the slice that falsifies it. Slice 1: the `@repo/contracts` entry (six codes, the response schemas, the shared status map) and the `apps/calc-service` entry (`STATUS_BY_CODE` no longer declared there). Slice 3: "the gateway is not built", a new `apps/api-gateway` entry under § Monorepo layout, the suites list, the `@types/node` workspace count and the `@repo/eslint-config` consumers list |
| root `package-lock.json` | the new workspace and its dependencies |

Not touched: `apps/sezzle-calculator`, `packages/ui`, `packages/eslint-config`, `packages/typescript-config`, the root `README.md` and `.nvmrc` (XC-2's, Phase 5), `turbo.json` (the new workspace needs no task change).

## Approach

**Chosen — a build-free Hono app mirroring calc-service, with the downstream call isolated behind an injected client.**

`apps/api-gateway` repeats Phase 1's shape exactly: source run under `node src/server.ts` with no build step, `.ts` extensions on relative imports, `erasableSyntaxOnly`, `@repo/eslint-config/base`, a local `vitest.config.ts`. Four modules, each with one job: `config.ts` resolves the four environment values purely; `calc-client.ts` owns the downstream call and reduces every outcome to one discriminated union; `app.ts` parses, calls the client, serialises; `server.ts` binds the port. `createApp` takes its client as a dependency and the client takes a fetch-shaped function, so tests drive the real deadline, retry, classification and schema check against a fake — no ports, no patched globals.

The failure logic lives in the client, not the route: that keeps it testable in isolation and `app.ts` as thin as calc-service's (BE-8). The route maps a `result` outcome to 200, a `domain-error` outcome to 422, and an `unavailable` outcome to 502 or 504. No arithmetic exists anywhere in the service — every number in a response came from the downstream reply.

Alternatives weighed and why not:

- **Forward the client's raw bytes verbatim** (a true pass-through proxy) — makes BE-3's "a service does not trust its caller" visible end to end, but ships junk fields and odd encodings downstream and lets the two validators disagree on a body only one of them normalises. Re-serialising the parsed request keeps the boundary canonical.
- **Hono's `hc` RPC client for the downstream call** — typed end to end, but it imports calc-service's route types, and BE-1 forbids either service importing the other's code.
- **Stub `globalThis.fetch` in tests instead of injecting one** — adds nothing for testability, but the seam is invisible in the types and a leaked stub bleeds between files.
- **A real stub downstream on a free port** — genuinely refused and hung sockets, but slow, harder to make deterministic around the deadline, and further from BE-11's "downstream mocked".
- **Lifting `fail` and the raw-body JSON parse into a shared module** — one envelope writer for both services, but it either puts framework-shaped code in the framework-free contract package or adds a fourth workspace, and the shared-looking part is not shared: the gateway's status decision is a different function of a different input.
- **No retry on a refused connection** — a smaller, strictly bounded surface, but a calc-service restarting between requests surfaces as an outage the reviewer must retry by hand.

No new dependency: `hono` (with its built-in `hono/cors`), `zod` and `@hono/node-server` are already in the repo, the last adopted in Phase 1 so the gateway would reuse it. `fetch` and `AbortSignal.timeout` are Node built-ins on the pinned line.

## The downstream call

One shared deadline of `CALC_SERVICE_TIMEOUT_MS` (default 3000) covers the whole call, retry included, so no path exceeds ~3s. A connection-level failure — refused, reset — pauses 100ms and is retried **once**; a timeout is never retried. What comes back is classified by the contract's own schemas, never trusted:

| Downstream outcome | Gateway answer |
| --- | --- |
| 200 with a body matching `calculateResponseSchema` | `200 { "result": <that number> }` |
| 422 with a body matching `errorResponseSchema` whose code is `DIVISION_BY_ZERO`, `NEGATIVE_SQRT` or `RESULT_NOT_FINITE` | `422` with that code and message, unchanged |
| any other status, or a body that matches neither schema | `502 SERVICE_UNAVAILABLE` |
| connection refused twice | `502 SERVICE_UNAVAILABLE` |
| the deadline expires after an attempt was already refused — during the retry pause or mid-attempt-2 | `502 SERVICE_UNAVAILABLE`: a refusal already observed wins |
| the deadline expires with no attempt ever refused — the downstream only ever hung | `504 SERVICE_UNAVAILABLE` |

An unrecognised key in a downstream reply is ignored, not a failure: `{"result": 5, "junk": 1}` is a valid result and the gateway answers exactly `{"result": 5}`; the same holds of an extra key inside the error envelope. The schemas keep the fields the contract names and drop the rest, so a downstream that grows a field is not an outage, while what the gateway *emits* stays exactly the contract's shape.

## Error contract

Every error response is `{ "error": { "code": string, "message": string } }` (BE-5), with codes and messages read from `@repo/contracts` — the gateway restates no string.

| Status | Code | Case | Message |
| --- | --- | --- | --- |
| 400 | `VALIDATION_ERROR` | unknown operation, absent/non-string operation, wrong operand count, non-numeric operand, `NaN`, `Infinity` | the contract's existing sentences, unchanged from Phase 1 |
| 400 | `VALIDATION_ERROR` | body is not valid JSON | `request body must be valid JSON` |
| 422 | `DIVISION_BY_ZERO` / `NEGATIVE_SQRT` / `RESULT_NOT_FINITE` | relayed from calc-service | the downstream's own message, unchanged |
| 502 | `SERVICE_UNAVAILABLE` | unreachable, or an answer outside the contract | `calculation service is unreachable` |
| 504 | `SERVICE_UNAVAILABLE` | no answer within the deadline | `calculation service did not respond in time` |

A 400 is decided by the gateway alone and makes no downstream call — so validation still answers with calc-service stopped (BE-1). `INTERNAL_ERROR` stays calc-service's: a downstream 500 is an answer outside the gateway's contract and becomes 502. 404 keeps Hono's default (BE-19 is P1).

`STATUS_BY_CODE` in the contract carries each code's **default** status, with `SERVICE_UNAVAILABLE` → 502. The gateway returns 504 explicitly on the timeout path — the one status not derivable from the code alone. It is a plain object literal declared `as const satisfies Record<ErrorCode, number>`: literal status types, exhaustive over the codes, and no framework type in the contract package, whose dependencies stay `zod` alone (`tmp/subtask-1.md`).

## Configuration

All four values are resolved purely from `env`, with dev defaults that make an unconfigured checkout work (BE-9). No cross-service URL is hardcoded.

| Variable | Default | Meaning |
| --- | --- | --- |
| `GATEWAY_PORT` | `3000` | the port the gateway binds |
| `CALC_SERVICE_URL` | `http://localhost:3001` | calc-service's base URL; `/calculate` is joined onto it, so a trailing slash is harmless |
| `CALC_SERVICE_TIMEOUT_MS` | `3000` | the whole-call deadline (BE-13, pulled into P0 — `tmp/user-story.md`) |
| `CORS_ORIGIN` | `http://localhost:5173` | the single browser origin allowed |

The 100ms retry pause is a constant, not a variable: nothing in P0 or P1 asks to tune it.

## Non-goals

Arithmetic of any kind. Health endpoints (P1 — BE-7, BE-18), the 404 envelope (P1 — BE-19), request logging (P1 — BE-12), rate limiting and an expression endpoint (P2 — BE-15, BE-16). Any frontend change: the SPA does not call this gateway until Phase 4, and no calc-service or gateway URL enters `apps/sezzle-calculator` here. The root README and the architecture write-up (XC-2, Phase 5). Authentication, persistence, retries beyond the single one specified, and any behaviour change in calc-service.

## Resolved decisions

| Decision | Why |
| --- | --- |
| `apps/api-gateway`, mirroring calc-service's tooling | PRD §4/BE-1 fix the name; `apps/` holds runnable processes; repeating Phase 1's setup keeps one way of running a service in this repo |
| `SERVICE_UNAVAILABLE` plus two distinct messages | PRD §9 requires the code; two sentences let a reviewer with curl see *which* failure occurred, while the SPA still shows one outage message |
| `calculateResponseSchema` / `errorResponseSchema` in the contract | the rule "an unrecognisable answer is a 502" needs a definition of recognisable, and Phase 4's SPA needs the same one |
| `STATUS_BY_CODE` moved into the contract; the Hono glue stays per service | the status *fact* is shared; the status *decision* is not — the gateway's depends on the downstream's answer, not on the code alone |
| Re-serialise the validated request downstream | the boundary sends exactly what the contract describes; junk fields die at the public edge |
| One shared 3s deadline, one retry on a refused connection after a 100ms pause | a restarting calc-service recovers without the caller noticing, while BE-6's "answers within ~3s" stays literally true of every path |
| `CALC_SERVICE_TIMEOUT_MS` exists at all — P1's BE-13 pulled forward into P0 | the human's call (`tmp/user-story.md` § Context, third bullet), against `CLAUDE.md`'s and `docs/PRD-P1.md`'s "no P1 before P0 is done": `docs/spec-phases.md` already calls the 3s timeout env-configurable, BE-6's "answers in ~3s with nothing configured" still holds because the default *is* 3000, and the 504 path becomes testable without three real seconds |
| Timeouts are never retried | a downstream that is hanging will hang again, and retrying would break the 3s ceiling |
| A refusal already seen beats the deadline: the budget expiring after a refused attempt is 502, not 504 | the reviewer's question is "is it down or is it slow", and a refused connection has already answered it; 504 stays the reading of a call that only ever hung |
| The client is injected into `createApp`, and a fetch-shaped function into the client | the deadline, retry, classification and schema check are exercised for real in every test, with no port bound and no global patched (BE-11's "downstream mocked") |
| `GATEWAY_PORT`, `CALC_SERVICE_URL`, `CALC_SERVICE_TIMEOUT_MS`, `CORS_ORIGIN` | the service-prefixed convention Phase 1 set with `CALC_SERVICE_PORT`, so one shell can start both services with no collision |
| `hono/cors` with a single configured origin | CORS ships inside Hono — no new dependency — and one origin is what BE-10 asks for, moved by env var rather than a code edit |
