# Phase 1 — the shared contract and a calculation service that stands on its own

**As a** reviewer evaluating this codebase (a Sezzle engineer who reads the code, runs the suites, and calls the service directly)
**I want** the calculator's request/response contract defined once in a shared workspace package, and a calculation service that owns all seven operations behind that contract and runs, answers and tests entirely on its own
**so that** every later layer — the gateway, then the SPA — is built against one agreed contract instead of its own copy, and the assessment's hard requirement (no arithmetic outside the calculation service) is demonstrably met from the first slice.

## Context

Covers `XC-1`, `XC-3`, `BE-4`, `BE-5`, `BE-8`, and the calc-service half of `BE-1`, `BE-3`, `BE-9`, `BE-11` — Phase 1 of `docs/PRD-P0.md` §11.

The repo today contains only `apps/sezzle-calculator` (Vite 8 + React 19 SPA) and `packages/{ui,eslint-config,typescript-config}`, wired as npm workspaces under Turborepo. No backend service and no contract package exist. Vitest is already the repo's test runner and is settled as the project's choice (PRD §10, Q4).

This slice touches two surfaces, both new: a shared contract package and a calculation service. The API gateway and the frontend are explicitly out of scope — the gateway is Phase 2, frontend consumption of the contract is Phase 3 — so in this slice the contract package has exactly one consumer, and that is expected rather than a shortfall of XC-1.

Two points the PRD left open, and the human's calls on them:

- **Documentation.** XC-3 requires the percentage formula to be stated in docs, and BE-1/BE-11 require documented commands, but the README itself is XC-2 and not in this slice. The call: package-local docs only. Each new package carries a short README with the formula and its run/test commands; the root README (still Turborepo starter text) stays untouched and the architecture write-up remains XC-2's job.
- **Unexpected failures.** BE-5 requires the error envelope on 500 responses, but PRD §9's code list names none for an internal failure. The call: introduce `INTERNAL_ERROR`, returned as a 500 in the standard envelope with a generic message and no internal detail, and add it to the shared error-code set so the gateway can carry it later.

No collision with a stated non-goal: the seven operations, the two-service decomposition and IEEE-754 doubles are all as the PRD fixes them.

## Acceptance criteria

- The contract — operation names, request and response shapes, the error envelope, and the error codes — is defined in one shared workspace package, and the calculation service imports it rather than restating any part of it.
- The calculation service starts on its own and answers `POST /calculate` with `200 { "result": number }` for all seven operations: add, subtract, multiply, divide, power, sqrt, percentage. `sqrt` takes one operand; every other operation takes two.
- `percentage(x, y)` returns `(x / 100) * y`; `15, 200` returns `30` (UC-5).
- Malformed input returns `400` with code `VALIDATION_ERROR` and never a 500, a crash, or a stack trace: unknown operation, missing fields, non-numeric operands, wrong operand count, `NaN`, `Infinity`, and syntactically invalid JSON.
- Valid input whose maths is impossible returns `422` with the exact code: divide by zero → `DIVISION_BY_ZERO`; square root of a negative → `NEGATIVE_SQRT`; a result that is `Infinity` or `NaN` (e.g. `10 ^ 10000`, `(-8) ^ 0.5`) → `RESULT_NOT_FINITE`.
- An unexpected internal failure returns `500` with code `INTERNAL_ERROR` and a generic message; no internal detail or stack trace reaches the response.
- Every error response — 400, 422 and 500 alike — has the body `{ "error": { "code": string, "message": string } }`.
- The calculation code is reachable and testable without touching HTTP: its tests import no HTTP or server code, and adding an operation means registering it, not editing a route.
- The service's port comes from an environment variable; with no environment set it listens on 3001, and setting the variable moves it with no code change.
- The service's own test suite runs with one documented command and covers every operation across normal values, zero, negatives and decimals; every domain error; and the status code of each route outcome.
- The calculation service and the contract package each carry a README stating what it is, how to run it, and how to test it; the calc-service README states the percentage formula.
- What must not regress: the existing SPA and `@repo/ui` still build, lint, type-check and test; the root README is unchanged; nothing in this slice adds a gateway or a frontend dependency on the calculation service.

## Notes

- The human settled documentation scope (package-local READMEs, root README untouched) and the unexpected-failure behaviour (`500 INTERNAL_ERROR`, generic message, code added to the shared set). Neither needs re-asking.
- Settled upstream by the PRD, not open for this slice: Vitest as the test runner (§10 Q4); 422 for valid-but-impossible maths versus 400 for malformed (§10 Q3); the percentage definition (§10 Q2); two services and no further split (§10 Q1, §3); IEEE-754 doubles with display rounding accepted as a documented limitation (§3).
- The internal route is deliberately unversioned — `POST /calculate`, not `/api/v1/calculate`. The gateway is the compatibility boundary (§9, versioning note).
- Calc-service needs no CORS: it is never browser-facing (BE-10).
- Naming, file layout, package names, and the wording of error messages are the spec step's business, not decided here.
