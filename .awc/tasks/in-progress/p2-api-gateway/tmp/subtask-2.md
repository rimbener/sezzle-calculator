# subtask-2 — `apps/api-gateway` workspace, tooling and configuration

- **slice:** 2 — the client
- **criteria:** AC-5
- **status:** todo
- **paths:** `apps/api-gateway/package.json`, `apps/api-gateway/tsconfig.json`, `apps/api-gateway/vitest.config.ts`, `apps/api-gateway/eslint.config.mjs`, `apps/api-gateway/src/config.ts`, `apps/api-gateway/src/config.test.ts`, `package-lock.json`

The workspace, set up exactly as `apps/calc-service` is — same `@repo/eslint-config/base`, same `@repo/typescript-config/base.json` with `types: ["node"]`, `noEmit`, `allowImportingTsExtensions`, `erasableSyntaxOnly` and `verbatimModuleSyntax`, same `vitest.config.ts` with `environment: "node"`. Scripts, with one deliberate omission: `lint`, `check-types`, `test` and `test:watch` land here; the entry-point pair — `dev` (`node --watch src/server.ts`) and `start` (`node src/server.ts`) — lands in subtask-5 with `src/server.ts` itself, because a `dev` script pointing at a missing file would break the root `npm run dev` (a Turbo task over every workspace) for the length of slice 2. Every root task this slice is judged on — `lint`, `check-types`, `test`, `build` — is green here; root `dev` starts both services from slice 3, AC-20's clause and subtask-5's. Dependencies: `hono`, `zod`, `@hono/node-server`, `@repo/contracts` — all already in the lockfile from Phase 1. No new third-party dependency, and no `turbo.json` change: the workspace glob and the task list already cover it.

`src/config.ts` is pure in `env` like calc-service's, resolving the four values of `spec.md` § Configuration — the port, the calc-service base URL, the timeout in milliseconds and the allowed CORS origin — each with its dev default, and exporting the variable names and defaults as constants so tests and the README read one source (AC-5). Nothing here binds a port or reads `process.env` at import time.
