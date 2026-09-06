# sezzle-calculator

A desk-calculator web app built as a monorepo: a React SPA, a public API
gateway, and an internal calculation service. Seven operations — `add`,
`subtract`, `multiply`, `divide`, `power`, `sqrt`, `percentage` — live as pure
functions in calc-service; everything else is glue, validation, and error
reporting around them.

## Quick start

Prerequisite: **Node 22.22.2** (the repo pins it — see below). Then, from a
fresh clone:

```sh
npm install        # one install for the whole monorepo
npm run dev        # starts the SPA (:5173), api-gateway (:3000) and calc-service (:3001)
npm test           # runs every workspace's test suite
```

Open http://localhost:5173 and use the calculator. Nothing else to configure —
every port and URL resolves from env vars with dev defaults.

### Commands

Run at the repo root; Turborepo fans them out across all workspaces:

| Command               | Does                                      |
| --------------------- | ----------------------------------------- |
| `npm install`         | Installs all workspace dependencies       |
| `npm run dev`         | Starts all three dev servers (persistent) |
| `npm test`            | Runs every test suite once                |
| `npm run test:watch`  | Watch mode over every suite               |
| `npm run build`       | `tsc -b && vite build` per app            |
| `npm run lint`        | ESLint across the workspaces              |
| `npm run check-types` | TypeScript project checks                 |
| `npm run format`      | Prettier over ts/tsx/md                   |

Scope any command to one workspace with a Turbo filter:

```sh
npx turbo test --filter=api-gateway
npx turbo dev --filter=calc-service
```

### Node version note

`.nvmrc` pins Node to `22.22.2`, and `engines.node` in the root
`package.json` requires `>=22.22.2` within the 22 line. With `nvm use` (or
`fnm use`) you get exactly the pinned version. If you run a different npm
major — Node 24+ ships npm 11/12 — npm prints an `EBADDEVENGINES` warning for
the pinned `devEngines.packageManager` (`^10.0.0`): that warning is working as
intended, not a misconfiguration. Node 22's own npm is 10. See AGENTS.md's
`devEngines` rationale for why it is declared the way it is.

### Running it in Docker

The root `Dockerfile` builds three images from one file — `calc-service`,
`api-gateway`, and `web` (the production SPA bundle behind nginx) — and
`docker-compose.yml` runs the full stack:

```sh
docker compose up --build -d --wait   # builds the three images, waits for health
open http://localhost:8080             # WEB_PORT=9000 docker compose up … to move it
docker compose down                    # stops and removes the containers
```

Only `web` publishes a port. nginx serves the bundle and proxies `/api/` to the
gateway, so the browser talks to one origin (the SPA is built with an empty
`VITE_GATEWAY_URL`, meaning "same origin", and CORS never fires); calc-service
is reachable only inside the compose network, which is the shape PRD-P0 draws.
Each image carries a health check — for the two services it is a real `add`
through `POST /calculate`, since there is no health route yet (PRD-P1 BE-18) —
and compose starts them in dependency order. Curl the gateway through nginx:

```sh
curl -X POST http://localhost:8080/api/v1/calculate \
  -H 'content-type: application/json' \
  -d '{"operation":"add","operands":[12,5]}'   # {"result":17}
```

To run an image on its own, build one target — e.g. `docker build --target
api-gateway -t sezzle-gateway .` — and pass the env vars each README documents
(`CALC_SERVICE_URL`, `CORS_ORIGIN`, …). The `web` image reads
`GATEWAY_UPSTREAM` at start (default `http://api-gateway:3000`); if the gateway
is served from another host instead of proxied, build the bundle with
`--build-arg VITE_GATEWAY_URL=https://gateway.example` and set that origin as
the gateway's `CORS_ORIGIN`.

## Architecture

```
        ┌──────────────────────┐
        │  React SPA (Vite)    │ :5173
        │  no arithmetic, no   │
        │  calc-service URL    │
        └─────────┬────────────┘
                  │ POST /api/v1/calculate   (CORS: the SPA's origin only)
                  ▼
        ┌──────────────────────┐
        │  api-gateway (Hono)  │ :3000   public — the SPA's only address
        │  validates with the  │
        │  shared contract,    │
        │  computes nothing    │
        └─────────┬────────────┘
                  │ POST /calculate        (3s timeout, one retry)
                  ▼
        ┌──────────────────────┐
        │ calc-service (Hono)  │ :3001   internal — never browser-facing
        │  seven pure          │
        │  operations behind   │
        │  a registry          │
        └──────────────────────┘
```

The workspaces talk only over HTTP and never import each other's code. The
request/response contract — operation names, Zod schemas, error codes, error
messages, and each code's default HTTP status — lives once in
[`@repo/contracts`](packages/contracts/README.md), which every app imports.

### The seven operations

Sent as `{ "operation": <name>, "operands": [..] }`; all arithmetic is IEEE-754
doubles:

| Operation    | Arity | Meaning                                                                                  |
| ------------ | ----- | ---------------------------------------------------------------------------------------- |
| `add`        | 2     | `x + y`                                                                                  |
| `subtract`   | 2     | `x − y`                                                                                  |
| `multiply`   | 2     | `x × y`                                                                                  |
| `divide`     | 2     | `x ÷ y`                                                                                  |
| `power`      | 2     | `x ^ y` (fractional and negative exponents valid)                                        |
| `sqrt`       | 1     | `√x` (fires immediately in the UI — no `=` needed)                                       |
| `percentage` | 2     | x% of y (the definition — XC-3 — is in [apps/calc-service](apps/calc-service/README.md)) |

Domain errors come back as HTTP 422 with the shared error envelope:
`DIVISION_BY_ZERO`, `NEGATIVE_SQRT`, `RESULT_NOT_FINITE` (overflow or NaN).
Malformed requests are 400 `VALIDATION_ERROR`. If calc-service is down or
exceeds the gateway's 3-second deadline, the gateway answers `502`/`504`
`SERVICE_UNAVAILABLE` instead of hanging or leaking a fetch error.

## Assumptions and trade-offs

- **Synchronous HTTP between the services.** A single calculate request needs
  one answer before anything else happens; there is no work worth queueing.
  A broker or job queue would add operational weight without shortening the
  request. The gateway carries a 3-second whole-call deadline and a single
  connect retry so calc-service trouble degrades fast, not silently.
- **Static env-var configuration.** Service discovery, config services, and
  message brokers are unnecessary at one-gateway-one-service scale; every
  port and URL is an env var with a dev default, so a plain checkout runs
  with zero configuration.
- **One calc service.** Two services already demonstrate the pattern — a
  network boundary, independent lifecycles, failure isolation. Splitting
  further adds moving parts without adding signal. Scaling horizontally
  later needs no code change: the gateway only knows the URL env var.
- **No persistence, no auth, no expression parser.** Stateless single
  operations are the scope; a history, accounts, or a `2 + 3 × 4` parser are
  possible future work, not architecture here. See the Non-Goals table in
  [docs/PRD-P0.md](docs/PRD-P0.md).

## Where to go deeper

Per-workspace READMEs carry the real API details — fields, statuses, env
vars, curl examples — and this root README never contradicts them:

- [`apps/api-gateway`](apps/api-gateway/README.md) — the public route, error
  mapping, curl examples for every status
- [`apps/calc-service`](apps/calc-service/README.md) — the internal route,
  every operation's pure function, the percentage definition (XC-3), curl
  examples
- [`apps/sezzle-calculator`](apps/sezzle-calculator/README.md) — the UI, its
  entry rules, and the typed client/hook that owns the one network call
- [`packages/contracts`](packages/contracts/README.md) — the shared schemas,
  error codes and messages
- [`docs/PRD-P0.md`](docs/PRD-P0.md) — requirements, use cases (UC-1…UC-11),
  API contract; [`docs/PRD-P1.md`](docs/PRD-P1.md) — future work

## Reviewer walkthrough (UC-11)

Clone → `npm install` → three terminals (or one `npm run dev`) → `npm test`
green → exercise:

```sh
# UC-1  add, with curl:
curl -s -X POST localhost:3000/api/v1/calculate -H 'content-type: application/json' \
  -d '{"operation":"add","operands":[2,3]}'
# → {"result":5}

# UC-2  division by zero → 422 DIVISION_BY_ZERO
curl -s -X POST localhost:3000/api/v1/calculate -H 'content-type: application/json' \
  -d '{"operation":"divide","operands":[8,0]}'

# UC-3  power → 1024; 10^10000 → 422 RESULT_NOT_FINITE
curl -s -X POST localhost:3000/api/v1/calculate -H 'content-type: application/json' \
  -d '{"operation":"power","operands":[2,10]}'

# UC-5  percentage: 15% of 200 → 30
curl -s -X POST localhost:3000/api/v1/calculate -H 'content-type: application/json' \
  -d '{"operation":"percentage","operands":[15,200]}'

# UC-6  invalid request → 400 VALIDATION_ERROR (rejected at the gateway)
curl -s -X POST localhost:3000/api/v1/calculate -H 'content-type: application/json' \
  -d '{"operation":"sqrt","operands":[144,1]}'

# UC-7  stop calc-service (Ctrl-C on its terminal), then any request:
# → 502 SERVICE_UNAVAILABLE within the 3s deadline; restart calc-service.

# UC-8  stop the gateway instead: the UI shows "Can't reach the calculation
# service — try again".

# UC-4 sqrt and every operation through the UI at http://localhost:5173
```

The whole loop — install to every use case verified — fits the ten-minute
budget with no undocumented steps.
