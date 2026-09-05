# PRD — Sezzle Calculator (P0 — Must-Have)

**Author:** Hernán Laura
**Date:** 2026-09-05
**Scope:** Everything required to ship. Nice-to-have (P1) and future (P2) items are in [PRD-P1.md](PRD-P1.md).

---

## 1. Problem Statement

This project is a coding assessment for Sezzle. The deliverable is a calculator web application: a React SPA that sends all arithmetic to a backend built as microservices — a public API gateway and an internal calculation service.

The goal is to demonstrate production-quality engineering at small scale: clean API design, clear service boundaries, input validation, error handling, tests, and a UI that handles failures well.

## 2. Goals

1. **Correctness:** All seven operations return correct results, with defined behavior for every edge case (division by zero, square root of a negative number, invalid input).
2. **Microservices (hard requirement):** Two independently runnable services — a public API gateway and an internal calculation service — each with its own tests. The SPA talks only to the gateway.
3. **Separation of concerns:** No arithmetic in the frontend or the gateway. In the calculation service, calculation logic is separate from HTTP code and testable on its own.
4. **Robustness:** No input can crash the app. Invalid input returns a clear message in the UI and a structured JSON error from the API — including when the calculation service is down.
5. **Test coverage:** Unit tests for all operations and edge cases (calc-service), for validation, proxying, and error translation (gateway), and for input, results, and errors (frontend).
6. **Usability:** A first-time user can perform any operation without instructions, on desktop or mobile (≥360px wide).
7. **Accessibility:** The UI meets WCAG 2.2 level AA.

## 3. Non-Goals

| Non-goal | Reason |
|---|---|
| Expression parsing (`2 + 3 * 4`, parentheses, precedence) | The assessment asks for single operations. A parser adds complexity without adding signal. Possible later (P2). |
| Splitting the calculation service further | Two services already demonstrate the pattern: network boundary, independent lifecycle, failure isolation. More services add work without benefit. |
| Kubernetes / container orchestration / service mesh | Separate processes on separate ports are enough. An optional `docker-compose.yml` is the maximum. |
| Service discovery / message brokers | Env-var URLs and synchronous HTTP are enough at this scale. |
| Authentication / user accounts | Not required. |
| Persistence (database, saved history) | Stateless services are enough. In-memory history is P1 at most. |
| More operations than the listed seven | Fixed scope. The design should make adding one easy (P2). |
| Deployment / hosting / CI-CD | Running locally with documented commands is the deliverable. |
| Arbitrary-precision arithmetic | IEEE-754 doubles with display rounding are acceptable. Documented as a limitation. |

## 4. Architecture

```
        ┌────────────────────────────┐
        │  React SPA (Vite + TS)     │
        │  talks ONLY to the gateway │
        └─────────────┬──────────────┘
                      │ HTTP (JSON)
        ┌─────────────▼──────────────┐
        │  api-gateway (Hono + Zod)  │  :3000
        │  validation, proxying,     │
        │  error envelope, CORS      │
        └─────────────┬──────────────┘
                      │ HTTP (internal)
        ┌─────────────▼──────────────┐
        │  calc-service (Hono + Zod) │  :3001
        │  add, subtract, multiply,  │
        │  divide, power, sqrt,      │
        │  percentage                │
        └────────────────────────────┘
```

- **api-gateway** — the only public service. Validates input with Zod, forwards valid requests to calc-service, converts downstream failures into the shared error format, handles CORS. Contains no arithmetic.
- **calc-service** — internal service that owns all seven operations, implemented as pure functions behind an operation registry. Never called by the browser.
- Each service has its own Hono app, port, and tests. Both are stateless and configured by env vars. Shared types and Zod schemas live in one shared workspace package.

## 5. Users

- **End user** — uses the calculator UI.
- **Reviewer (primary)** — a Sezzle engineer who reads the code, runs the tests, and uses the app to evaluate structure, clarity, and edge-case handling.

## 6. User Stories

### End user

- **US-1:** As a user, I want to add, subtract, multiply, and divide two numbers.
- **US-2:** As a user, I want to raise a number to a power.
- **US-3:** As a user, I want to take the square root of a number.
- **US-4:** As a user, I want to calculate a percentage (X% of Y).
- **US-5:** As a user, I want a clear error message when input is invalid (division by zero, square root of a negative, non-numeric input), so I can correct it.
- **US-6:** As a user, I want to clear the input and start over.
- **US-7:** As a mobile user, I want to use the calculator on a small screen.

### Reviewer

- **US-10:** As a reviewer, I want to run everything (services, frontend, tests) with documented one-line commands.
- **US-11:** As a reviewer, I want to call the gateway with curl and get structured JSON for success and error cases.
- **US-12:** As a reviewer, I want to stop calc-service and see the gateway and UI fail gracefully.

## 7. Requirements

### 7.1 Backend (Hono + Zod + TypeScript)

- **BE-1 — Two services (hard requirement).** `api-gateway` (public) and `calc-service` (internal, owns all seven operations). Each is a separate app in the monorepo with its own entry point, port, scripts, and tests. They communicate only over HTTP; neither imports the other's code.
  - *Acceptance:* each service starts and tests on its own; the gateway starts and answers (e.g. validation errors) even when calc-service is down.
- **BE-2 — Public API through the gateway only.** The SPA calls only `POST /api/v1/calculate` on the gateway, with body `{ "operation": "add"|"subtract"|"multiply"|"divide"|"power"|"sqrt"|"percentage", "operands": number[] }`. The gateway forwards valid requests to calc-service.
  - *Acceptance:* all 7 operations return HTTP 200 with `{ "result": number }` through the gateway; the frontend contains no calc-service URL.
- **BE-3 — Zod validation in both services.** The gateway validates every request: known operation, finite numbers, correct count (2 operands; 1 for sqrt). Calc-service validates its own input too — a service does not trust its caller. Shared Zod schemas (XC-1) avoid duplication.
  - *Acceptance:* wrong types, missing fields, wrong operand count, `NaN`/`Infinity`, and invalid JSON return HTTP 400 with a structured error — never a 500 or a crash. The same applies when calling calc-service directly.
- **BE-4 — Domain edge cases.** Valid requests with impossible math return HTTP 422 from calc-service with a specific code, passed through by the gateway:
  - `divide` by 0 → `DIVISION_BY_ZERO`
  - `sqrt` of a negative → `NEGATIVE_SQRT`
  - Non-finite result: overflow to `Infinity`, or `NaN` (e.g. `(-8) ^ 0.5`) → `RESULT_NOT_FINITE`
  - *Acceptance:* each case returns 422 with the exact code, through the gateway and directly; all covered by unit tests.
- **BE-5 — One error format.** Both services return errors as `{ "error": { "code": string, "message": string } }`, defined in the shared package.
  - *Acceptance:* 400, 422, 500, 502, and 504 responses all use this format. (404 format is P1 — BE-19 in [PRD-P1.md](PRD-P1.md).)
- **BE-6 — Downstream failure handling.** If calc-service is unreachable or does not answer within **3 seconds** (default), the gateway returns `502` (unreachable) or `504` (timeout) with code `SERVICE_UNAVAILABLE` — never a hung request or a raw fetch error.
  - *Acceptance:* with calc-service stopped, any operation returns 502 and the gateway stays up; a hung downstream returns 504 within ~3s.
- **BE-8 — Layers inside each service.** In calc-service, calculation functions are pure modules with no HTTP imports, behind an operation registry; routes only parse, call, and serialize. The gateway contains no calculator logic.
  - *Acceptance:* calculation tests import no HTTP code; code review finds no operation logic in the gateway.
- **BE-9 — Configuration by env vars.** Ports and the calc-service URL come from env vars with dev defaults (gateway :3000, calc-service :3001). No hardcoded cross-service URLs.
  - *Acceptance:* env vars change ports/URL without code changes; defaults work with no env set.
- **BE-10 — CORS.** The gateway allows the frontend dev origin. Calc-service needs no CORS (not browser-facing).
  - *Acceptance:* browser calls from the Vite dev origin work.
- **BE-11 — Unit tests per service.** Calc-service: every operation (normal cases, zero, negatives, decimals) and every domain error, plus route tests for status codes. Gateway: validation failures, proxying (downstream mocked), 422 pass-through, and 502/504 mapping.
  - *Acceptance:* each suite passes with one documented command; all listed cases exist.

*(BE-7 — health endpoints — is P1; see [PRD-P1.md](PRD-P1.md).)*

### 7.2 Frontend (React + Vite + TypeScript + vanilla CSS)

- **FE-1 — Calculator UI.** Digit pad (0–9, decimal point, sign toggle), buttons for all 7 operations, equals, clear, and a display for input and result.
  - *Acceptance:* all controls work; every operation is reachable from the UI.
- **FE-2 — All math through the API.** Pressing equals (or sqrt, which is unary and fires immediately) calls the gateway. The frontend never calculates locally and never calls calc-service.
  - *Acceptance:* with the gateway stopped, no operation returns a result; the UI shows a connection error.
- **FE-3 — Input validation.** The UI blocks bad input at entry: one decimal point per operand; maximum 15 significant digits; equals does nothing while input is invalid. Detailed editing rules (leading zeros, sign toggle, operator replacement) are decided during implementation (Open Question 5).
  - *Acceptance:* a second decimal point is ignored; digits stop at the cap; equals is inactive on invalid input.
- **FE-4 — Error handling.** Each error type shows a clear, non-technical message: domain errors (division by zero, negative sqrt), backend outage ("Calculations are temporarily unavailable — try again"), network failure, unexpected response. Never a blank screen, frozen state, or raw exception. Errors clear on the next valid input.
  - *Acceptance:* each error type shows its own message; the app stays usable after every error.
- **FE-5 — Loading state.** A pending call shows a busy indicator and blocks duplicate submissions.
  - *Acceptance:* pressing equals again during a pending call sends no extra request.
- **FE-6 — Responsive layout.** Works from 360px width: touch targets ≥44px, no horizontal scroll, vanilla CSS only.
  - *Acceptance:* at 360px there is no horizontal scroll and targets are ≥44px.
- **FE-7 — One API client module.** All fetch logic lives in one typed module using the shared contract types; components use it through a hook.
  - *Acceptance:* components contain no fetch calls; only the client module references the gateway URL.
- **FE-8 — Unit tests.** Rendering, input building the expected state, a successful calculation (API mocked), each error presentation, and clear/reset.
  - *Acceptance:* suite passes with one documented command; all listed cases exist.
- **FE-12 — Accessibility (WCAG 2.2 level AA).**
  - Semantic HTML first; ARIA only where no native element covers the need.
  - Text contrast ratio of at least 4.5:1.
  - Landmarks structure the page (`<nav>`, `<main>`, `<aside>` as applicable); every form control has a label; every image has `alt` text.
  - All controls are native `<button>`/`<input>` elements, so they are focusable and keyboard-operable by default. (Typed shortcuts like digits and operators stay P1 — FE-9 in [PRD-P1.md](PRD-P1.md).)
  - *Acceptance:* an automated audit (axe or Lighthouse) reports no WCAG AA violations; every control is reachable and operable with the keyboard alone; contrast checks pass on all text.

### 7.3 Cross-cutting

- **XC-1 — Shared contract package.** Types, error codes, and Zod schemas defined once in a workspace package used by all three apps.
  - *Acceptance:* all apps import from the shared package; no duplicated schemas.
- **XC-2 — README.** Prerequisites (Node version pinned via `.nvmrc` and `engines`), install, run, and test commands; architecture diagram; API documentation with examples; assumptions and trade-offs (why sync HTTP, static config, one calc service).
  - *Acceptance:* a reviewer can install, run, and test using only the README (UC-11).
- **XC-3 — Percentage definition.** `percentage(x, y)` = x% of y = `(x / 100) * y`. Stated in README and API docs.
  - *Acceptance:* docs state the formula; behavior matches UC-5.

## 8. Use Cases

*(UC-9 — health monitoring — is P1; see [PRD-P1.md](PRD-P1.md).)*

### UC-1: Binary operation (add / subtract / multiply / divide)

- **Precondition:** Both services and the SPA running.
- **Main flow:**
  1. User enters the first operand.
  2. User selects an operation (e.g. `+`).
  3. User enters the second operand.
  4. User presses `=`.
  5. Frontend sends `POST /api/v1/calculate` with `{ operation, operands: [a, b] }` to the gateway.
  6. Gateway validates, forwards to calc-service, returns `200 { result }`.
  7. UI shows the result; the result becomes the first operand for the next operation.
- **Alternates:**
  - **A1 — Chaining:** pressing an operator after a result uses the result as the first operand.
  - **A2 — Clear:** pressing `C` resets the entry without an API call.
- **Note:** finer input-editing flows are decided during implementation (Open Question 5).

### UC-2: Division by zero

- **Flow:** `8 ÷ 0 =` → calc-service returns `422 DIVISION_BY_ZERO` → gateway passes it through → UI shows "Cannot divide by zero"; input is kept so the user can change the divisor.
- **Postcondition:** No crash; the next digit press clears the error.

### UC-3: Exponentiation

- **Flow:** `2`, `xʸ`, `10`, `=` → `{ operation: "power", operands: [2, 10] }` → UI shows `1024`.
- **Alternates:**
  - **A1 — Non-finite result:** `10 ^ 10000` (overflow) or `(-8) ^ 0.5` (NaN) → `422 RESULT_NOT_FINITE` → UI shows "Result is undefined or too large".
  - **A2 — Fractional/negative exponents** are valid: `2 ^ -2 = 0.25`, `9 ^ 0.5 = 3`.

### UC-4: Square root (unary)

- **Flow:** `144`, `√` → fires immediately (no `=`) with `{ operation: "sqrt", operands: [144] }` → UI shows `12`.
- **Alternate:** `√(-4)` → `422 NEGATIVE_SQRT` → UI shows "Cannot take the square root of a negative number".

### UC-5: Percentage

- **Flow:** `15`, `%`, `200`, `=` → `{ operation: "percentage", operands: [15, 200] }` → `(15 / 100) × 200 = 30` → UI shows `30`.
- **Note:** definition per XC-3, also shown in the UI (tooltip/label) and README.

### UC-6: Invalid request (API level)

- **Actor:** Reviewer (curl) or a buggy client.
- **Flow:** unknown operation, wrong operand count, non-numeric operands, or invalid JSON → `400` with the error format, e.g. `{ error: { code: "VALIDATION_ERROR", message: "operation 'add' requires exactly 2 finite operands" } }` (message uses the operation's real count — 1 for sqrt). Rejected at the gateway; no downstream call.
- **Alternate:** the same bad payload sent directly to calc-service returns the same 400 (BE-3).
- **Postcondition:** No 500s, no stack traces in responses.

### UC-7: Calc-service down

- **Precondition:** calc-service stopped; gateway running.
- **Flow:** any operation → gateway returns `502 SERVICE_UNAVAILABLE` within the 3s timeout → UI shows "Calculations are temporarily unavailable — try again" and keeps the input.
- **Postcondition:** Gateway stays up (validation errors still return 400). Restarting calc-service restores service without restarting anything else.

### UC-8: Gateway down

- **Flow:** `=` → fetch fails → UI shows "Can't reach the calculation service — try again" and keeps the input.

### UC-10: Mobile usage

- **Flow:** on a 360–430px viewport, all buttons are visible and tappable, no horizontal scroll, long numbers shrink or truncate. UC-1…UC-5 work the same.

### UC-11: Reviewer evaluation

- **Flow:** clone → follow README → install → start both services and the frontend → run all test suites (green) → exercise UC-1…UC-8 via UI and curl, including stopping calc-service (UC-7).
- **Acceptance:** setup to full verification in under 10 minutes, no undocumented steps.

## 9. API Contract

*(Health endpoints are P1; see [PRD-P1.md](PRD-P1.md).)*

### Public — api-gateway (:3000)

```
POST /api/v1/calculate
Content-Type: application/json

Request:  { "operation": "add"|"subtract"|"multiply"|"divide"|"power"|"sqrt"|"percentage",
            "operands": number[] }   // length 1 for sqrt, 2 otherwise

200: { "result": number }
400: { "error": { "code": "VALIDATION_ERROR", "message": string } }
422: { "error": { "code": "DIVISION_BY_ZERO" | "NEGATIVE_SQRT" | "RESULT_NOT_FINITE", "message": string } }
502: { "error": { "code": "SERVICE_UNAVAILABLE", "message": string } }   // calc-service unreachable
504: { "error": { "code": "SERVICE_UNAVAILABLE", "message": string } }   // calc-service timeout (3s default)
```

### Internal — calc-service (:3001)

```
POST /calculate        // same body shape; all 7 operations
200 / 400 / 422 as above
```

**Versioning note:** the public surface is versioned (`/api/v1/*`); internal routes are not. The gateway is the compatibility boundary, and both sides of the internal contract live in the same repo.

## 10. Open Questions

1. **(Resolved)** Decomposition: gateway + one calc-service. Shows the microservice pattern with minimum overhead; further splits are P2 (BE-17 in [PRD-P1.md](PRD-P1.md)).
2. **(Resolved)** Percentage: "x% of y" (XC-3).
3. **(Resolved)** Domain errors use 422 (valid shape, impossible math) vs 400 (malformed); 502/504 for downstream failures.
4. **(Resolved)** Test tooling: Vitest everywhere; React Testing Library on the frontend.
5. **(Deferred to implementation — non-blocking)** Calculator input state machine: operator pressed mid-entry, digit pressed after a result, operator replacement, recovery after an error, leading zeros, sign toggle. Decided while building FE-1/FE-3; documented by FE-8's tests.

## 11. Phasing

No external deadline. Suggested order; each phase leaves the repo working and testable:

1. **Phase 1 — Contract & calc-service:** shared package (types, schemas, error codes); calc-service with pure calculation modules, operation registry, routes, validation, unit tests.
2. **Phase 2 — Gateway:** validation, proxy with 3s timeout, 422 pass-through, 502/504 mapping, CORS, tests with mocked downstream.
3. **Phase 3 — Frontend:** API client from shared types, calculator state hook (settles Open Question 5), UI components, all 7 operations, error and loading states.
4. **Phase 4 — Polish:** frontend tests, responsive pass, accessibility audit (FE-12), README with diagram and API docs.

Phase 5 (optional P1 work) is defined in [PRD-P1.md](PRD-P1.md).
