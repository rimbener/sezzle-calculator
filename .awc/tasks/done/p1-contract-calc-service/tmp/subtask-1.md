# subtask-1 — `@repo/contracts` workspace, tooling and README

- **slice:** 1 — the contract
- **criteria:** AC-4, AC-5
- **status:** done
- **paths:** `packages/contracts/package.json`, `packages/contracts/tsconfig.json`, `packages/contracts/eslint.config.mjs`, `packages/contracts/vitest.config.ts`, `packages/contracts/src/index.ts`, `packages/contracts/README.md`, `turbo.json`, `package-lock.json`

Stand up the workspace the rest of slice 1 fills in. Private package named `@repo/contracts`, `"type": "module"`, `exports` pointing `.` at `./src/index.ts` with no build step — the `@repo/ui` pattern. Scripts match the existing workspaces: `lint` (`eslint . --max-warnings 0`), `check-types` (`tsc --noEmit`), `test` (`vitest run --passWithNoTests`). Dependencies: `zod`. Dev dependencies mirroring `@repo/ui`'s: `@repo/eslint-config`, `@repo/typescript-config`, `eslint`, `typescript`, `vitest`.

`src/index.ts` lands here as an empty barrel, which subtask-2 fills in. It exists now so the tsconfig's `include` has an input and `tsc --noEmit` does not fail with TS18003 on an empty package; `--passWithNoTests` covers the matching gap for `vitest run`. That is what makes AC-5 checkable at this subtask's boundary.

The tsconfig extends `@repo/typescript-config/base.json` and adds the four options the build-free choice requires: `noEmit`, `allowImportingTsExtensions`, `erasableSyntaxOnly`, `verbatimModuleSyntax`. `packages/typescript-config` itself is not modified.

The README (AC-4) says what the package holds, that it is consumed as source, and the command that runs its tests.

refactor: correct `turbo.json`'s `build.outputs` from the Next.js default `.next/**` to Vite's `dist/**` — preserves: every existing task keeps producing exactly the results it does today; only the build cache's output globs change, and neither new workspace has a `build` script for it to affect.

AC-5 is this subtask's gate: root `lint`, `check-types`, `test` and `build` all pass with the new workspace in place, the root `README.md` is untouched, and neither existing workspace gains a dependency on the new package. AC-17 re-runs that gate at the end of slice 2, with a second new workspace in the fan-out.
