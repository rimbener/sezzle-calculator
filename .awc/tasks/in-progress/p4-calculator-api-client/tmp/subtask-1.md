# subtask-1 — The gateway API client module

- **slice:** 1 — the gateway API client module
- **criteria:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- **status:** todo
- **paths:** `apps/sezzle-calculator/src/api/client.ts`, `apps/sezzle-calculator/src/api/client.test.ts`, `apps/sezzle-calculator/src/frontend-purity.test.ts`

FE-7's "one typed module": config resolution, the `fetch` call and classification, together in one file — no split by concern (`spec.md`, "Approach"). Modeled on `apps/api-gateway/src/calc-client.ts`'s shape one layer up: a factory taking the gateway URL and an injectable `fetch`-shaped function, returning `(request: CalculateRequest) => Promise<CalculationOutcome>` (`CalculationOutcome` from `../calculator/state`) that never rejects.

The gateway URL resolves purely from an `env`-like argument, defaulting to `http://localhost:3000` — the pattern `apps/api-gateway/src/config.ts` and `apps/calc-service/src/config.ts` already use. Pick an env var name in that family (e.g. `VITE_GATEWAY_URL`; Vite only exposes `VITE_`-prefixed variables to client code) and export the variable name and default alongside the resolver so tests and any future doc share one source.

Classification runs the reply through `@repo/contracts`' own `calculateResponseSchema` and `errorResponseSchema` — trust nothing unvalidated — and reduces it to exactly the four cases `spec.md`'s "Error contract" table names: a 200 matching the response schema is a result; a 422 with a domain code is relayed unchanged; a 502/504 with `SERVICE_UNAVAILABLE` becomes the outage message; anything else, including a thrown `fetch`, becomes the network-failure or unexpected-response message per the table. A thrown `fetch` is caught inside the client, never left to reject the returned promise.

Tests inject a fake `fetch` (no real network, no port) and drive every row of the error-contract table, plus the env var's default and override (AC-6). `frontend-purity.test.ts` gains its second named exception — `api/client.ts` — the only file its `fetch` scan now allows (AC-7); it already has one such exception for `Number(` in `reducer.ts`, so follow that pattern rather than loosening the scan generally.
