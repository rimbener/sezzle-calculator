# calc-service

The calculation service: the one place the calculator's arithmetic lives. It
owns all seven operations — `add`, `subtract`, `multiply`, `divide`, `power`,
`sqrt`, `percentage` — as pure functions behind an operation registry, and
speaks the request/response contract defined in `@repo/contracts`.

It is an **internal** service. Only the API gateway calls it; it is never
browser-facing, so it serves no CORS headers and the SPA never learns its
address.

## Running it

Start the service with:

```sh
npx turbo dev --filter=calc-service
```

That runs `node --watch src/server.ts` — no build step; Node strips the
types itself (unflagged since 22.18). `npm start` in this directory runs the
same entry once, without the watcher.

The port comes from `CALC_SERVICE_PORT` and defaults to **3001** when the
variable is absent. Change the variable, not the code:

```sh
CALC_SERVICE_PORT=4100 npx turbo dev --filter=calc-service
```

## Calling it

One route: `POST /calculate`, unversioned — the gateway is the compatibility
boundary. A success:

```sh
curl -s http://localhost:3001/calculate \
  -H 'content-type: application/json' \
  -d '{"operation": "percentage", "operands": [15, 200]}'
# → {"result":30}
```

An error, in the one envelope every error uses:

```sh
curl -s http://localhost:3001/calculate \
  -H 'content-type: application/json' \
  -d '{"operation": "divide", "operands": [7, 0]}'
# → 422 {"error":{"code":"DIVISION_BY_ZERO","message":"cannot divide by zero"}}
```

Malformed input is `400 VALIDATION_ERROR`; valid input whose maths is impossible
is `422` (`DIVISION_BY_ZERO`, `NEGATIVE_SQRT`, `RESULT_NOT_FINITE`); anything
unexpected is `500 INTERNAL_ERROR` with the generic message and no internal
detail. Codes and messages are constants in `@repo/contracts`.

`percentage(x, y)` is _x% of y_: `(x / 100) * y`, so `percentage(15, 200)`
is `30`.

## Testing it

Run its tests with:

```sh
npx turbo test --filter=calc-service
```

Or re-run them on every save:

```sh
npx turbo test:watch --filter=calc-service
```
