# AGENTS.md

This file provides guidance to Agents like Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A coding-assessment project: a calculator web app. The target architecture (documented in `docs/PRD-P0.md`) is a React SPA plus two backend microservices. Today the frontend app, the shared UI package, the shared contract package (`@repo/contracts`), the calculation service (`apps/calc-service`, answering `POST /calculate` on :3001) and the API gateway (`apps/api-gateway`, answering `POST /api/v1/calculate` on :3000) exist; the SPA renders the calculator shell over `@repo/ui` and calls the gateway through its typed API client (`src/api/client.ts`) and hook (`useCalculate`) — it owns no arithmetic, and its only network call is the one the client sends to `POST /api/v1/calculate`.

`docs/` is the source of truth for scope and is worth reading before non-trivial work:

- `docs/REQUIREMENTS.md` — the original assessment brief (fixed constraints: Vite + TS + vanilla CSS frontend, Hono + Zod backend).
- `docs/PRD-P0.md` — must-have scope: architecture, numbered requirements (BE-_/FE-_/XC-\*), use cases, API contract, phasing.
- `docs/PRD-P1.md` — nice-to-have and future work. Do not build P1 items before P0 is done.
- `docs/prompts.md` — log of the prompts that produced the PRDs.

## Commands

Root scripts run through Turborepo across all workspaces:

```sh
npm run dev          # all dev servers (persistent, uncached)
npm run build        # tsc -b && vite build per app
npm run lint
npm run check-types
```

Scope to one workspace with a Turbo filter — package names, not paths:

```sh
npx turbo dev --filter=sezzle-calculator
npx turbo lint --filter=@repo/ui
```

Node >= 22.22.2 is pinned via `engines` in the root `package.json`. `devEngines.packageManager` declares npm `^10.0.0` with `onFail: "warn"`. Turborepo 2 refuses to resolve the workspace without a package-manager declaration (`dangerouslyDisablePackageManagerCheck` drops the workspaces on 2.10.12), so one of the two forms has to be there. Notes on the choice, so it is not "fixed" by accident:

- `devEngines` is npm's own advisory field and `onFail: "warn"` keeps a mismatch from hard-failing `npm install`. Prefer it over the legacy `"packageManager"` field, which is Corepack's contract: wherever Corepack is enabled it becomes a hard pin that downloads and switches to that exact npm, with no `onFail` escape hatch.
- Turbo rejects a `devEngines.packageManager.version` range spanning more than one major (`>=10` fails with `invalid_dev_engines_package_manager_field`), so the range cannot be left open.
- `^10.0.0` is the major that stock Node 22 ships, matching `engines.node`. On a different npm major every command prints an `EBADDEVENGINES` warning — that is the warning working as intended, not a misconfiguration. Node 24+ ships npm 11/12 and will warn; run the 22 line, or upgrade both together.
- `22.22.2` is not arbitrary: it is the floor `jsdom` 30 asks for within the 22 line (`^22.22.2 || ^24.15.0 || >=26`), above `eslint` 10's `^22.13.0` and `vitest` 5 / `vite` 8's `^22.12.0`. It also clears 22.18, where Node began stripping types without a flag — `calc-service` and `api-gateway` run their `.ts` sources directly and import `@repo/contracts` across the workspace symlink, so anything lower cannot boot either service. `@types/node` tracks the same line at 22.20.1 in all four workspaces that depend on it.

Tests: Vitest, run per workspace by the root `test` task (`vitest run --passWithNoTests`), with `test:watch` (`vitest watch`) as the persistent watch-mode counterpart and `test:coverage` (`vitest run --coverage`, V8 provider, report under each workspace's gitignored `coverage/`) as the one-shot coverage run; the suites are `packages/contracts/src/*.test.ts`, `apps/calc-service/src/**/*.test.ts`, `apps/api-gateway/src/*.test.ts`, `apps/sezzle-calculator/src/**/*.test.ts(x)` and `packages/ui/src/*.test.tsx`. The two React workspaces render with React Testing Library under jsdom, and each registers `afterEach(cleanup)` in its `src/test/setup.ts` — Vitest runs without globals here, so Testing Library does not auto-clean on its own. The PRD settles the tooling as **Vitest everywhere, React Testing Library on the frontend** — keep it that way rather than introducing Jest.

## Monorepo layout

npm workspaces (`apps/*`, `packages/*`) orchestrated by Turborepo.

- `apps/sezzle-calculator` — Vite 8 + React 19 SPA. The React Compiler is enabled via `@rolldown/plugin-babel` + `reactCompilerPreset` in `vite.config.ts`; do not hand-write `useMemo`/`useCallback` that the compiler already covers.
- `packages/ui` (`@repo/ui`) — the design-system component library.
- `packages/contracts` (`@repo/contracts`) — the shared calculate-API contract: the seven operation names and their operand counts, the Zod request schema, the Zod response schemas (`calculateResponseSchema` for `{ result }`, `errorResponseSchema` for `{ error: { code, message } }` — a caller parses a reply rather than trusting it), the six error codes and every error message string, and `STATUS_BY_CODE`, the one map from each code to its default HTTP status (`as const satisfies Record<ErrorCode, number>` — literal statuses with no framework type, so the package depends on `zod` alone). Consumed as source with no build step; see its README.
- `apps/calc-service` — the calculation service, internal and never browser-facing. Three layers in separate files: the domain — one pure function per operation under `src/operations/`, `registry.ts` mapping each contract operation name to its function, `calculation-error.ts` (the typed failure carrying a contract error code), `calculate.ts` (lookup, run, reject a non-finite result); `src/app.ts` — the Hono app, `createApp()`/`app`, where `POST /calculate` only parses, calls `calculate` and serialises, sending each error at the status the contract's `STATUS_BY_CODE` gives its code (imported, not declared here); `src/server.ts` + `src/config.ts` — the entry point, binding the port `CALC_SERVICE_PORT` resolves to (default 3001) only when run directly or `start(env)` is called. Build-free like `@repo/contracts` — `dev` is `node --watch src/server.ts`, `start` is `node src/server.ts`, relative imports carry `.ts` extensions and `erasableSyntaxOnly` is on. The domain's tests import no HTTP module (`domain-purity.test.ts` names the domain files and enforces it); `app.test.ts` drives the app through `app.fetch` with no port bound, `server.test.ts` binds a free port for real, and `status-map.test.ts` scans every workspace's `src/` so no second `STATUS_BY_CODE` declaration grows back beside the contract's. See its README for the curl example.
- `apps/api-gateway` — the API gateway, the one public service and the only address the SPA will ever know. Four modules, each with one job: `src/config.ts` resolves `GATEWAY_PORT` (default 3000), `CALC_SERVICE_URL` (`http://localhost:3001`), `CALC_SERVICE_TIMEOUT_MS` (3000) and `CORS_ORIGIN` (`http://localhost:5173`) purely from an `env` argument; `src/calc-client.ts` owns the whole downstream conversation — one `POST <CALC_SERVICE_URL>/calculate` under a single whole-call deadline, one retry after a 100 ms pause on a refused connection (never on a timeout), and the reply classified by the contract's own schemas into one discriminated union: a `result`, a `domain-error` carrying calc-service's code and message, or `unavailable` with reason `unreachable` or `timeout`; `src/app.ts` — the Hono app, `createApp({ calcClient, corsOrigin })`, where `POST /api/v1/calculate` only parses the raw body, validates with `calculateRequestSchema`, calls the client and serialises the outcome (200, 422 relayed, 502 `calculation service is unreachable`, 504 `calculation service did not respond in time`), with `hono/cors` granting the one configured origin; `src/server.ts` — `start(env)`, the one place the production wiring is assembled (real client on the global `fetch`), binding the port only when run directly or called. It computes nothing: no arithmetic, no calc-service import (`no-arithmetic.test.ts` scans every module and enforces it). Build-free like calc-service — same `dev`/`start` scripts, `.ts` extensions, `erasableSyntaxOnly`. Tests inject at the seams: `app.test.ts` hands `createApp` a fake client and drives it through `app.fetch`, `calc-client.test.ts` hands the client a fake `fetch` and uses fake timers for the pause and the deadline, `server.test.ts` binds a free port for real with `CALC_SERVICE_URL` aimed at a port nothing listens on. See its README for the curl examples.
- `packages/eslint-config` (`@repo/eslint-config`), `packages/typescript-config` (`@repo/typescript-config`) — shared configs consumed via `extends`.

One known rough edge to be aware of rather than "fix" by accident:

- `apps/sezzle-calculator` uses its **own** flat ESLint config (`@stylistic` recommended: no semicolons, single quotes) and does **not** extend `@repo/eslint-config`. `packages/ui`, `packages/contracts`, `apps/calc-service` and `apps/api-gateway` do extend it (Prettier-compatible, semicolons, double quotes). Match the file you are editing.

## @repo/ui

Consumed as source — there is no build step. `package.json` exports:

- `.` → `src/index.ts` (barrel: `Button`, `Card`, `Badge`, `Key`, `Keypad`, `Display`, `Callout`, `BusyLamp`, `Input`, `Toggle`, each with its prop types)
- `./*` → `src/*.tsx` (subpath import, e.g. `@repo/ui/badge`)
- `./styles.css` → the design-system entry point

`apps/sezzle-calculator/src/main.tsx` imports `@repo/ui/styles.css` once, globally.

Components are thin: they render semantic HTML with `clsx`-composed `sc-*` class names and forward the rest of the DOM props. All visual styling lives in CSS, never inline styles or CSS-in-JS. When adding a component, add its classes to `packages/ui/src/styles/components.css` and export it from `src/index.ts`.

## Design system

`packages/ui/src/styles/` is the implementation: `styles.css` imports `tokens/{fonts,colors,typography,spacing,elevation,motion,base}.css` then `components.css`.

`.agents/skills/design-system/` holds the same tokens plus `BRAND.md`, packaged as the user-invocable `design-system` skill for prototypes and artifacts. The two token copies are duplicated by hand — **change both** when a token changes.

The non-negotiable rules from `BRAND.md` (1970s desk calculator: warm plastic, hard black borders, phosphor-green LCD):

- Never write a raw hex value or a raw pixel size. Use the custom properties (`var(--key-operator)`, `font: var(--type-key)`, `var(--space-5)`).
- Every object has a `var(--border-2) solid var(--border-strong)` edge. Nothing is borderless.
- Shadows are hard down-right offsets with zero blur (`--shadow-key`, `--shadow-panel`). No soft shadows, gradients, blur, or transparency.
- Press translates the element down-right by `--press-offset` and drops its shadow. Busy state blinks with `steps(1,end)` — never a spinner or a fading pulse.
- `Share Tech Mono` (`--font-lcd`) is for the readout only; `Space Mono` for headings/keys/labels; `Archivo` for prose.

## Architecture rules for the backend work (from PRD-P0)

When building the services, these are hard constraints, not preferences:

- Two independently runnable Hono services: `api-gateway` (:3000, public) and `calc-service` (:3001, internal). They talk only over HTTP and never import each other's code.
- The SPA calls only `POST /api/v1/calculate` on the gateway and never contains a calc-service URL. **No arithmetic in the frontend or the gateway** — all seven operations live in `calc-service` as pure functions behind an operation registry, with routes doing only parse/call/serialize.
- A shared workspace package owns the types, Zod schemas, and error codes; all three apps import from it. Both services validate their own input.
- One error envelope everywhere: `{ "error": { "code": string, "message": string } }`. 400 `VALIDATION_ERROR` for malformed input; 422 `DIVISION_BY_ZERO` / `NEGATIVE_SQRT` / `RESULT_NOT_FINITE` for valid-but-impossible math; 502/504 `SERVICE_UNAVAILABLE` when calc-service is unreachable or exceeds the 3s timeout.
- Ports and the calc-service URL come from env vars with dev defaults; no hardcoded cross-service URLs.
- `percentage(x, y)` is "x% of y" = `(x / 100) * y`.
- Frontend fetch logic lives in one typed client module used through a hook; components contain no fetch calls. Native `<button>`/`<input>` elements and a 360px-wide floor.
