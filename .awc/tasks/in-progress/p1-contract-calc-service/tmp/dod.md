# dod — p1-contract-calc-service

**Verdict: PASS**

Validated at `HEAD` = `b23bee2` on `task/p1-contract-calc-service`, base `main` = `a2a9ffc`, Node `v24.20.0`, npm `12.0.2`. Every item below was re-run or re-read in this step; nothing is carried on the records' word alone. No code, test, branch, commit or PR was touched.

## Objective checks re-run

| Check | Command | Result |
| --- | --- | --- |
| Gate (the `Commands:` given) | `npx turbo run lint check-types test --output-logs=errors-only` | **12/12 tasks successful**, exit 0 (cache hit); re-run with `--force` → **12/12, 0 cached**, exit 0, 2.05 s |
| Test counts (uncached) | `npx turbo run test --force --output-logs=full` | `@repo/contracts` **59 passed / 5 files**; `calc-service` **71 passed / 13 files**; `@repo/ui` and `sezzle-calculator` "No test files found, exiting with code 0" (`--passWithNoTests`) |
| Build (AC-5 / AC-17 name it) | `npm run build` → 1/1 (cached replay); `npx turbo run build --force` | **1/1 successful, 0 cached**, exit 0; `sezzle-calculator:build` emits `dist/index.html` + 2 assets |
| Dev fan-out (AC-17) | `npx turbo run dev --dry-run` | `calc-service#dev` = `node --watch src/server.ts` (file exists), `sezzle-calculator#dev` = `vite`; the four config/library packages resolve to `<NONEXISTENT>` (no script, nothing invoked) |
| Smoke (surfaces the task touched) | `CALC_SERVICE_PORT=59723 node src/server.ts` in `apps/calc-service`, then `curl` | announced `calc-service listening on port 59723`; `percentage[15,200]` → `{"result":30}` 200; `sqrt[144]` → `{"result":12}` 200; `divide[7,0]` → 422 `DIVISION_BY_ZERO`/`cannot divide by zero`; `power[10,10000]` → 422 `RESULT_NOT_FINITE`; `foo` → 400 `unknown operation 'foo'`; `sqrt[1,2]` → 400 `operation 'sqrt' requires exactly 1 finite operand`; no operation → 400 listing sentence; `{not json` → 400 `request body must be valid JSON`; `__proto__` → 400 `unknown operation '__proto__'`; `add[2,3]` afterwards → 200 `{"result":5}` (stays up); after `kill` the port refuses connections (curl exit 7). `resolvePort({})` = 3001, `resolvePort({CALC_SERVICE_PORT:"4100"})` = 4100 |
| Working tree | `git status --short` | clean before and after all runs (build output `dist` is gitignored) |

`review.md`: **APPROVED**, 0 open / 0 resolved findings, no blocker or major. No minor remains open anywhere, so nothing needed human acceptance in `spec.md`.

## Dimensions

- [x] **Functionality** — all 19 criteria have a passing test or a read artefact, re-checked against the code (map below); the one `refactor:` entry (subtask-1, `turbo.json` `build.outputs` `.next/**` → `dist/**`, `turbo.json:12-14`) landed, its `preserves:` pinned by `packages/contracts/src/turbo-tasks.test.ts:8-28` (green) and shown by `turbo run build --force` 1/1; every error path in `spec.md` § Error contract exercised by the smoke above and by `app.test.ts` (400 ×17 cases, 422 ×5, 500 ×1). Subtasks 2–5 carry no `refactor:` entry.
- [x] **Conventions** — both new workspaces extend `@repo/eslint-config/base` (`packages/contracts/eslint.config.mjs:1`, `apps/calc-service/eslint.config.mjs:1`) and `@repo/typescript-config/base.json` with the four Node/build-free options (`tsconfig.json:2-8` in each); Prettier style (semicolons, double quotes), `.ts`-extension relative imports, `erasableSyntaxOnly`; scripts `lint --max-warnings 0` / `check-types` / `test` mirror `@repo/ui`; lint is clean at zero warnings (gate). `AGENTS.md:56` names the new consumers in the ESLint rough-edge note.
- [x] **Architecture & dependencies** — layering per PRD-P0/AGENTS.md § Architecture rules: arithmetic only in `apps/calc-service/src/operations/*.ts`; `registry.ts:15-23` is `Record<Operation, OperationFn>`; `calculate.ts:14-16` lookup + non-finite guard; `app.ts:61-73` parse/call/serialise only, `STATUS_BY_CODE` typed `Record<ErrorCode, …>` (`app.ts:18-24`); `server.ts:34-37` binds only under `import.meta.main`/`start()`; domain imports enforced by `domain-purity.test.ts` (green). No gateway/SPA import of the new code (`grep` over `apps/sezzle-calculator/src`, `packages/ui/src`: none; neither `package.json` names `@repo/contracts`, calc-service or a gateway). Port from `CALC_SERVICE_PORT` default 3001 (`config.ts:2-11`); no cross-service URL. Dependencies: see § Supply chain — every task-introduced entry named in `review.md` with a verdict and in `spec.md` § Approach / § Resolved decisions. No surface beyond the spec (no health, CORS, version prefix, logging middleware).
- [x] **User surface** — `POST /calculate` behaves exactly as `spec.md` § Error contract (smoke + `app.test.ts`); docs landed: `packages/contracts/README.md:3-17` (AC-4), `apps/calc-service/README.md:3-10, 12-29, 31-58, 60-66` (AC-18, AC-16), `AGENTS.md` (`CLAUDE.md` → symlink) §What this is, §Commands, §Monorepo layout updated in the diff `main..HEAD`.
- [x] **Security** — no secret in committed files (grep over the task diff for key/secret/token/password/private-key patterns: only the test's `secret` variable at `app.test.ts:167`, a fake error message; no tracked `.env*`); the only user-controlled value reaching a lookup is `operation`, narrowed by `z.enum` before `OPERATION_REGISTRY[operation]` — smoke with `__proto__` → 400; body reflected only as the quoted operation inside a JSON-encoded 400; 500 body is the constant envelope, tested against a message carrying a path and frame (`app.test.ts:166-188`), nothing logged; resources: `start()` returns `close()`, `server.test.ts:32-35, 63-72, 77-80, 109-116` close/kill and prove the port is released; smoke confirmed refusal after kill.
- [x] **Testing rigor** — each criterion is traceable in the slice records: `tdd-1.md` (AC-1..5, refactor pin, F-2 pin), `tdd-2.md` (AC-6..9, 17, 18), `tdd-3.md` (AC-10..16, 19, review-slice-3 F-1) — RED→GREEN cycles listed per criterion; test names and line ranges verified against the files in this step (map below).
- [x] **Observability & docs** — the only log the design asks for is the startup line (`server.ts:36`, asserted at `server.test.ts:103`); no state persisted (stateless service, spec § Non-goals). Docs consistent with code: README start command matches `package.json` `dev`/`start`; README port/default match `config.ts`; README curl outputs match the smoke byte-for-byte; `AGENTS.md` tests sentence names both suites and the `test` task shape matches `turbo.json`.

## Criterion → evidence (re-verified here)

| AC | Evidence |
| --- | --- |
| AC-1 | `packages/contracts/src/calculate.test.ts:5-33` (read), 59/59 green |
| AC-2 | `calculate.test.ts:42-51` verbatim quote; `:53-77` listing sentence for absent/null/number/array/object operation and non-object bodies; `:79-125` arity/absent/non-numeric/null/NaN/±Infinity/non-array, real arity per op, singular `sqrt`; `:127-139` operation before operands — all exact-sentence `toEqual([...])` |
| AC-3 | `errors.test.ts` (five codes, `ErrorCode` type, `ERROR_MESSAGES`, both fixed validation sentences, envelope types), `operations.test.ts`, `index.test.ts`; consumer side: `apps/calc-service` imports every code/message from `@repo/contracts` (`app.ts:1-10`, `calculate.ts:1`, `calculation-error.ts:1`, `divide.ts:1`, `sqrt.ts:1`) and declares no copy |
| AC-4 | `packages/contracts/README.md:3-8` holds, `:10-11` source-consumed/no build, `:16` `npx turbo test --filter=@repo/contracts` |
| AC-5 | gate 12/12; `turbo run build --force` 1/1; `git diff main HEAD --stat -- README.md .nvmrc` empty; SPA/ui `package.json` name none of the new packages |
| AC-6 | `apps/calc-service/src/operations/*.test.ts`; `calculate.test.ts` success table; `app.test.ts:17-37` nine values; smoke `percentage`/`sqrt` |
| AC-7 | `divide.test.ts`, `sqrt.test.ts`, `calculate.test.ts` pass-through; smoke `divide[7,0]` → 422 |
| AC-8 | `calculate.test.ts` non-finite table (`power(10,10000)`, `add(1e308,1e308)`, `power(-8,0.5)`); smoke `power[10,10000]` → 422 `RESULT_NOT_FINITE` |
| AC-9 | `registry.test.ts:14-30`; `domain-purity.test.ts:27-43` (allow-list `@repo/contracts`, `vitest`, relative) — green |
| AC-10 | `app.test.ts:17-37` `toStrictEqual({ result })` at 200 |
| AC-11 | `app.test.ts:42-96` (13 malformed bodies), `:98-117` (4 invalid-JSON bodies), `:119-128` and `:190-203` stays up; smoke bad JSON / missing op / still-up |
| AC-12 | `app.test.ts:131-159` (read at 155-159), smoke 422 ×2 |
| AC-13 | `app.test.ts:161-188` — 500 body exact, text free of `boom`, `/srv`, `at ` |
| AC-14 | every body assertion in `app.test.ts` is `toStrictEqual`; smoke bodies carry no extra field |
| AC-15 | `config.test.ts:5-17`; `resolvePort({})` = 3001 run in this step |
| AC-16 | `apps/calc-service/README.md:14-29` start + `CALC_SERVICE_PORT`/3001/override; `:36-50` curl success + 422; `:57-58` `(x / 100) * y` |
| AC-17 | gate 12/12 with 6 packages in scope; build 1/1; `dev --dry-run` above |
| AC-18 | `apps/calc-service/README.md:3-10` internal, never browser-facing; `:65` `npx turbo test --filter=calc-service` |
| AC-19 | `server.test.ts:37-45` binds the named free port and answers; `:56-61` no other port; `:63-72` released on close; `:82-117` `node src/server.ts` spawned, announces, answers, refused after `SIGTERM` — 5/5 green; smoke reproduced it end to end |

## Review history (rule 4)

| File | Bytes | Shape |
| --- | --- | --- |
| `review-spec.md` | 11811 | `CHANGES_REQUESTED`, 7 findings, each `resolved` (lines 43, 60, 77, 92, 104, 117, 127) |
| `review-slice-1.md` | 10887 | `CHANGES_REQUESTED`, F-1/F-2/F-3 each `status: resolved` (lines 32, 38, 48) |
| `review-slice-2.md` | 6423 | `APPROVED`, "None. `open`: 0, `resolved`: 0" (line 44) |
| `review-slice-3.md` | 13944 | `CHANGES_REQUESTED`, F-1 `resolved` (lines 30, 65) |
| `review.md` | 15772 | `APPROVED`, 0 findings, dependency table ruled entry by entry |
| `shrink-comments.md` | 1612 | report: 10 rewritten files with line counts, "read, nothing to cut" list, gate passed |

Inspection-only resolutions (rule 3): grep for `inspection` / `could not run` / `not run` / `blocked` across the review files hits only review-slice-1's F-1 *statement* ("`npm run build` … not run here"), whose resolution is a recorded run (`tdd-1.md` § Verification, 1/1) — and this step re-ran it uncached. Doc criteria (AC-4, AC-16, AC-18) are marked "checked by reading" in the records, which is the only check a README admits; re-read here. No unverified finding.

## Supply chain (rule 5) — manifests + lockfile vs `main`

Task-introduced (`a900352..HEAD`), each named in `review.md` § Architecture & dependencies with a verdict and in `spec.md` § Approach ("New direct dependencies") / § Resolved decisions:

| Entry | Manifest | Lock | `review.md` | `spec.md` |
| --- | --- | --- | --- | --- |
| `hono ^4.13.7` | `apps/calc-service/package.json` | new `node_modules/hono` 4.13.7, registry + integrity | accepted | named |
| `@hono/node-server ^2.1.1` | `apps/calc-service/package.json` | new, registry + integrity | accepted | named |
| `zod ^4.5.4` | both new workspaces (prod) | entry pre-existed at `main`; `dev: true` dropped | accepted | named |
| `@repo/contracts *`, `calc-service` | workspace links | `link: true` (6 links total in the lock) | accepted | § Surfaces touched |
| dev set (`@types/node ^24`, `eslint 10.9.1`, `typescript ~6.0.3`, `vitest ^5`, shared configs) | both new workspaces | no new lock entries beyond `@types/node` nesting | accepted | subtask-1/3 |
| root `devEngines.packageManager` `{ npm ^11.0.0, onFail: warn }` | root `package.json` | — | accepted, human-ratified (review-slice-1 F-2) | § Surfaces touched row |

`hasInstallScript`: 1 at `main`, 1 at `HEAD` (pre-existing `fsevents`); every non-workspace `resolved` is `https://registry.npmjs.org/`; no patches, no major bumps.

**Base-ref note (not a fail).** `main` (`a2a9ffc`) is 13 commits behind the task's opening commit `a900352`; all 13 are human-authored (`git log` author Hernán Laura, 11:59–14:09) and predate the build. One of them, `a161da2 chore(test): add Vitest and Testing Library harness`, adds `vitest`, `@testing-library/{jest-dom,react,user-event}`, `jsdom` (and their transitive tree, ~80 lock entries) to `apps/sezzle-calculator` and `packages/ui`. They are named in `review.md` with the verdict "accepted as pre-task" but are not recorded in `spec.md`, which lists only the dependencies this task introduced. Ruling: the rule guards the task's own additions; these were committed by the human directly before the task opened and are the tooling the PRD/AGENTS.md fix. Recommendation for the human: fast-forward `main` (or confirm the merge target already has these commits) so the next task's base diff is exact.

## Notes for the human (no action required for PASS)

- `npm` 12.0.2 on this machine prints `EBADDEVENGINES` warnings against `^11.0.0` — the advisory pin working as `AGENTS.md` § Commands describes, not a failure.
- Observations carried in `review.md` (unvalidated `CALC_SERVICE_PORT`, no body-size cap, all-interfaces bind, no 500 logging, unused direct `zod` dep in calc-service) reach no criterion or spec line; left as Phase 2 input.

PASS -> .awc/tasks/in-progress/p1-contract-calc-service/tmp/dod.md
