# subtask-4 — Hono app: `POST /calculate`, validation and error mapping

- **slice:** 3 — the HTTP surface
- **criteria:** AC-10, AC-11, AC-12, AC-13, AC-14
- **status:** done
- **paths:** `apps/calc-service/src/app.ts`, `apps/calc-service/src/app.test.ts`

The Hono app, exported separately from the server entry so tests drive it through `app.fetch` with no port bound.

`POST /calculate` does three things and nothing else: parse the body with the contract's schema, call `calculate`, serialise the result (AC-10). A body that is not valid JSON, and a body the schema rejects, both become `400 VALIDATION_ERROR` with the contract's exact sentence (AC-11). A `CalculationError` becomes `422` with its own code and sentence (AC-12). Anything else becomes `500 INTERNAL_ERROR` with the generic message and nothing of the underlying failure (AC-13). Every body on every path is exactly the contract's success or error shape, with no extra fields (AC-14).

The status-per-code mapping lives in one place, so a new error code is one table entry.

Route tests cover all seven operations at 200, each malformed-input case and invalid JSON at 400, each domain failure at 422, an induced unexpected failure at 500, and the exact body shape on each — plus that the app answers a normal request after a malformed one (AC-11).
