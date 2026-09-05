# api-gateway

The API gateway: the calculator's one **public** service, and the only address
the SPA will ever know. It answers a single route, `POST /api/v1/calculate`,
validates every request against the shared contract in `@repo/contracts`,
forwards the valid ones to calc-service over HTTP, and relays what comes back —
a result or a domain error unchanged, and every other outcome as
`SERVICE_UNAVAILABLE`.

It computes nothing. Every number in a success response is the number
calc-service returned; the gateway's own decisions are whether a request is
well-formed and how a downstream failure is reported.

## Running it

Start the gateway with:

```sh
npx turbo dev --filter=api-gateway
```

That runs `node --watch src/server.ts` — no build step; Node strips the types
itself (unflagged since 22.18). `npm start` in this directory runs the same
entry once, without the watcher. `npm run dev` from the repo root starts it
beside calc-service and the SPA.

Everything it needs comes from the environment, with dev defaults that make an
unconfigured checkout work. Change a variable, not the code:

| Variable                  | Default                 | Meaning                                                                              |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `GATEWAY_PORT`            | `3000`                  | the port the gateway binds                                                           |
| `CALC_SERVICE_URL`        | `http://localhost:3001` | calc-service's base URL; `/calculate` is joined onto it, so a trailing slash is fine |
| `CALC_SERVICE_TIMEOUT_MS` | `3000`                  | the whole-call deadline for one downstream call, the single retry included           |
| `CORS_ORIGIN`             | `http://localhost:5173` | the one browser origin allowed to call the gateway                                   |

```sh
GATEWAY_PORT=4000 CALC_SERVICE_URL=http://localhost:4100 npx turbo dev --filter=api-gateway
```

## Calling it

A success — the number is calc-service's, relayed as is:

```sh
curl -s http://localhost:3000/api/v1/calculate \
  -H 'content-type: application/json' \
  -d '{"operation": "percentage", "operands": [15, 200]}'
# → {"result":30}
```

A malformed request is `400 VALIDATION_ERROR`, decided by the gateway alone —
no downstream call is made, so this answers even with calc-service stopped:

```sh
curl -s http://localhost:3000/api/v1/calculate \
  -H 'content-type: application/json' \
  -d '{"operation": "add", "operands": [1]}'
# → 400 {"error":{"code":"VALIDATION_ERROR","message":"operation 'add' requires exactly 2 finite operands"}}
```

Valid input whose maths is impossible is a `422` with calc-service's own code
and message, unchanged:

```sh
curl -s http://localhost:3000/api/v1/calculate \
  -H 'content-type: application/json' \
  -d '{"operation": "divide", "operands": [7, 0]}'
# → 422 {"error":{"code":"DIVISION_BY_ZERO","message":"cannot divide by zero"}}
```

Stop calc-service and the same valid request is a `502`, after one retry about
100 ms after the refused connection:

```sh
curl -s http://localhost:3000/api/v1/calculate \
  -H 'content-type: application/json' \
  -d '{"operation": "divide", "operands": [7, 0]}'
# → 502 {"error":{"code":"SERVICE_UNAVAILABLE","message":"calculation service is unreachable"}}
```

Start calc-service again and the next request succeeds — nothing is cached and
the gateway needs no restart. A calc-service that accepts the connection but
never answers within `CALC_SERVICE_TIMEOUT_MS` is a `504` with the same code
and the message `calculation service did not respond in time`; a downstream
answer outside the contract (a 500, a body that is not a result or an error
envelope) is a `502` like a refused connection.

Every error, at every status, is the one envelope
`{"error":{"code":...,"message":...}}`, and every success exactly
`{"result":...}`. Codes and messages are constants in `@repo/contracts`.

## Testing it

Run its tests with:

```sh
npx turbo test --filter=api-gateway
```

Or re-run them on every save:

```sh
npx turbo test:watch --filter=api-gateway
```

No test needs a running calc-service: the app tests hand `createApp` a fake
client, the client tests hand `createCalcClient` a fake `fetch`, and the server
test points `CALC_SERVICE_URL` at a port nothing listens on.
