# review — p1-contract-calc-service, full review

**Verdict: APPROVED** — round 1, no findings. `open`: 0, `resolved`: 0.

Mode `full-review`. Diff: `main` (`a2a9ffc`) → `HEAD` (`68a080e`), 105 files, `+5502/-83`. Verdict-writer: `workflows/spec-to-code/scripts/write-verdict-file.sh`. Suites were **not** re-run here (not this step's job); the trail carries no red — `tdd-3.md` § Verification records the last `--force` run as 12/12 tasks, exit 0 (`calc-service` 71 tests / 13 files, `@repo/contracts` 59 / 5), `npm run build` 1/1, and every slice review (`review-slice-1..3.md`) closed green with its findings `resolved`.

## Base-ref note (scope, not a finding)

`main` in this worktree sits at `a2a9ffc`, thirteen commits behind the task's opening commit `a900352 chore(spec-to-code): open p1-contract-calc-service for the build`. Everything in that range is human-authored and predates the build: the spec-to-code workflow package (`d222f37`, `18867a8`, `spec-to-code.sh`, `agents-cli.conf`, `.claude/commands/`, `.codex/`, `.opencode/`), the Vitest/Testing Library harness for `apps/sezzle-calculator` and `packages/ui` (`a161da2`), the spec bundle itself (`929b5b6`, `e425348`), `docs/spec-phases.md` and prompt-log entries, and `240d074 fix: node version`. All four lenses were applied to the whole `main..HEAD` diff as instructed; findings are attributed to the task's own commits (`a900352..HEAD`, 65 files, `+1797/-17`), and the pre-task content is ruled below where a lens touches it (dependencies). It is not "past what the spec took on" by this task's hand — it is the ground the task was opened on. Recommendation for the human, outside this verdict: fast-forward `main` (or confirm the merge target already carries these commits) so the next task's base is exact.

## Scope & tests `[code]`

Every criterion in `acceptance-criteria.md` maps to at least one concrete test, checked against the diff (not the records alone):

| Criterion | Test | Ruling |
| --- | --- | --- |
| AC-1 | `packages/contracts/src/calculate.test.ts:5-33` — seven operations at their own arity; zero, negatives, decimals, zero and negative radicands | covered |
| AC-2 | `calculate.test.ts:42-51` verbatim quote (`foo`, `ADD`, `""`, `"sqrt "`); `:53-77` absent/`null`/number/array/object operation and non-object bodies → listing sentence; `:79-125` count, absent `operands`, non-numeric, `null`, `NaN`, `±Infinity`, non-array, real arity per two-operand op, singular noun for `sqrt`; `:127-139` operation validated first | covered — every assertion is the exact sentence and the only issue |
| AC-3 | `operations.test.ts:5-28`; `errors.test.ts:11-50` (five codes, `ErrorCode` union, `ERROR_MESSAGES`, both fixed validation sentences, envelopes via `expectTypeOf`); `index.test.ts:5-21` barrel key set. Consumer side: `apps/calc-service` imports every code and message from `@repo/contracts` (`app.ts:1-10`, `calculation-error.ts:1`, `calculate.ts:1`, `divide.ts:1`, `sqrt.ts:1`); `STATUS_BY_CODE` (`app.ts:18-24`) is a status map typed `Record<ErrorCode, …>`, not a copy of the codes | covered |
| AC-4 | `packages/contracts/README.md:3-17` | covered (read) |
| AC-5 | `tdd-1.md` § Verification (9/9 + `npm run build` 1/1, recorded after review-slice-1 F-1); root `README.md` and `.nvmrc` unchanged vs `main` (`git diff main --stat` empty); `apps/sezzle-calculator/package.json` and `packages/ui/package.json` name no `@repo/contracts`, calc-service or gateway | covered |
| AC-6 | `apps/calc-service/src/operations/*.test.ts` at the nine values; `calculate.test.ts:7-21` the same nine through the registry | covered |
| AC-7 | `divide.test.ts:12-25`, `sqrt.test.ts:16-29`, `calculate.test.ts:47-62` | covered |
| AC-8 | `calculate.test.ts:23-45` — `power(10,10000)`, `add(1e308,1e308)`, `power(-8,0.5)` | covered |
| AC-9 | `registry.test.ts:14-30`; `domain-purity.test.ts:29-44` (domain files named at `:10-15`, import allow-list `@repo/contracts`/`vitest`/relative) | covered |
| AC-10 | `app.test.ts:17-37` | covered |
| AC-11 | `app.test.ts:42-96` (13 malformed bodies), `:98-117` (invalid JSON incl. empty body and bare `NaN`), `:119-128` and `:189-203` (stays up) | covered |
| AC-12 | `app.test.ts:131-159` | covered |
| AC-13 | `app.test.ts:161-187` — injected throw carrying a fake path and frame; body exact, text contains none of `boom`, `/srv`, `at ` | covered |
| AC-14 | every body assertion above is `toStrictEqual` | covered |
| AC-15 | `config.test.ts:5-17` | covered |
| AC-16 | `apps/calc-service/README.md:12-58` — start command, `CALC_SERVICE_PORT` + default + override, `curl` success and 422, percentage formula | covered (read) |
| AC-17 | `tdd-2.md`/`tdd-3.md` § Verification — 12/12, `npm run build` 1/1, `turbo run dev --dry-run` resolving `calc-service#dev` to an existing entry | covered |
| AC-18 | `apps/calc-service/README.md:3-10` — internal, never browser-facing; `:59-66` test command | covered (read) |
| AC-19 | `server.test.ts:30-64` (binds the named free port, answers there, refuses on another, refuses after `close()`); `:66-109` (`node src/server.ts` spawned, announces the port, answers, refused after `SIGTERM`) | covered |

`refactor:` entries: exactly one, on subtask-1 — `turbo.json` `build.outputs` `.next/**` → `dist/**` (`turbo.json:12-14`). Landed within its named scope; `preserves:` pinned by `packages/contracts/src/turbo-tasks.test.ts:8-27` (characterizes the five root tasks, `build.dependsOn`/`inputs`, `lint`/`check-types` fan-out, `test`/`dev` shape) and verified by the `npm run build` run recorded in `tdd-1.md` (review-slice-1 F-1, `resolved`). Subtasks 2–5 carry no `refactor:` entry; none owed.

Nothing in the task's commits past the spec: no health route, no CORS, no versioned prefix, no logging middleware, no arbitrary precision. `createApp({ calculate })` (`app.ts:47-49`) is the one seam AC-13's induced failure needs — accepted in review-slice-3, not re-litigated. Root `package.json` `devEngines.packageManager` is outside the original subtask paths but is a recorded human decision (review-slice-1 F-2 `resolved`; `spec.md` § Surfaces touched row; rationale in `AGENTS.md` § Commands; pinned at `turbo-tasks.test.ts:34-46`).

## Architecture & dependencies `[arch]`

Layering as `spec.md` § Approach and `AGENTS.md` § Architecture rules fix it, checked import by import:

- Domain (`operations/*.ts`, `registry.ts`, `calculate.ts`, `calculation-error.ts`) imports only `@repo/contracts` and siblings — enforced by `domain-purity.test.ts`. `divide.ts:1-3` and `sqrt.ts:1-3` importing the contract and `../calculation-error.ts` is what the spec's error table demands (ruled in review-slice-2).
- `app.ts` imports the contract, `hono`, `hono/utils/http-status` (a public `./utils/*` export) and the domain; routes do parse/call/serialise only (`app.ts:62-74`). No arithmetic outside `src/operations/`.
- `server.ts` imports `app.ts`, `config.ts`, `@hono/node-server`; binds only inside `start()` or under `import.meta.main` (`server.ts:35-38`).
- No upward or cross-boundary import; no gateway exists yet to import from; `apps/sezzle-calculator` and `packages/ui` are untouched by the task's commits.
- Extension points used as designed: adding an operation is a module plus a `registry.ts:18-26` entry (`Record<Operation, …>` makes an omission a type error); adding an error code is one `STATUS_BY_CODE` entry (`Record<ErrorCode, …>`, same guarantee).
- Config surface: `CALC_SERVICE_PORT` with default 3001 (`config.ts:2-12`), exactly the spec's resolved decision; no hardcoded cross-service URL anywhere (the README's `localhost:3001` is a curl example).
- Both new workspaces extend `@repo/eslint-config/base` and `@repo/typescript-config/base.json` locally, as the spec resolves; `apps/calc-service/tsconfig.json:4` `"types": ["node"]` follows the `apps/sezzle-calculator/tsconfig.node.json` precedent (ruled in review-slice-2).
- Compatibility: no persisted state, no schema migration, no existing consumer of `@repo/contracts` or of the service — nothing to break silently. N/A.

**Dependency diff — read in full (manifests + lockfile), ruled entry by entry:**

| Entry | Where | Ruling |
| --- | --- | --- |
| `zod` `^4.5.4` → lock `4.5.4` | `packages/contracts/package.json` (prod), `apps/calc-service/package.json` (prod) | accepted — fixed by `docs/REQUIREMENTS.md`, named in `spec.md`; registry-resolved with integrity, MIT. Lock entry drops `dev: true` (correct for a prod dep). Not imported directly by `calc-service` — see Observations |
| `hono` `^4.13.7` → lock `4.13.7` | `apps/calc-service/package.json` (prod) | accepted — fixed by the brief; registry, integrity, MIT, `engines.node >=16.9.0` |
| `@hono/node-server` `^2.1.1` → lock `2.1.1` | `apps/calc-service/package.json` (prod) | accepted — named in `spec.md` (Hono's own Node adapter, reused by the Phase 2 gateway); registry, integrity, MIT, peer `hono ^4` satisfied, `engines.node >=20` |
| `@repo/contracts` `*` | `apps/calc-service/package.json` (prod) | accepted — workspace link (`resolved: packages/contracts`, `link: true`) |
| `@types/node` `^24.13.3`, `eslint` `10.9.1`, `typescript` `~6.0.3`, `vitest` `^5.0.0`, `@repo/eslint-config`, `@repo/typescript-config` | both new workspaces (dev) | accepted — mirror `@repo/ui`'s dev set; `@types/node` 24 nests under `apps/calc-service/node_modules` because the root hoists `@repo/ui`'s 26.4.1 — deliberate, matches the runtime major, and `tsconfig` `"types": ["node"]` loads one version |
| root `devEngines.packageManager` `{ npm, ^11.0.0, onFail: warn }` | root `package.json` | accepted — human-ratified (review-slice-1 F-2), not a dependency but a manifest change; Turborepo 2 needs it to resolve the workspace |
| Lifecycle scripts | lockfile | none newly trusted — `hasInstallScript` appears on no added entry; the only one in the whole lock is pre-existing `fsevents` |
| Patches / vendored / non-registry sources | lockfile | none — every non-workspace `resolved` is `https://registry.npmjs.org/` with `integrity`; the only non-registry entries are the six workspace links |
| Major-version jumps | lockfile | none — all three runtime deps are new to the repo, not upgrades |
| **Pre-task** (`a161da2`, human): `vitest ^5.0.0`, `@testing-library/jest-dom ^7.0.1`, `@testing-library/react ^16.3.3`, `@testing-library/user-event ^14.6.7`, `jsdom ^30.0.1` added to `apps/sezzle-calculator` and `packages/ui`; lock drops stale `apps/web`/`apps/docs` entries | `main..a900352` | accepted as pre-task — outside this task's spec, committed by the human before the task opened, and the tooling the PRD fixes ("Vitest everywhere, React Testing Library on the frontend") |

## Performance `[perf]`

Effectively N/A: a stateless request handler over seven one-expression functions. Checked anyway — no serialization of concurrent work, no busy-wait, no unbounded log buffering, no repeated I/O; the schema (`calculate.ts:26-39`) and the app (`app.ts:77`) are built once at module load; `domain-purity.test.ts` does its synchronous `fs` reads at test time only. Two non-findings under Observations.

## Security `[security]`

Trust boundary touched: the HTTP request body on `POST /calculate`.

- **Injection** — the body goes `c.req.text()` → `JSON.parse` (`app.ts:33-39`) → `calculateRequestSchema.safeParse` → `OPERATION_REGISTRY[operation]` / `OPERAND_COUNT[operation]` with `operation` already narrowed to the seven-member enum, so no user-controlled key reaches a lookup (`__proto__`, `constructor` → `unknown operation '…'`). No shell, query or interpreter anywhere.
- **Sensitive data on exposed surfaces** — the 500 path emits only the constant envelope (`app.ts:55-60`), tested at `app.test.ts:161-187` against a message carrying a path and frame. Nothing is logged on any path, so nothing leaks via logs either. The only reflected input is the supplied `operation` string, quoted verbatim inside a JSON-encoded 400 body — required by AC-2 and the spec's first message rule; `c.json` escapes it. No secrets in any committed file; `.env*` is only a pre-existing Turbo input glob.
- **Path traversal** — no user value becomes a path segment. `domain-purity.test.ts:9` builds paths from `import.meta.dirname` and a fixed list (test code).
- **Resource teardown** — `start()` returns a `close()` (`server.ts:24-28`); `server.test.ts:29-33` closes it in `afterEach`, `:71-75` kills the spawned child in `afterEach`; the entry-point test's wait settles from Vitest's own timeout or the child's `exit` event, never from a signal the child controls. Synchronous `listen` failures (e.g. `NaN` port) reject the promise because they throw inside the executor.
- Bind host is Node's default (all interfaces); the spec fixes no hostname for the internal service and PRD-P0 places it behind the gateway — see Observations.

No blocker, major or minor under this lens.

## Findings

None. Any finding would block; there is none to record. Every finding raised in the slice reviews (`review-slice-1` F-1, F-2, F-3; `review-slice-3` F-1) is marked `resolved` there with evidence a command produced (`npm run build` run, human ratification recorded in `spec.md`, RED→GREEN test for the bound-port fix) — none rests on inspection where a command was blocked. Not re-litigated.

## Observations (not findings — no spec line or criterion reaches them; carried for Phase 2)

- `zod` is a direct prod dependency of `apps/calc-service` (`package.json:16`) that no file under `apps/calc-service/src` imports — the schema arrives via `@repo/contracts`. Subtask-3 lists it explicitly and the brief fixes "Hono + Zod backend", so it is in scope; it is one line to drop if the gateway pattern turns out the same.
- `[perf]` `operandsSchema(operation)` (`packages/contracts/src/calculate.ts:18-19`) builds a small Zod array schema per request inside the transform. Seven possible schemas; precomputing them is a micro-optimisation nobody has asked for.
- `[perf]/[security]` `c.req.text()` (`app.ts:63`) buffers the whole body with no size cap, and AC-2 reflects the supplied operation string at whatever length arrives. Standard for a JSON API; the public edge is the Phase 2 gateway, where a body limit belongs if one is wanted. Adding one here would be a config surface the spec does not call for.
- `[security]` `server.ts:21` binds all interfaces (Node default). Fine for the dev target; a deployment that puts calc-service on a shared host should give it a bind address, which is a Phase 2 / deployment decision, not this spec's.
- `resolvePort` (`config.ts:7-12`) does not validate: `CALC_SERVICE_PORT=abc` → `NaN` → `start` rejects loudly; `CALC_SERVICE_PORT=` (empty) → port `0` → an OS-chosen port, now reported honestly (review-slice-3 F-1). AC-15 covers absent and set-to-a-port only.
- `app.onError` logs nothing on the 500 path; an unexpected failure is visible only as the response. No criterion asks for operator logging.
- The `CLAUDE.md` text captured in this reviewer's launch context was a slice-1 snapshot; on disk `CLAUDE.md` is a symlink to `AGENTS.md`, which the diff brings level with the tree (`AGENTS.md:7`, `:35-41`, `:49-50`, `:54`).

## Lens summary

| Lens | Result |
| --- | --- |
| `[code]` scope & tests | 19/19 criteria test-mapped; 1/1 `refactor:` landed with its `preserves:` pinned and verified; nothing past the spec |
| `[arch]` architecture & dependencies | layering intact; every dependency entry ruled, all accepted; no patches, no lifecycle scripts, no major jumps; compatibility N/A |
| `[perf]` | N/A in substance; checked, nothing to raise |
| `[security]` | body boundary reviewed; no injection, leak, traversal or teardown gap |
