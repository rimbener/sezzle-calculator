# subtask-4 — Hono app: `POST /api/v1/calculate`, validation, error mapping and CORS

- **slice:** 3 — the public surface
- **criteria:** AC-11, AC-12, AC-13, AC-14, AC-15, AC-21, AC-16, AC-17
- **status:** done
- **paths:** `apps/api-gateway/src/app.ts`, `apps/api-gateway/src/app.test.ts`, `apps/api-gateway/src/no-arithmetic.test.ts`

`createApp` takes the client as a dependency and exports a ready-made `app` beside it, as calc-service does, so tests drive it through `app.fetch` with no port bound.

The route does four things and nothing else: read the raw body and `JSON.parse` it by hand so invalid JSON is a 400 rather than a framework error; parse it with `calculateRequestSchema`; call the client; serialise the outcome — result → 200, domain error → 422 with the downstream's code and message, unavailable → 502 or 504 with the contract's matching message (AC-11, AC-14, AC-15). Validation happens before the call, so a 400 needs no downstream at all (AC-13). Local `fail` and `parseJson` helpers mirror calc-service's; the status for a 400 comes from the shared map, and 502/504 is the client's reason, per `spec.md` § Error contract. Every body is exactly the envelope or exactly `{ result }` (AC-16).

`hono/cors` is applied to the public route with the configured origin, allowing `POST` and the JSON content type so the preflight passes (AC-17). 404 keeps Hono's default — the envelope for it is P1.

Recovery is behaviour, not an absence of state, so `app.test.ts` proves it (AC-21, UC-7's postcondition and BE-6's acceptance): one app instance, a fake that refuses every attempt for two successive requests — each answered 502 — and then answers normally, after which the next request returns 200 with the fake's number. The app is not rebuilt and nothing is reset between the three. It is the counterpart of calc-service's "a later request is unaffected" case, and the one thing UC-7 asks a reviewer to check by hand.

`no-arithmetic.test.ts` is the structural half of AC-12, in the spirit of calc-service's `domain-purity.test.ts`: no module under `src/` imports calc-service code or any operation implementation. The behavioural half is in `app.test.ts` — a fake returning an implausible number for `add` produces exactly that number, and no operation yields a result while the fake fails.
