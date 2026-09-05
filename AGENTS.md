# AGENTS.md

This file provides guidance to Agents like Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A coding-assessment project: a calculator web app. The target architecture (documented in `docs/PRD-P0.md`, mostly **not yet built**) is a React SPA plus two backend microservices. Today only the frontend app and the shared UI package exist.

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
npm run format       # prettier --write on ts/tsx/md
```

Scope to one workspace with a Turbo filter — package names, not paths:

```sh
npx turbo dev --filter=sezzle-calculator
npx turbo lint --filter=@repo/ui
```

Node >= 24 and npm 10.9.4 are pinned in the root `package.json`.

Tests: none exist yet. The PRD settles the tooling as **Vitest everywhere, React Testing Library on the frontend** — set it up that way rather than introducing Jest.

## Monorepo layout

npm workspaces (`apps/*`, `packages/*`) orchestrated by Turborepo.

- `apps/sezzle-calculator` — Vite 8 + React 19 SPA. The React Compiler is enabled via `@rolldown/plugin-babel` + `reactCompilerPreset` in `vite.config.ts`; do not hand-write `useMemo`/`useCallback` that the compiler already covers.
- `packages/ui` (`@repo/ui`) — the design-system component library.
- `packages/eslint-config` (`@repo/eslint-config`), `packages/typescript-config` (`@repo/typescript-config`) — shared configs consumed via `extends`.

Two known rough edges to be aware of rather than "fix" by accident:

- `apps/sezzle-calculator` uses its **own** flat ESLint config (`@stylistic` recommended: no semicolons, single quotes) and does **not** extend `@repo/eslint-config`. `packages/ui` does extend it (Prettier-compatible, semicolons, double quotes). Match the file you are editing.
- The app has no `check-types` script, so the root `check-types` task only covers `@repo/ui`. `turbo.json` `build.outputs` is still the Next.js default (`.next/**`) and does not cache Vite's `dist/`.

## @repo/ui

Consumed as source — there is no build step. `package.json` exports:

- `.` → `src/index.ts` (barrel: `Button`, `Card`, `Badge`, `Key`, `Display`, `Callout`, `BusyLamp`, `Input`, `Toggle`, each with its prop types)
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
- Frontend fetch logic lives in one typed client module used through a hook; components contain no fetch calls. Target is WCAG 2.2 AA with native `<button>`/`<input>` elements and a 360px-wide floor.
