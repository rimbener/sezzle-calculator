# subtask-1 — `SERVICE_UNAVAILABLE`, response schemas and the shared status map

- **slice:** 1 — the shared contract
- **criteria:** AC-1, AC-2, AC-3, AC-4
- **status:** done
- **paths:** `packages/contracts/src/errors.ts`, `packages/contracts/src/messages.ts`, `packages/contracts/src/calculate.ts`, `packages/contracts/src/index.ts`, `packages/contracts/src/errors.test.ts`, `packages/contracts/src/calculate.test.ts`, `packages/contracts/src/index.test.ts`, `packages/contracts/README.md`, `apps/calc-service/src/app.ts`, `AGENTS.md`
- **refactor:** move `STATUS_BY_CODE` out of `apps/calc-service/src/app.ts` into `@repo/contracts` and import it back — preserves: every response calc-service returns today keeps its exact status, code and message

Everything the gateway needs from the contract, added where Phase 1 left off:

- **the code and its messages (AC-1)** — `SERVICE_UNAVAILABLE` joins `ERROR_CODES`; its two sentences are named constants beside `INVALID_JSON_MESSAGE`, because one code with two messages does not fit `ERROR_MESSAGES`' one-entry-per-code shape. `ERROR_MESSAGES` therefore excludes `SERVICE_UNAVAILABLE` as it already excludes `VALIDATION_ERROR`.
- **the response schemas (AC-2)** — `calculateResponseSchema` for `{ result }` (a finite number: `NaN` and `±Infinity` rejected, as the request schema already does) and `errorResponseSchema` for the envelope, its `code` constrained to the known set. These define "a recognisable answer" for the gateway, and Phase 4's SPA reads the same definition.
- **the status map (AC-3)** — `STATUS_BY_CODE` becomes a contract export giving each code its default status, `SERVICE_UNAVAILABLE` → 502. calc-service imports it instead of declaring it; its own `fail` and route code are untouched, so no response changes (the refactor entry above).
  Representation matters, because both obvious spellings fail: calc-service types it today as `Readonly<Record<ErrorCode, ContentfulStatusCode>>`, and carrying that `hono/utils/http-status` import along would put framework-shaped code in the framework-free contract package (`spec.md` § Approach refuses that), while widening the values to `number` breaks `c.json`'s literal-union parameter and fails `check-types`. So it is a plain object literal declared `as const satisfies Record<ErrorCode, number>`: `as const` keeps each status a literal type that still satisfies Hono's `ContentfulStatusCode` at calc-service's `c.json` call, and `satisfies` keeps the map exhaustive over `ErrorCode`. `@repo/contracts`' dependencies stay `zod` alone; nothing in `packages/contracts` imports `hono`.

`packages/contracts/README.md` gains the new exports in its description. `AGENTS.md` is updated for the two statements this slice falsifies: the `@repo/contracts` entry (§ Monorepo layout — six error codes now, plus the response schemas and the shared status map) and the `apps/calc-service` entry (its `app.ts` imports `STATUS_BY_CODE` instead of declaring it).

Tests cover AC-1 (the code and the two exact sentences), AC-2 (each schema accepts a valid body and rejects `NaN`, `Infinity`, a missing field, a wrong type, `null`, a non-object and an unknown code) and AC-3 (every code has a status, the statuses are the ones `spec.md` § Error contract lists, and it is the only such map). `index.test.ts`'s barrel assertion grows the new exports. AC-4 is the regression gate: calc-service's existing suite passes unchanged and the root tasks stay green.
