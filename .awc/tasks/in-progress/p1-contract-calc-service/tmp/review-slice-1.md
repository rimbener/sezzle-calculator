# review-slice-1 — slice 1, the contract

**Verdict: CHANGES_REQUESTED**

Reviewed once. Diff: `main` (`a2a9ffc`) → working tree. Every commit between `main` and `HEAD` (`a900352 chore(spec-to-code): open …`) predates the build and is spec/workflow bookkeeping, so the slice's work is the uncommitted tree: `package.json`, `package-lock.json`, `turbo.json`, the two subtask status flips, and the new untracked `packages/contracts/` (16 files) plus `tmp/tdd-1.md`. Subtasks in scope: `subtask-1` (AC-4, AC-5, one `refactor:` entry), `subtask-2` (AC-1, AC-2, AC-3).

## Suite

`npx turbo run test --output-logs=errors-only` — **3/3 tasks successful** (`@repo/contracts`, `@repo/ui`, `sezzle-calculator`). The given command hit the Turbo cache (`3 cached, FULL TURBO`, 7ms); re-ran the same command with `--force --output-logs=full` for evidence: `@repo/contracts` **57 passed (57), 5 files** — `turbo-tasks.test.ts` 4, `operations.test.ts` 2, `errors.test.ts` 4, `index.test.ts` 1, `calculate.test.ts` 46; `@repo/ui` and `sezzle-calculator` have no test files and exit 0 under `--passWithNoTests`. No failing test → no test blockers.

## Criterion → test

| Criterion | Covered by | Ruling |
| --- | --- | --- |
| AC-1 | `packages/contracts/src/calculate.test.ts:5-33` — seven operations at their own arity; zero, negatives, decimals, zero and negative radicands accepted | covered |
| AC-2 | `calculate.test.ts:42-51` (verbatim quote, incl. `ADD`, `""`, `"sqrt "`), `:53-77` (absent/null/number/array/object operation and non-object bodies → listing sentence), `:79-125` (count, absent `operands`, non-numeric, null, NaN, ±Infinity, non-array; real arity for each two-operand op; singular noun for `sqrt`), `:127-139` (operation before operands) | covered; every assertion is the exact sentence and the only issue |
| AC-3 | `operations.test.ts`, `errors.test.ts` (five codes, `ErrorCode` union, `ERROR_MESSAGES`, both fixed validation messages, envelope shapes via `expectTypeOf` — enforced by `check-types`, not at runtime), `index.test.ts` (barrel key set) | covered; `grep` of `apps/sezzle-calculator/package.json` and `packages/ui/package.json` names no contracts/calc-service/gateway |
| AC-4 | `packages/contracts/README.md:3-17` — holds / consumed as source, no build step / `npx turbo test --filter=@repo/contracts` | covered (read) |
| AC-5 | `test` leg: this run. `lint`/`check-types`: `tdd-1.md` records 9/9 (not in this review's `Commands:`). Root `README.md`: `git diff main --stat -- README.md` empty. **`build` leg: not run by anyone — see F-1** | **open** |
| `refactor:` subtask-1 (`turbo.json` `build.outputs` `.next/**` → `dist/**`) | present in diff (`turbo.json:13-15`), touches only `outputs` — no reach past the entry. Pin `turbo-tasks.test.ts` characterizes task names, `build.dependsOn`/`inputs`, `lint`/`check-types` fan-out, `test`/`dev` shape; green before and after. `preserves:` ("every existing task keeps producing exactly the results it does today") — the config shape is pinned, but the build itself was never run → **see F-1** | move stands; clause unverified |

Message strings versus `spec.md` §Error contract, checked one by one at `packages/contracts/src/messages.ts:10-31`: all nine sentences identical, operand values never interpolated, noun agrees with `OPERAND_COUNT`, operation validated first (`calculate.ts:26-39`). `z.number()` rejects `NaN`/`±Infinity` (Zod 4) — asserted at `calculate.test.ts:88-90`.

## Findings

Any finding blocks. Each is fixed downstream; no re-review.

### F-1 — AC-5's `npm run build` leg and the refactor's `preserves:` clause are unverified — **major**, `test-step`
- Lens: 1 (correctness against the contract)
- `.awc/tasks/in-progress/p1-contract-calc-service/tmp/tdd-1.md:3` — "`npm run build` is in AC-5 but not in this run's `Commands:`, so it was not run here." AC-5 requires `npm run build` to pass from the root with `packages/contracts` present, and subtask-1's `refactor:` clause promises every existing task still produces the same results — the only task whose config the move touched is `build`, and it is the one task nobody ran. `turbo.json:13-15` is exactly where `outputs` changed; `packages/contracts/src/turbo-tasks.test.ts:14-17` pins `dependsOn`/`inputs` but cannot show the build result unchanged. Ruling on the clause: no red, but no evidence either — never a pass on the record's claim.
- Resolves when: `npm run build` is run from the root (all workspaces in scope) and its result recorded in `tdd-1.md` beside the other three legs; the `preserves:` ruling closes with it.
- status: resolved — fix step ran `npm run build` from the root with `packages/contracts` present: 1/1 task (`sezzle-calculator:build`, `tsc -b && vite build`, `dist/index.html` + two assets, the only workspace with a `build` script), uncached; a second run was `1 cached, FULL TURBO`, so the corrected `dist/**` globs now cache the Vite output. Recorded in `tdd-1.md` § Verification. `preserves:` holds: the build produces the same output; only its caching changed.

### F-2 — root `package.json` gains a `devEngines.packageManager` pin outside every subtask's paths, reversing a human commit — **major**
- Lens: 2 (project conventions / scope)
- `package.json:24-30` — `{ "name": "npm", "version": "^12.0.0", "onFail": "warn" }`. Not in `spec.md` §Surfaces touched (which names only `packages/contracts`, `apps/calc-service`, `turbo.json`, `package-lock.json`), not in any subtask's `paths:`, and it re-adds — with a different major and a new `onFail` — the block the human removed minutes earlier in `240d074 fix: node version` (`10.9.4`, strict). The record's rationale (Turbo 2.10 will not resolve the workspace without `packageManager`/`devEngines.packageManager`; baseline green only after the restore) is consistent with Turbo 2's documented requirement and I do not dispute the need — but it is a root-config decision the human took one way and the slice took another, flagged by the implementer for exactly this reason.
- Resolves when: the human ratifies the change (then `spec.md` §Surfaces touched and `CLAUDE.md:35` — F-3 — say what is pinned) or picks another mechanism (e.g. Turbo's `dangerouslyDisablePackageManagerCheck`) and the block goes. Either is acceptable; silently keeping it is not.
- status: resolved — the human ratified the block ("Resume there; ratify ^11.0.0 (Recommended)"): `devEngines.packageManager` stays as `{ "name": "npm", "version": "^11.0.0", "onFail": "warn" }` in the root `package.json`, with the rationale in `AGENTS.md` § Commands (why `devEngines` over Corepack's `packageManager`, why a single major, why `^11`). The fix step had tried the other mechanism first — `dangerouslyDisablePackageManagerCheck: true` in `turbo.json` with the block removed — and on Turbo 2.10.12 `turbo run` then builds its graph from the root alone (`turbo info`: `Package manager: Not found`), discovers no workspaces and aborts with `recursive_turbo_invocations`; logged as cycle 9 in `tdd-1.md`. Recorded where the finding asked: `spec.md` § Surfaces touched gains a root `package.json` row, `CLAUDE.md:35` (F-3) describes the pin as it stands, and `packages/contracts/src/turbo-tasks.test.ts` pins the block (name, `^11.0.0`, `onFail: warn`, no parallel Corepack `packageManager` field) so it is not "fixed" by accident — cycle 11.

### F-3 — `CLAUDE.md` now contradicts the code this slice changed — **major**
- Lens: 4 (docs parity)
- `CLAUDE.md:50` — "`turbo.json` `build.outputs` is still the Next.js default (`.next/**`) and does not cache Vite's `dist/`." The slice's `refactor:` fixed precisely this (`turbo.json:13-15` now `dist/**`) and left the sentence standing, so the "known rough edge" it warns agents not to fix by accident no longer exists.
- `CLAUDE.md:35` — "Node >= 24 and npm 10.9.4 are pinned in the root `package.json`." The slice pins `npm ^12.0.0` with `onFail: warn` (`package.json:24-30`; F-2).
- `CLAUDE.md:37` — "Tests: none exist yet." The slice adds 57 tests in five files under `packages/contracts/src/`.
- `CLAUDE.md:7` and `:41-46` — "Today only the frontend app and the shared UI package exist" and the Monorepo layout list omit `packages/contracts` (`@repo/contracts`).
- The root `README.md` is rightly untouched (AC-5, XC-2); `CLAUDE.md` is agent guidance, not the README or the architecture write-up, so XC-2 does not defer it. Each of the four lines describes a fact the slice's own diff changed.
- Resolves when: those lines match the tree — a layout entry for `packages/contracts`, the tests sentence, the pin sentence (per F-2's outcome), and the `build.outputs` rough edge dropped.
- status: resolved — `CLAUDE.md` now matches the tree: §What this is names `@repo/contracts` and says neither service exists; the pin sentence describes `engines` plus the `devEngines.packageManager` block as it stands and why (it moves with F-2's outcome); the tests sentence names Vitest under the root `test` task with `packages/contracts` as the first suite; §Monorepo layout gains the `packages/contracts` entry; the second rough-edge bullet is dropped whole — its other half ("the app has no `check-types` script") was already false at HEAD (`apps/sezzle-calculator` runs `tsc -b`), so nothing true was left in it, and the ESLint bullet now names `packages/contracts` among the `@repo/eslint-config` consumers. Prose only; checked by reading.

## Lenses with no finding

- **Lens 1, otherwise** — AC-1/2/3 fully test-mapped; no behaviour built ahead of a scenario (the only extra export, `OperandCount`, is the type the `OPERAND_COUNT` map needs). `refactor:` present and within its named scope.
- **Lens 2, otherwise** — `packages/contracts` follows the `@repo/ui` pattern: private, source-consumed `exports`, `lint`/`check-types`/`test` scripts identical, `@repo/eslint-config/base` (exported at `packages/eslint-config/package.json`), `@repo/typescript-config/base.json` plus exactly the four options the spec names, `.ts`-extension relative imports, erasable syntax only, Prettier style (semicolons, double quotes) as `packages/*` uses. One schema refined against `OPERAND_COUNT` as the spec chose; hand-written messages, not Zod's. `vitest.config.ts` in a `"type": "module"` package avoids `@repo/ui`'s CJS warning. Lockfile change is the workspace link plus `zod` losing `dev: true` — correct for a prod dependency.
- **Lens 3 (user surface)** — no runtime surface in this slice (no CLI, route, or UI). The one user-facing artefact is the error-message text the API will emit: all nine sentences match `spec.md` §Error contract verbatim, and names follow the repo's conventions (`SCREAMING_CASE` constants, camelCase builders). N/A beyond that.
- **Lens 4, otherwise** — `packages/contracts/README.md` lands in-slice and satisfies AC-4.
