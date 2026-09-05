# Story interview — p1-contract-calc-service

Source (inline): `XC-1, XC-3, BE-4, BE-5, BE-8 + calc-service half of BE-1, BE-3, BE-9, BE-11: shared contract package and calc-service` — requirement ids refer to sections of `docs/PRD-P0.md`.

## From the source
### Settled
- who — the Reviewer (PRD §5, primary persona): a Sezzle engineer who reads the code, runs the suites, and calls the service directly; the End user is served only indirectly, since calc-service is internal and never called by the browser (PRD §4).
- what — one shared workspace contract package (types, Zod schemas, error codes — XC-1) plus a runnable `calc-service` owning all seven operations as pure functions behind an operation registry, with routes that only parse/call/serialize (BE-8), its own Zod validation (BE-3), its own port and scripts (BE-1), env-var config (BE-9) and its own unit tests (BE-11).
- why — Phase 1 of PRD §11: it is the foundation the gateway (Phase 2) and the frontend (Phase 3) both build on; defining the contract once removes duplicated schemas (XC-1) and putting all arithmetic behind a service boundary is the assessment's hard requirement (PRD §2 goals 2 and 3).
- when/where — PRD §11 Phase 1, first slice; the repo today holds only `apps/sezzle-calculator` (Vite + React 19 SPA) and `packages/{ui,eslint-config,typescript-config}`. No backend service and no contract package exist yet.
- surface (coarse) — a new shared workspace package and a new `calc-service` app in the npm-workspaces/Turborepo monorepo. The gateway and the frontend are out of scope for this slice.
- success — PRD acceptance clauses: calc-service starts and tests on its own (BE-1); `POST /calculate` answers all seven operations with `{ "result": number }` (§9); percentage is `(x / 100) * y` (XC-3, UC-5); calculation modules import no HTTP code (BE-8); env vars change the port with a working `3001` default (BE-9); every operation and every domain error is unit tested plus route tests for status codes (BE-11). Test tooling is settled as Vitest (PRD §10 Q4), already the repo's convention.
- edges — malformed input (wrong types, missing fields, wrong operand count, `NaN`/`Infinity`, invalid JSON) → `400 VALIDATION_ERROR`, never a 500 or a crash (BE-3, UC-6); valid-but-impossible math → `422` with `DIVISION_BY_ZERO`, `NEGATIVE_SQRT` or `RESULT_NOT_FINITE` (BE-4, UC-2/UC-3/UC-4); every error uses the envelope `{ "error": { "code": string, "message": string } }` (BE-5). Operand counts: 1 for `sqrt`, 2 otherwise.

### Open
- ~~success — does this slice also produce the documentation half of XC-3 (the percentage formula stated in docs) and the documented run/test commands BE-11 and BE-1 imply, or is all prose deferred to the XC-2 README task?~~ (settled by entry 1)
- ~~edges — BE-5 requires the envelope on 500 responses, but PRD §9's code list names no code for an unexpected internal failure; what should calc-service return when a request is valid and the math is fine but something else throws?~~ (settled by entry 2)

## 1 — success
Q: Does this slice also deliver written documentation — the XC-3 percentage formula stated in docs, and the documented one-line commands to run and test calc-service — or is all prose deferred to the XC-2 README task, leaving this slice's "done" purely code + passing tests?
A: Package-local docs only — calc-service and the contract package each get a short README: the percentage formula (XC-3) plus the run and test commands (BE-1, BE-11). The root README stays untouched, and the full architecture write-up remains XC-2's job.

## 2 — edges
Q: BE-5 says 500 responses must use the `{ error: { code, message } }` envelope, but PRD §9 never names a code for an unexpected internal failure (its list is VALIDATION_ERROR, DIVISION_BY_ZERO, NEGATIVE_SQRT, RESULT_NOT_FINITE, SERVICE_UNAVAILABLE). When a calc-service request is well-formed and the math is fine but something else throws, what should the caller observe?
A: Add INTERNAL_ERROR — a catch-all handler returns 500 with code INTERNAL_ERROR and a generic message, no stack traces, no internal detail (UC-6 postcondition). The code joins the shared package's error-code set, so the gateway can pass it through later.
