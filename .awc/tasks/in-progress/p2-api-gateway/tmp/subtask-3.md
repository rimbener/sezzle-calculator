# subtask-3 — The calc-service client: deadline, retry and outcome classification

- **slice:** 2 — the client
- **criteria:** AC-6, AC-7, AC-8, AC-9, AC-10
- **status:** done
- **paths:** `apps/api-gateway/src/calc-client.ts`, `apps/api-gateway/src/calc-client.test.ts`

The whole downstream conversation, in one module with no Hono in it. It is built from the resolved config plus a fetch-shaped function, so a test supplies a fake while the real deadline, retry, classification and parsing all run (`spec.md` § Approach).

- **the request (AC-6)** — one `POST` to `/calculate` joined onto the configured base URL, JSON content type, body exactly the validated `{ operation, operands }`.
- **the outcome** — every possibility collapses to one discriminated union the route switches on: a result, a domain error carrying the downstream's own code and message, or unavailable with a reason of `unreachable` or `timeout`. The route never sees a `Response`, a thrown error or a status code.
- **classification (AC-7, AC-8)** — a 200 parsed by `calculateResponseSchema` is a result; a 422 parsed by `errorResponseSchema` whose code is one of the three domain codes is a domain error; everything else — any other status, an unparseable or non-JSON body, an unknown code — is `unreachable`, per `spec.md` § The downstream call. An extra key on an otherwise valid reply is not "everything else": the schemas drop it and the reply still classifies as a result or a domain error (AC-2).
- **deadline and retry (AC-9, AC-10)** — one budget of the configured timeout covers the whole call; a connection-level rejection pauses ~100 ms and retries once, a timeout never retries and reports `timeout`. Two attempts at most. The reason is not decided by which event arrives last: once an attempt has been refused, the budget running out during the pause or during attempt 2 still reports `unreachable`, and `timeout` is reserved for a call in which nothing was ever refused (`spec.md` § The downstream call).

Tests use fakes that resolve, reject or never settle, with Vitest's fake timers for the pause and the deadline so the suite stays fast: each classification case, the retry that succeeds, the retry that does not, the attempt count, a timeout that is not retried, and the budget expiring after a refusal — `unreachable`, not `timeout`.
