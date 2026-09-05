# tdd-1 — slice 1, the gateway API client module

Criterion → test map (all in `apps/sezzle-calculator/src/api/client.test.ts` unless noted):

- AC-1 → `the request (AC-1) > sends one POST to <gateway URL>/api/v1/calculate with a JSON content type and the request body, and yields a 200 result unchanged`
- AC-2 → `a recognisable answer (AC-2) > relays code and message unchanged for a 422 whose envelope carries <each domain code>` (it.each over `DIVISION_BY_ZERO`, `NEGATIVE_SQRT`, `RESULT_NOT_FINITE`)
- AC-3 → `a backend outage (AC-3) > rewrites a <502/504> carrying SERVICE_UNAVAILABLE into the outage message, whatever the gateway said` (it.each over the gateway's two outage messages)
- AC-4 → `a network failure (AC-4) > resolves, never rejects, with the network-failure message when the gateway cannot be reached`
- AC-5 → `every other answer is unexpected (AC-5) > reports <each stray reply> as unexpected` (it.each) + `reports a <status> whose body is not JSON as unexpected` (it.each)
- AC-6 → `the gateway URL (AC-6) > resolves the default dev gateway when the env var is unset` / `resolves the env var over the default` / `sends the client to the URL the resolved variable names, with no code change`
- AC-7 → `apps/sezzle-calculator/src/frontend-purity.test.ts`: `calls fetch in the API client alone (AC-7)`, `names the gateway URL env var in the API client alone (AC-7)`

Cycles:

- Cycle 1 — AC-1 + AC-7 (fetch exception): wrote `client.test.ts` (one POST to `<gateway>/api/v1/calculate`, JSON body, 200 → `{ result }`) and the purity test's fetch-exception assertion; RED (no module, scan empty). GREEN: created `src/api/client.ts` — factory `createCalculateClient({ gatewayUrl, fetch })`, plain `/api/v1/calculate` join, JSON POST, `classify` handling 200 via `calculateResponseSchema`, unclassified replies throwing loud until a test demands them.
- Cycle 2 — AC-2: it.each 422 domain relay; RED (fallthrough threw). GREEN: 422 branch — `errorResponseSchema` parse + domain-code set (mirrors `apps/api-gateway/src/calc-client.ts`), envelope relayed unchanged.
- Cycle 3 — AC-3: it.each 502/504 with both gateway outage messages; RED. GREEN: outage branch replacing the message with the exported `OUTAGE_MESSAGE`.
- Cycle 4 — AC-4: fetch rejects → client resolves the network-failure envelope; RED (promise rejected). GREEN: the whole downstream call wrapped, any throw resolved as the network outcome.
- Cycle 5 — AC-5: it.each stray replies (stray 400, 500, 503, schema-failing bodies, non-JSON) + malformed JSON; RED. GREEN: `classify` fallthrough returns the unexpected envelope (`INTERNAL_ERROR` / `UNEXPECTED_MESSAGE`); no throw path remains.
- Cycle 6 — AC-6 + AC-7 (env-var scan): resolver default/override tests and the purity env-var scan; RED. GREEN: exported `GATEWAY_URL_VARIABLE`, `DEFAULT_GATEWAY_URL`, `resolveGatewayUrl(env)`.

closing-commit: c3a81bf
