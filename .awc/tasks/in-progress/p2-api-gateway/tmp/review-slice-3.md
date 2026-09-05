# review-slice-3 — slice 3, the public surface (subtask-4, subtask-5)

**Verdict: CHANGES_REQUESTED** — one finding, docs parity (major). The code, the tests and the gateway's own README pass every lens; the one sentence AGENTS.md § What this is now says about the SPA is false.

## Suite

Command run, from the launch directory, exactly as given: `npx turbo run test --output-logs=errors-only`.

Result: exit 0, `Tasks: 5 successful, 5 total` — every task replayed from Turbo's cache (`5 cached, 5 total, FULL TURBO`), so the run is green for inputs identical to the working tree; no per-test output was emitted to inspect. The build record's count (gateway 5 files / 86 tests) was checked instead by reading the test files below, case by case. No failing test; nothing tagged `test-step` on that account.

## Diff reviewed

Slice 2's record `tdd-2.md` names `closing-commit: 9855703`. The diff runs `9855703..working tree`:

- Tracked: `AGENTS.md` (3 hunks), `apps/api-gateway/package.json` (`dev` and `start` scripts), `tmp/subtask-4.md` and `tmp/subtask-5.md` (status `todo` → `done`), plus the trail commit `4371547` writing `tdd-2.md`'s `closing-commit:` line — bookkeeping, no finding.
- Untracked, added by this slice: `apps/api-gateway/src/app.ts`, `app.test.ts`, `no-arithmetic.test.ts`, `server.ts`, `server.test.ts`, `apps/api-gateway/README.md`, `tmp/tdd-3.md`.

Read for context (not reviewed): the slice-2 modules the diff calls (`calc-client.ts`, `config.ts`), the contract's `index.ts`, calc-service's `app.ts` / `server.ts` / `server.test.ts` / README as the convention being mirrored, `packages/contracts/src/turbo-tasks.test.ts` and `apps/calc-service/src/status-map.test.ts` as the workspace-scanning suites the new files must pass.

## Lens 1 — correctness against the contract

`criterion → test` map in `tdd-3.md` checked entry by entry against the test files; every mapped test exists and asserts what the map says.

| Criterion | Where | Verdict |
| --- | --- | --- |
| AC-11 | `app.test.ts:37-62`, seven `it.each` cases, `toStrictEqual({ result: 42 })`, client called once with `{ operation, operands }` | covered |
| AC-12 behavioural | `app.test.ts:78-106` — implausible `7` for `add(2,3)` relayed exactly; seven operations yield 502 while the client reports unreachable | covered |
| AC-12 structural | `no-arithmetic.test.ts:36-62` — scans every `.ts` under `src/`, allows only `@repo/contracts`, `@hono/node-server`, `hono`/`hono/*`, `node:*`, `vitest`/`vitest/*` or a relative import that stays inside `src/`; forbids `Math.` | covered; a `calc-service` bare specifier or a `../../calc-service/...` path would both be caught |
| AC-13 | `app.test.ts:186-238` twelve malformed shapes, `app.test.ts:240-262` four non-JSON bodies, each asserting `calcClient` was not called against a client that reports unreachable; `:264-278` stays-up pin | covered — `NaN`/`Infinity` cannot travel in JSON, so the `null` operand (`:220-223`) and the bare `NaN` literal (`:245`) are the right two readings |
| AC-14 | `app.test.ts:140-181` three codes plus the non-contract message `"nope"` relayed verbatim | covered |
| AC-15 | `app.test.ts:108-138` 502 / 504 with the two contract sentences; `:281-307` a rejecting client → 502 envelope with no `fetch` / path / `ECONNRESET` text; `server.test.ts:70-77` the live unreachable path with the real client and real `fetch` | covered |
| AC-16 | every body assertion above is `toStrictEqual` | covered |
| AC-17 | `app.test.ts:344-419` preflight 204 with origin / `POST` / `content-type`; other origin → no `access-control-allow-origin`; actual POST marked; no `Origin` succeeds; `CORS_ORIGIN` moves the grant. Hono 4's `cors` with a string `origin` is an exact match (`node_modules/hono/dist/middleware/cors/index.js:17`), so the "another origin" case is real, not incidental | covered |
| AC-21 | `app.test.ts:309-342` real `createCalcClient` on a fetch fake: 502, 502 (four refusals), then 200 with the fake's `5` and a fifth call, one app instance | covered |
| AC-18 | `server.test.ts:51-104` bound port, 400 with no downstream, 502 against a dead `CALC_SERVICE_URL`, OS-picked port reported, no other port, released on close; `:106-149` `node src/server.ts` announces `api-gateway listening on port <n>`, answers, releases on `SIGTERM`. Default 3000 is slice 2's `config.test.ts`, not re-bound — accepted, binding :3000 in a test would collide with a running gateway | covered |
| AC-19 | `apps/api-gateway/README.md` — "one **public** service … the only address the SPA will ever know" (`:3-4`), start (`:18-20`) and test (`:97-99`) commands, the four variables with defaults (`:30-35`), curl for a success / 400 / 422 / 502 with calc-service stopped (`:45-80`) | covered, by docs |
| AC-20 | the gate command; `package.json` `dev`/`start` mirror calc-service's; `GATEWAY_PORT` vs `CALC_SERVICE_PORT` cannot collide. `build` and a live `dev` were not run — not in `Commands:` | as far as the gate reaches |

Neither subtask carries a `refactor:` entry; nothing to pin.

Scope: `app.ts` does parse / validate / call / serialise and nothing else; 404 keeps Hono's default as the spec says; no health route, no logging, nothing from P1. `server.ts` assembles the real client from `resolveConfig(env)` and the global `fetch` — the one place the spec puts production wiring. The `fail` / `parseJson` helpers are duplicated from calc-service on purpose (`spec.md` § Approach rejects lifting them).

**Recorded deviation, accepted:** `subtask-4.md` says `createApp` "exports a ready-made `app` beside it, as calc-service does"; `app.ts` exports `createApp` only. `tdd-3.md` explains why — a ready-made `app` would have to read `process.env` at import time, contradicting `spec.md` § Approach and `subtask-5.md`, which make `start(env)` the one place wiring is assembled. The spec wins; the tests never needed the export. Not a finding; the stale sentence is in a trail file, and the deviation is on the record.

## Lens 2 — project conventions

- Two services, HTTP only, neither imports the other — enforced by `no-arithmetic.test.ts`.
- No arithmetic in the gateway — enforced (`Math.` forbidden; every response number is `outcome.result`).
- One envelope, codes and messages read from `@repo/contracts`, no string restated (`app.ts:1-11`); `STATUS_BY_CODE` imported, not declared — `status-map.test.ts` stays satisfied.
- Ports and the calc-service URL from env with dev defaults; no hardcoded cross-service URL.
- `@repo/eslint-config` style (semicolons, double quotes), `.ts` extensions on relative imports, no non-erasable syntax, build-free `dev`/`start` identical to calc-service's, `import.meta.main` guard as calc-service uses it.
- `app.onError` mapping any residual throw to the 502 envelope (`app.ts:76-78`) — consistent with the spec's error table, which gives the gateway no 500 row and keeps `INTERNAL_ERROR` calc-service's.

No finding.

## Lens 3 — user surface

The public API. Route `POST /api/v1/calculate`; statuses, codes and messages match `spec.md` § Error contract row for row, 504 explicit on the timeout reason only (`app.ts:99-105`); CORS grants the one configured origin with `POST`/`OPTIONS` and `content-type`; the announce line `api-gateway listening on port <n>` follows calc-service's `<service> listening on port <n>`; variable names are the spec's four. No finding.

## Lens 4 — docs parity

`apps/api-gateway/README.md` (new) matches the code: retry-after-100 ms, 504 sentence, 502 for an out-of-contract answer, envelope shape, test seams. `AGENTS.md` carries the slice-3 items `spec.md` § Surfaces touched lists: "the gateway is not built" removed (`:7`), the `apps/api-gateway` entry (`:52`) — checked clause by clause against `config.ts`, `calc-client.ts` (fake timers confirmed at `calc-client.test.ts:156`), `app.ts`, `server.ts` — and the Node bullet (`:40`); the suites list, the `@types/node` count and the `@repo/eslint-config` consumers (`:42`, `:57`) were already in place from slice 2 and now read true.

### Finding 1 — major, docs parity, `resolved`

**`AGENTS.md:7`** — the rewritten § What this is sentence ends: "the SPA does not yet call the gateway, **and its calculator logic is still local**." The SPA has no calculator logic: `apps/sezzle-calculator/src/App.tsx` (8 lines) renders only `<DesignSystem />` from `@repo/ui/design-system`, a static component showcase (`packages/ui/src/design-system.tsx` — sample keys and sample states, no operations). The clause describes code that does not exist, and a reader following it will go looking for arithmetic to move out of the SPA in Phase 4. Fix: drop the clause or state what is true — e.g. "the SPA does not yet call the gateway; today it renders the design-system showcase" — in this slice's diff. Docs only; no test involved, so not `test-step`.

## Non-findings, noted for the fixer's convenience only

- `no-arithmetic.test.ts:12,29` — `"node:"` sits in `ALLOWED_PREFIXES` and is also handled by an explicit `startsWith("node:")`; the prefix entry is dead (a `node:fs` specifier never starts with `node:/`). Harmless.
- `server.test.ts:80` — `{ ...(await env(0)) }` spreads an object that is already fresh. Harmless.

## Verdict

**CHANGES_REQUESTED** — 1 finding (major, docs parity, `open`), 0 `test-step`.

Fix (fix-slice-findings): `AGENTS.md:7` now ends "the SPA does not yet call the gateway and today renders only the design-system showcase." — the wording the finding proposed, joined into one clause; `apps/sezzle-calculator/src/App.tsx` renders `<DesignSystem />` and nothing else. Finding 1 → `resolved`. Docs only, no test.
