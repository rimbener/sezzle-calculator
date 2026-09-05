# Spec — p4-calculator-api-client

The API client, the hook, the busy state and the four error presentations. Covers `FE-2`, `FE-4`, `FE-5`, `FE-7` and the network half of `FE-8` — Phase 4 of `docs/spec-phases.md`.

Problem and observable success: [`tmp/user-story.md`](tmp/user-story.md). Verifiable behaviours: [`acceptance-criteria.md`](acceptance-criteria.md). Work breakdown: [`tmp/subtasks.md`](tmp/subtasks.md). Decisions below were taken with the human in [`tmp/spec-interview-log.md`](tmp/spec-interview-log.md) and [`tmp/story-interview-log.md`](tmp/story-interview-log.md).

## Summary

Wire the calculator's already-built `onRequest` seam to the real gateway. One typed module calls `POST /api/v1/calculate` and reduces every reply — success, a domain error, an outage, an unreachable gateway, or anything else — to the outcome shape the state machine already understands; a hook hands that module to components; `App` passes it to `Calculator`; the display's existing (until now unused) `busy` state shows while a call is in flight. No arithmetic is added anywhere, and `p3-calculator-ui`'s reducer, key model and display projection are extended, never respecified.

## Surfaces touched

| Surface | Change |
| --- | --- |
| `apps/sezzle-calculator/src/api/client.ts`, `client.test.ts` | new — the one typed module FE-7 asks for: config resolution, the `fetch` call, and classification into `CalculationOutcome` |
| `apps/sezzle-calculator/src/api/useCalculate.ts` | new — the hook `App` uses to reach the client |
| `apps/sezzle-calculator/src/App.tsx`, `App.test.tsx` | wires the hook's function to `Calculator`'s `onRequest`; gains end-to-end tests (a mocked successful calculation, each of the four error presentations, the busy state) |
| `apps/sezzle-calculator/src/calculator/display.ts`, `display.test.ts` | `pending` now projects `Display`'s `state` as `busy`, not `idle` — the one line `p3-calculator-ui`'s spec reserved for this phase |
| `apps/sezzle-calculator/src/calculator/Calculator.test.tsx` | the two existing "pending is frozen" assertions now expect `busy`, not `idle` |
| `apps/sezzle-calculator/src/frontend-purity.test.ts` | the `fetch` scan gains one named exception — `src/api/client.ts` — the only file allowed to call it |
| `apps/sezzle-calculator/README.md`, `src/scope-docs.test.ts` | the README describes the client, the hook, the env var and the busy/error states instead of calling `=` a dead end; the docs test that pinned the old wording now pins the new |
| `AGENTS.md` (root; `CLAUDE.md` is a symlink to it) | the sentence saying the SPA "does not yet call the gateway... makes no network calls of its own" is corrected |

Not touched: `packages/contracts`, `packages/ui`, `apps/calc-service`, `apps/api-gateway`, the reducer (`reducer.ts`), the key model (`keys.ts`), the root `README.md`, `docs/PRD-P0.md`, `docs/spec-phases.md` (neither carries a per-phase "resolved" marker for FE-2/4/5/7 the way Open Question 5 does — nothing in either falls stale).

## Approach

**Chosen — one classifying client module, a thin hook, no client-side timeout.**

`src/api/client.ts` mirrors the shape `apps/api-gateway/src/calc-client.ts` already uses one layer down: resolve config purely from an `env`-like argument, `POST` the contract's request body, and reduce the reply to a value the caller already knows how to handle — here, `CalculationOutcome` (`CalculateResponse | ErrorResponse`) instead of the gateway's own three-way discriminated union, because `Calculator`'s `onRequest` boundary is already fixed to that shape and reshaping it is out of scope. `useCalculate.ts` is the whole hook: it builds one client from the resolved gateway URL and returns the function, so `App.tsx` is the only place that calls it and no component calls `fetch`. The React Compiler covers memoizing that construction; nothing here hand-writes `useMemo`.

Classification (§Error contract) reuses the two error codes the contract already exposes for exactly this: `SERVICE_UNAVAILABLE` for anything that makes the calculation backend unreachable — whether that is the gateway reporting calc-service down, or the gateway itself never answering — and `INTERNAL_ERROR`, the code `calc-service`'s own catch-all already uses, for a reply that matches none of the documented shapes. No new error code is invented and `packages/contracts` is not touched.

**No client-side timeout or retry.** The gateway already promises a reply within its own 3-second deadline (502/504); the frontend trusts that contract like every other declared contract in the system, rather than adding a second, undocumented deadline. A `fetch` that never settles and any retry are both out of scope — the four messages already tell the user to retry by pressing a key.

Alternatives weighed and why not:

- **A client-side abort timeout as a defensive guard against a hung gateway** — declined: adds a magic number and a fifth failure path nothing in the PRD asks for, over trusting the gateway's own documented 3s deadline.
- **A new `NETWORK_ERROR` or `UNKNOWN_ERROR` code in `@repo/contracts`** — would give each of the four presentations its own code, but touches a package Phase 1 already shipped and locked; the existing codes (`SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`) already mean exactly what the two remaining cases need, and the display renders only the message, never the code, so nothing is lost.
- **The gateway's raw outage message relayed unchanged** (`"calculation service is unreachable"` / `"...did not respond in time"`) — that wording targets a different audience (`p2-api-gateway`'s reviewer, over curl); FE-4 fixes the end-user copy as a direct quote, so the client rewrites the message rather than passing it through.
- **Splitting config resolution into its own module**, mirroring the gateway's four-module split — FE-7 asks for "one typed module", and a second file here would only split one job in two; `apps/api-gateway`'s split earns its keep across four concerns this client doesn't have (CORS, a retry policy, a proxied deadline).
- **`Calculator` calling the hook internally instead of receiving `onRequest` as a prop** — `p3-calculator-ui` locked the prop as the seam this phase plugs into without touching the reducer or its tests; keeping it a prop set from `App` preserves every existing stub-based `Calculator.test.tsx` case unchanged.

## Error contract

Four presentations, each a `CalculationOutcome` the client resolves with — never rejects with, matching the locked `onRequest` contract:

| Case | Trigger | `error.code` | Message |
| --- | --- | --- | --- |
| Domain error | 422 with `DIVISION_BY_ZERO`, `NEGATIVE_SQRT` or `RESULT_NOT_FINITE` | relayed unchanged | relayed unchanged — already fixed, non-technical wording in `@repo/contracts` |
| Backend outage | 502 or 504 with `SERVICE_UNAVAILABLE` (calc-service unreachable or timed out, behind the gateway) | `SERVICE_UNAVAILABLE` | "Calculations are temporarily unavailable — try again." (FE-4's own quote) |
| Network failure | `fetch` itself throws — the gateway is unreachable | `SERVICE_UNAVAILABLE` | "Can't reach the calculation service — try again." (UC-8's own quote) |
| Unexpected response | anything else — malformed JSON, an unrecognised status, a body failing the shared schemas (a stray 400 included, since FE-3 already keeps the UI from producing one) | `INTERNAL_ERROR` | "Something went wrong — try again." (decided in interview) |

A successful (200) reply that matches `calculateResponseSchema` resolves with `{ result }`, unchanged. Every classification decision runs the shared schemas from `@repo/contracts` (`calculateResponseSchema`, `errorResponseSchema`) — the client trusts nothing it did not itself validate, same as every other boundary in this system.

## Non-goals

Any local calculation, including a fallback when the backend is down. A client-side timeout or retry (decided above). Changing the reducer, the key model, or the display projection beyond the one `pending`/`busy` line this phase was always going to supply. New error codes or schema changes in `@repo/contracts`. The responsive pass and the accessibility audit (Phase 5). Keyboard shortcuts (P1, FE-9).

## Resolved decisions

| Decision | Why |
| --- | --- |
| Unexpected-response wording is "Something went wrong — try again." | short, matches the calm, non-technical tone FE-4 already sets for the other three messages, without naming an internal detail |
| No client-side timeout or retry | the gateway already promises 502/504 within 3s; a second, undocumented deadline is complexity nothing in the PRD asks for |
| Outage and network-failure share the `SERVICE_UNAVAILABLE` code, distinguished only by message | the display renders `message`, never `code`; a second code would touch a locked shared package for no observable gain |
| Unexpected response uses `INTERNAL_ERROR` | the same code `calc-service`'s own catch-all (`app.ts`'s `onError`) already uses for a reply matching nothing documented — no change to `@repo/contracts` needed |
| The client is one file, not split by concern | FE-7 asks for "one typed module"; splitting would divide one concern into two files rather than separate concerns into their own |
| `Calculator` keeps receiving `onRequest` as a prop, set once in `App` | preserves the seam `p3-calculator-ui` locked and keeps every existing stub-based test in `Calculator.test.tsx` unchanged |
| `display.ts`'s `pending` case now projects `busy` | the one line `p3-calculator-ui`'s own spec named as deferred here — "`Display`'s `state="busy"` is deferred to Phase 4 with the busy indicator it belongs to" |
