# Acceptance criteria — p2-api-gateway

Plain format. Each criterion is observable, is owned by exactly one subtask ([`tmp/subtasks.md`](tmp/subtasks.md)), and says nothing about how it is implemented. Context: [`spec.md`](spec.md).

## Slice 1 — the shared contract

**AC-1.** `@repo/contracts` is the single source of `SERVICE_UNAVAILABLE` and its two message strings — `calculation service is unreachable` and `calculation service did not respond in time` — alongside the five codes Phase 1 shipped. No workspace declares its own copy of a code, a message or a status.

**AC-2.** The contract parses a downstream reply rather than trusting it: a body is a valid result only when it is `{ "result": <finite number> }`, and a valid error envelope only when it is `{ "error": { "code": <one of the known codes>, "message": <string> } }`. `NaN`, `Infinity`, a missing field, a wrong type, a null body, an unknown code and a non-object body are rejected. An unrecognised key is not a rejection: `{ "result": 5, "junk": 1 }` parses as a valid result of `5` and the extra key is dropped, and an envelope carrying a third field parses the same way.

**AC-3.** The contract exposes each error code's default HTTP status — `VALIDATION_ERROR` 400, `DIVISION_BY_ZERO` / `NEGATIVE_SQRT` / `RESULT_NOT_FINITE` 422, `INTERNAL_ERROR` 500, `SERVICE_UNAVAILABLE` 502 — as one exported map, the only such map in the repo.

**AC-4.** Nothing regresses: `POST /calculate` on calc-service returns exactly the status, code and message for every case it does today; `npm run lint`, `npm run check-types`, `npm run test` and `npm run build` pass from the root; the root `README.md` stays unchanged; neither `apps/sezzle-calculator` nor `packages/ui` gains a dependency on the contract, on calc-service or on the gateway.

## Slice 2 — configuration and the calc-service client

**AC-5.** All four settings resolve from the environment, and with none of them set the resolved values are port `3000`, calc-service URL `http://localhost:3001`, timeout `3000` ms and allowed origin `http://localhost:5173`. Setting each variable changes its resolved value with no code edit.

**AC-6.** For a valid request the client sends one `POST` to `<calc-service URL>/calculate` with a JSON content type and exactly `{ "operation": <name>, "operands": [...] }` — the validated request, with any extra field the caller sent dropped. A trailing slash on the configured URL does not change the path called.

**AC-7.** A downstream `200` whose body is a valid result yields that number; a downstream `422` whose body is a valid envelope carrying `DIVISION_BY_ZERO`, `NEGATIVE_SQRT` or `RESULT_NOT_FINITE` yields that same code and message. Neither is altered, rounded or re-computed.

**AC-8.** Any other downstream answer is reported as unreachable: a `500`, a `400`, a `503`, a `200` whose body is not a valid result, a `422` whose body is not a valid envelope or carries an unknown code, and a body that is not JSON.

**AC-9.** A connection-level failure is retried exactly once, after a pause of about 100 ms: a refused first attempt followed by a second that succeeds yields the result, and two refused attempts are reported as unreachable. At most two attempts are made — never three. If the deadline expires after an attempt has already been refused — during the pause or during the second attempt — the answer is unreachable, not timed out.

**AC-10.** A downstream that never answers, and whose connection was never refused, is reported as timed out rather than unreachable once the configured deadline elapses; it is never retried. The deadline covers the whole call, retry included, so no call takes materially longer than the configured timeout.

## Slice 3 — the public HTTP surface

**AC-11.** `POST /api/v1/calculate` returns `200` with `{ "result": number }` for all seven operations — `add`, `subtract`, `multiply`, `divide`, `power`, `sqrt`, `percentage` — with `sqrt` taking one operand and the rest two.

**AC-12.** The gateway computes nothing: the number in a success response is exactly the number the downstream returned, including an implausible one, and with the downstream failing no request yields a result. No module of the service implements or imports an arithmetic operation or calc-service code.

**AC-13.** A malformed request returns `400` with code `VALIDATION_ERROR` and the contract's message — unknown operation, absent or non-string operation, wrong operand count, missing `operands`, a non-numeric operand, `NaN`, `Infinity` — and `request body must be valid JSON` when the body is not JSON. No downstream call is made for any of them, and each still returns its 400 with calc-service unreachable.

**AC-14.** A downstream domain failure reaches the caller as `422` with the same code and message the downstream sent.

**AC-15.** A downstream that is unreachable, that answers outside the contract, or that is never reached returns `502` with code `SERVICE_UNAVAILABLE` and message `calculation service is unreachable`; one that does not answer within the deadline returns `504` with the same code and message `calculation service did not respond in time`. No request hangs, and no raw fetch, socket or exception text reaches the caller.

**AC-21.** The gateway survives a downstream outage and recovers without help: after consecutive valid requests answered `502` because every attempt was refused, the next valid request returns `200` with the downstream's result as soon as the downstream answers again — the gateway is not restarted, no failure is cached, and nothing keeps failing because of the earlier ones.

**AC-16.** Every error response — 400, 422, 502 and 504 alike — has exactly the body `{ "error": { "code": string, "message": string } }`, and every success exactly `{ "result": number }`, with no extra fields on either and no stack trace, file path or other internal detail anywhere.

**AC-17.** A browser at the configured origin can call the gateway: a preflight `OPTIONS` for `POST /api/v1/calculate` from `http://localhost:5173` is allowed, and the response permits that origin and a JSON content type; another origin is not granted it; a request with no `Origin` header — curl — succeeds either way. Changing `CORS_ORIGIN` moves which origin is granted.

**AC-18.** Started with `GATEWAY_PORT` set to a free port and `CALC_SERVICE_URL` pointed at a port nothing is listening on, the service answers `POST /api/v1/calculate` on the bound port and on no other — `400 VALIDATION_ERROR` for a malformed body and `502 SERVICE_UNAVAILABLE` for a valid one, the real client and the real global `fetch` in the path — announces the port it bound, and releases it when stopped. With `GATEWAY_PORT` unset the port resolves to 3000.

**AC-19.** `apps/api-gateway/README.md` states what the service is and that it is the only public one, the command that starts it and the one that runs its tests, all four environment variables with their defaults, and worked `curl` examples showing a success, a 400, a 422 and the 502 seen when calc-service is stopped.

**AC-20.** With the gateway in the workspaces, `npm run lint`, `npm run check-types`, `npm run test` and `npm run build` still pass from the root, and `npm run dev` starts both services together without either one's port or environment variable colliding with the other's.
