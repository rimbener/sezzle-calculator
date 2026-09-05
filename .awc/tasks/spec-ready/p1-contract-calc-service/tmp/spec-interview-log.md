# Spec interview — p1-contract-calc-service

Read first: `tmp/user-story.md` (settled ground, never re-asked), `docs/PRD-P0.md`, `docs/REQUIREMENTS.md`, `CLAUDE.md`, root `package.json` / `turbo.json`, `packages/ui` and `apps/sezzle-calculator` as convention references.

Facts looked up, not asked:
- Workspaces are `apps/*` + `packages/*` under Turborepo; tasks `build`, `lint`, `check-types`, `test`, `dev` exist; `turbo.json` `build.outputs` is still the Next.js default (`.next/**`).
- Node 24.20.0, npm pinned at 10.9.4 via `devEngines`; no `.nvmrc` (XC-2 asks for one, but XC-2 is not in this slice).
- Vitest 5 is already the runner in both existing workspaces (`vitest run --passWithNoTests`); `@repo/ui` has a local `vitest.config.ts`.
- `hono` is not in the lockfile; `zod` 4.5.4 is present only transitively. Both are fixed by `docs/REQUIREMENTS.md` constraints, so adopting them is not an open choice.
- `@repo/ui` is consumed as **source** (`exports` → `src/*.tsx`, no build step). Verified empirically on this machine: Node 24.20 strips types from a workspace package symlinked into `node_modules`, so a Node service can import a source-only TS workspace package with no build step and no flag.
- `@repo/ui` extends `@repo/eslint-config`; `apps/sezzle-calculator` uses its own `@stylistic` flat config (no semicolons, single quotes).

## 1 — surfaces
Q: Where do the two new workspaces live and what are they called? My recommendation is `packages/contracts` published as `@repo/contracts`, and `apps/calc-service` — shared code in `packages/`, runnable processes in `apps/`, which is exactly the split the repo already uses and needs no change to the workspace globs.
A: `packages/contracts` + `apps/calc-service` (recommended option) — `@repo/contracts` under `packages/` (shared code), `calc-service` under `apps/` (a runnable process). Matches the split the repo already uses; no change to the `apps/*` + `packages/*` workspace globs.

## 2 — surfaces
Q: How does `calc-service` run and how is `@repo/contracts` consumed — build-free source (Node 24 strips the types itself, `@repo/ui`'s existing convention), or a real `tsc` build step emitting `dist/` + `.d.ts` that the service imports?
A: Build-free source (recommended option) — `@repo/contracts` exports `src/*.ts` directly, like `@repo/ui`. calc-service runs as `node --watch src/server.ts` in dev and `node src/server.ts` in prod; no bundler, no dist. `check-types` (tsc --noEmit) is the type gate; turbo needs no `^build` dependency. Cost accepted: relative imports carry `.ts` extensions and the code stays erasable-syntax-only (no enums).

## 3 — failure semantics
Q: How is the request validated and what exactly does a 400 `message` say? UC-6's example is `operation 'add' requires exactly 2 finite operands`, which is one hand-written sentence rather than Zod's own issue text — so the choice is between a schema whose shape produces that message deterministically and one that reports Zod's issues.
A: Base schema + arity refine, one sentence (recommended option) — one schema in `@repo/contracts`: operation enum + operands array of finite numbers, refined against a per-operation arity map that the operation registry also uses. Any failure maps to a single deterministic sentence in UC-6's phrasing: unknown op → `unknown operation 'foo'`; wrong count → `operation 'add' requires exactly 2 finite operands`; NaN operand → `operation 'sqrt' requires exactly 1 finite operand`; bad JSON → `request body must be valid JSON`. All 400 `VALIDATION_ERROR`. Messages stable, testable, identical in both services.

## 4 — reshaping existing code
Q: Does this slice touch any shared root config, or is it purely additive? The candidates I can see are `turbo.json` (its `build.outputs` is still the Next.js default `.next/**` and caches nothing for Vite) and the root `README.md`/`.nvmrc` (XC-2's territory, not this slice's).
A: Additive + fix `turbo.json` outputs — the two new workspace directories plus the lockfile, and also correct `build.outputs` from the Next.js leftover `.next/**` to Vite's `dist/**` so the SPA build actually caches. A behaviour-preserving fix riding this slice, recorded as a refactor entry on the subtask that sets up the workspaces. The root README and `.nvmrc` stay XC-2's.

## 5 — failure semantics
Q: The 400 wording is settled (entry 3). What do the 422 and 500 `message` strings say? These are read by a reviewer with curl, not by an end user — the SPA writes its own copy (FE-4), and the story fixed the 500 as generic with no internal detail.
A: Plain literal sentences (recommended option) — one fixed sentence per code, same hand-written style as the 400s, no operand values interpolated, so every message is a constant the tests assert exactly: `DIVISION_BY_ZERO` → `cannot divide by zero`; `NEGATIVE_SQRT` → `cannot take the square root of a negative number`; `RESULT_NOT_FINITE` → `result is not a finite number`; `INTERNAL_ERROR` → `internal error`.

## 6 — compatibility semantics
Q: BE-9 wants the port from an env var with a 3001 default. What is the variable called? It is a cross-phase convention: Phase 2 adds a second service on :3000 plus a calc-service URL, and `npm run dev` at the root starts every service in one shell, so a bare shared name can collide.
A: `CALC_SERVICE_PORT` (recommended option) — service-prefixed, so the gateway's `GATEWAY_PORT` and `CALC_SERVICE_URL` sit beside it with no collision when one shell starts both. Default 3001 when unset.

## 7 — dependencies
Q: `hono` and `zod` are fixed by the brief, but Hono is a fetch-API framework: on Node it needs an adapter to bind a port. The usual one is `@hono/node-server`, a third direct dependency the PRD never names. Adopt it, or bind the port with Node's own `node:http` and `app.fetch`?
A: `@hono/node-server` (recommended option) — Hono's own maintained Node adapter, the documented way to run Hono on Node. One extra direct dependency, versioned alongside Hono. The gateway (Phase 2) reuses it, so the choice is made once.

---

Every area this step must cover is settled: the story left no open questions; surfaces (1, 4), failure semantics (3, 5), compatibility (6), reshaping (4), dependencies (7). Bundle written.
