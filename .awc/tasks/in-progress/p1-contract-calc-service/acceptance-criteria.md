# Acceptance criteria — p1-contract-calc-service

Plain format. Each criterion is observable, is owned by exactly one subtask ([`tmp/subtasks.md`](tmp/subtasks.md)), and is stated without reference to how it is implemented. Context: [`spec.md`](spec.md). Ids are stable, so AC-17 onward sit in the slice they belong to rather than in numeric order.

## Slice 1 — the contract

**AC-1.** A well-formed request for any of the seven operations — `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, `percentage` — is accepted by the contract's request schema, with `sqrt` taking exactly one operand and every other operation exactly two. Accepted operands include zero, negatives and decimals.

**AC-2.** The schema rejects each malformed request with the exact message shown: an `operation` that is a string naming none of the seven → `unknown operation 'foo'`, quoting the received value verbatim; an `operation` that is absent, `null`, or not a string → `operation must be one of: add, subtract, multiply, divide, power, sqrt, percentage`; a wrong operand count, a missing `operands` field, a non-numeric operand, `NaN`, or `Infinity` → `operation '<op>' requires exactly <n> finite operands`, where `<n>` is that operation's real count and the noun is singular at 1 (`operation 'sqrt' requires exactly 1 finite operand`). A request wrong in both its operation and its operands gets the operation's message.

**AC-3.** The contract package is the single source of the operation names, the per-operation operand count, the success shape `{ "result": number }`, the error shape `{ "error": { "code": string, "message": string } }`, the five error codes (`VALIDATION_ERROR`, `DIVISION_BY_ZERO`, `NEGATIVE_SQRT`, `RESULT_NOT_FINITE`, `INTERNAL_ERROR`) and every error message string. No other workspace declares its own copy of any of them.

**AC-4.** `packages/contracts/README.md` states what the package holds, that it is consumed as source with no build step, and the one command that runs its tests.

**AC-5.** Nothing already in the repo regresses: `npm run lint`, `npm run check-types`, `npm run test` and `npm run build` all pass from the root with `packages/contracts` present, and the root `README.md` is unchanged. Neither `apps/sezzle-calculator` nor `packages/ui` gains a dependency on `@repo/contracts`, on the calculation service, or on any gateway.

## Slice 2 — the calculation domain

**AC-6.** Each of the seven operations returns the mathematically correct result for normal values, zero, negatives and decimals: `add(2, 3) = 5`, `subtract(2, 3) = -1`, `multiply(-2, 3.5) = -7`, `divide(7, 2) = 3.5`, `power(2, 10) = 1024`, `power(2, -2) = 0.25`, `sqrt(144) = 12`, `sqrt(0) = 0`, and `percentage(15, 200) = 30` — that is, `(x / 100) * y` (XC-3, UC-5).

**AC-7.** `divide` with a zero divisor fails as `DIVISION_BY_ZERO`, and `sqrt` of a negative number fails as `NEGATIVE_SQRT`. Neither reaches a result.

**AC-8.** An operation whose result is not a finite number fails as `RESULT_NOT_FINITE` — including overflow to `Infinity` (`power(10, 10000)`, `add(1e308, 1e308)`) and `NaN` (`power(-8, 0.5)`).

**AC-9.** The calculation code is exercisable with no HTTP present: its tests import no server, framework or HTTP module, and an operation is reached by looking its name up in the registry, so adding one means adding a module and a registry entry with no route change.

**AC-17.** AC-5's gate still holds once `apps/calc-service` joins the workspaces: `npm run lint`, `npm run check-types`, `npm run test` and `npm run build` pass from the root, and `npm run dev` fans out without invoking a script whose entry file does not exist.

**AC-18.** `apps/calc-service/README.md` states what the service is — internal, never browser-facing — and the one command that runs its tests.

## Slice 3 — the HTTP surface

**AC-10.** `POST /calculate` returns `200` with `{ "result": number }` for all seven operations, matching the values in AC-6.

**AC-11.** `POST /calculate` returns `400` with code `VALIDATION_ERROR` and AC-2's message for every malformed request, and `400` with `request body must be valid JSON` when the body is not valid JSON. No malformed input produces a 500, a crash, or an unhandled rejection, and the service stays up and answers the next request.

**AC-12.** `POST /calculate` returns `422` with the exact code and message for each domain failure: `DIVISION_BY_ZERO` / `cannot divide by zero`, `NEGATIVE_SQRT` / `cannot take the square root of a negative number`, `RESULT_NOT_FINITE` / `result is not a finite number`.

**AC-13.** An unexpected internal failure returns `500` with code `INTERNAL_ERROR` and message `internal error`. The body carries no stack trace, exception text, file path or other internal detail.

**AC-14.** Every error response — 400, 422 and 500 alike — has exactly the body `{ "error": { "code": string, "message": string } }`, and every success response exactly `{ "result": number }`, with no extra fields on either.

**AC-15.** The port is resolved from `CALC_SERVICE_PORT`; with that variable absent from the environment the resolved port is 3001. Changing the variable changes the resolved port with no code edit.

**AC-19.** The resolved port is the port the service actually binds: started with `CALC_SERVICE_PORT` set to a free port, the service answers `POST /calculate` on that port and on no other, and releases it when stopped.

**AC-16.** `apps/calc-service/README.md` — the one AC-18 started — also states the one command that starts the service, the `CALC_SERVICE_PORT` variable and its default, a worked `curl` example of `POST /calculate` with a success and an error response, and that `percentage(x, y)` is `x% of y` = `(x / 100) * y` (XC-3).
