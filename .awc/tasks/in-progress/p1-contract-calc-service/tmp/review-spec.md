# Spec review — p1-contract-calc-service

**Verdict: CHANGES_REQUESTED** (one round; findings below)

**Fix round 1 — all seven findings `resolved`.** Each is annotated in place with what changed. New criteria AC-17 (slice 2, subtask-3), AC-18 (slice 2, subtask-3) and AC-19 (slice 3, subtask-5) were added; AC-2, AC-5, AC-15 and AC-16 were amended; `spec.md`'s error contract, `tmp/subtasks.md` and `tmp/subtask-{1,2,3,5}.md` were updated to match.

Reviewed: `spec.md`, `acceptance-criteria.md` (plain format), `tmp/subtasks.md`,
`tmp/subtask-1..5.md`, against `tmp/user-story.md`, `docs/PRD-P0.md`,
`docs/REQUIREMENTS.md`, `docs/spec-phases.md`, `CLAUDE.md` and the repo as it
stands (`package.json`, `turbo.json`, `packages/ui`, `packages/eslint-config`,
`packages/typescript-config`, `apps/sezzle-calculator`). All bundle files
required by this step exist.

## What holds up

- **Scope** matches `docs/spec-phases.md` Phase 1 exactly — XC-1, XC-3, BE-4,
  BE-5, BE-8 plus the calc-service halves; gateway and frontend are named
  non-goals, and nothing beyond the request is pulled in.
- **Approach** is named and defended with five ruled-out alternatives
  (`tsc` build, `tsx`, 7-way discriminated union, hand-rolled `node:http`
  adapter, `packages/` vs `services/` layout). Its load-bearing technical claim
  was re-verified independently for this review: a scratch npm workspace with
  `exports: { ".": "./src/index.ts" }`, imported by `node src/server.ts` from a
  sibling workspace on Node v24.20.0, runs and strips types across the
  `node_modules` symlink. The build-free choice is sound.
- **Locked-design fit**: no collision. Two services / no further split, IEEE-754
  doubles, 422-vs-400 split, the percentage formula and Vitest are all as the
  PRD fixes them; the internal route is correctly unversioned (PRD §9); CORS is
  correctly excluded (BE-10). The `turbo.json` `build.outputs` fix, the three
  new dependencies (`hono`, `zod`, `@hono/node-server`), `CALC_SERVICE_PORT`,
  the workspace placement and the new `INTERNAL_ERROR` code are each a recorded
  human decision in `tmp/spec-interview-log.md` (entries 1, 2, 4, 6, 7) — not
  re-opened here.
- **Traceability**: AC-1..AC-16 each have exactly one owning subtask, all five
  subtasks carry criteria, and every story acceptance bullet maps onto a
  criterion except the one noted in finding 6.
- **Refactor discipline**: the single refactor this slice takes on
  (`turbo.json` outputs) appears as a well-formed `refactor: … — preserves: …`
  entry on subtask-1 with `turbo.json` in that subtask's `paths`.

## Findings

### 1. subtask-1 cannot pass its own gate — `major` — resolved

**Resolved.** `tmp/subtask-1.md` now uses the existing convention verbatim — `lint` = `eslint . --max-warnings 0`, `check-types` = `tsc --noEmit`, `test` = `vitest run --passWithNoTests` — and creates `packages/contracts/src/index.ts` (an empty barrel subtask-2 fills), which is now in its `paths`. TS18003 and the no-test-files exit are both closed, so AC-5 is checkable at this subtask's boundary; the subtask says so explicitly.

`tmp/subtask-1.md` declares scripts `check-types` (`tsc --noEmit`) and `test`
(`vitest run`), lists no file under `packages/contracts/src/` in its `paths`
(the first source file, `src/index.ts`, arrives in subtask-2), and then states
"AC-5 is this subtask's gate: root `lint`, `check-types`, `test` and `build`
all pass". As specified those two commands fail on an empty package: `vitest
run` exits non-zero with no test files unless `--passWithNoTests`, and
`tsc --noEmit` over a tsconfig whose `include` is `["src"]` with no inputs is
TS18003. Both existing workspaces avoid exactly this by using
`vitest run --passWithNoTests` (`packages/ui`, `apps/sezzle-calculator`), a
convention subtask-1 silently departs from. Either match the existing script
form (and create the `src/` entry point in subtask-1), or move AC-5's gate to
the slice-1 boundary rather than asserting it at subtask-1.

### 2. Slice 2 is not independently green — `major` — resolved

**Resolved.** `dev` and `start` moved to `tmp/subtask-5.md`, the subtask that supplies `src/server.ts`; `tmp/subtask-3.md` now states that the workspace deliberately declares neither, so nothing in the root `dev` fan-out names a missing file. New **AC-17** re-runs AC-5's whole gate (`lint`, `check-types`, `test`, `build`, plus a clean root `dev`) at the slice-2 boundary, owned by subtask-3.

`tmp/subtask-3.md` creates `apps/calc-service/package.json` with
`dev` = `node --watch src/server.ts` and `start` = `node src/server.ts`, but
`src/server.ts` is not written until subtask-5 (slice 3) and `src/app.ts` not
until subtask-4. At the slice-2 boundary the root `dev` task — `turbo run dev`
fans out to every workspace declaring one — invokes a script whose entry file
does not exist, so the repo is left in a state slice 2 claims is green
("slice 2 with a tested calculation domain", `tmp/subtasks.md`). Compounding
it, AC-5 (the repo-wide "nothing regresses" gate) is owned solely by
subtask-1, so no criterion re-checks the root task fan-out after
`apps/calc-service` — a second workspace with `lint`, `check-types`, `test` and
`dev` — joins it. Declare `dev`/`start` in the subtask that supplies
`src/server.ts`, or land a minimal server entry in slice 2.

### 3. No defined 400 message for a missing or non-string `operation` — `major` — resolved

**Resolved.** `spec.md`'s error-contract table is now case-keyed and splits the row: a string naming none of the seven keeps `unknown operation 'foo'`; an absent, `null`, or non-string `operation` gets its own constant, `operation must be one of: add, subtract, multiply, divide, power, sqrt, percentage`. Three stated rules follow the table — only a supplied string operation is ever interpolated, the operand noun agrees with the count, and the operation is validated before the operands (so a doubly-wrong request gets the operation's message). AC-2 restates all of it; a resolved-decision row carries the why. Wording is the spec step's call per `tmp/user-story.md` Notes, so this needed no re-interview.

`acceptance-criteria.md` AC-2 groups "an unknown **or missing** operation" under
one exact message, `unknown operation 'foo'`, and `spec.md`'s error-contract
table lists that same single row for the case. The sentence presupposes a name
to quote; when `operation` is absent, `null`, or not a string there is none, so
the criterion is not testable as written for the case it explicitly names (the
story lists "missing fields" among the 400s, and `spec.md` promises "every
message a test asserts exactly"). Fix `spec.md`'s table and AC-2 together —
either a distinct sentence for the missing/non-string case, or a stated rule for
what gets quoted. The choice propagates: the gateway inherits these constants in
Phase 2.

### 4. `spec.md`'s message table omits the singular form AC-2 requires — `minor` — resolved

**Resolved.** The table now carries `operation 'sqrt' requires exactly 1 finite operand` as its own row, and the second rule beneath it states the agreement explicitly (`operands` at 2, `operand` at 1, the count taken from `OPERAND_COUNT`). `tmp/subtask-2.md`'s messages bullet points at those rules.

`acceptance-criteria.md` AC-2 requires `operation 'sqrt' requires exactly 1
finite operand` — singular noun — and `tmp/spec-interview-log.md` entry 3
records the human agreeing that wording. `spec.md`'s error-contract row shows
only `operation 'add' requires exactly 2 finite operands` with the parenthetical
"(the operation's real count — 1 for `sqrt`)" and says nothing about the noun.
Since `spec.md` is where the message strings are fixed and subtask-2 builds them
from it, the singular rule should be stated there too.

### 5. AC-15's "listens on" is never exercised — `minor` — resolved

**Resolved.** AC-15 is narrowed to port *resolution*, and new **AC-19** covers the binding: started with `CALC_SERVICE_PORT` set to a free port, the service answers `POST /calculate` on that port and releases it when stopped. `tmp/subtask-5.md` makes it testable by exporting a `start(env)` from `server.ts` that binds only when called, adds `src/server.test.ts` to its `paths`, and keeps the 3001 default a `config.test.ts` assertion so no test binds a port a dev server may hold.

`acceptance-criteria.md` AC-15 is stated as observable behaviour ("the service
listens on the port named by `CALC_SERVICE_PORT`; with no environment variable
set it listens on 3001"), but its owning subtask, `tmp/subtask-5.md`, tests only
`config.ts` as "a pure function of an environment object so it is testable
without starting anything" — and explicitly keeps `server.ts` out of any import
path that binds. Nothing in the bundle verifies that the resolved port is the
one the server actually binds. Either narrow AC-15 to port *resolution*, or give
subtask-5 a test that starts the server on a resolved port.

### 6. A story criterion has no owning acceptance criterion — `minor` — resolved

**Resolved.** AC-5 now ends: neither `apps/sezzle-calculator` nor `packages/ui` gains a dependency on `@repo/contracts`, on the calculation service, or on any gateway. AC-17 carries it forward to the slice-2 boundary by reference rather than restating it.

`tmp/user-story.md`'s final bullet requires that "nothing in this slice adds a
gateway or a frontend dependency on the calculation service". AC-5 carries the
rest of that bullet (build/lint/type-check/test, root `README.md` unchanged) but
not this half; it survives only as prose in `spec.md`'s "Not touched" row and
non-goals. Add it to AC-5 (or its own criterion) so it is checkable.

### 7. Slice 2 owns no docs update — `minor` — resolved

**Resolved.** New **AC-18** puts a minimal `apps/calc-service/README.md` in subtask-3 — what the service is, that it is internal and never browser-facing, and the one command that runs its tests (BE-11). AC-16 is reworded as the extension of that same file in subtask-5 (run command, `CALC_SERVICE_PORT`, `curl` example, percentage formula), so no slice closes with an undocumented workspace and no subtask is docs-only.

Docs discipline: slice 1 carries `packages/contracts/README.md` (AC-4, in
subtask-1) and slice 3 carries `apps/calc-service/README.md` (AC-16, in
subtask-5), but slice 2 stands up the whole `apps/calc-service` workspace — with
its own `test` command, which BE-11 requires to be *documented* — and ships no
README with it. Slice 3's docs are not a docs-only trailing subtask (subtask-5
also delivers the server entry and config), so this is not the "trailing update
the docs" failure, but slice 2 still closes with an undocumented new workspace.
A minimal README in subtask-3 (what it is, how to test it), extended by
subtask-5 with the run command, curl example and the percentage formula, closes
it.

## Not findings (recorded, so they are not re-raised)

- The `turbo.json` `build.outputs` fix riding this slice is `tmp/spec-interview-log.md`
  entry 4 — a recorded human decision, including its placement on the
  workspace-setup subtask. Not re-opened.
- `@hono/node-server` as a third direct dependency is entry 7; `hono` and `zod`
  are fixed by `docs/REQUIREMENTS.md`. No unjustified dependency.
- AC-9 states structural facts (registry lookup, tests importing no HTTP
  module). That is BE-8's own acceptance wording in `docs/PRD-P0.md`, and the
  reviewer is a named user (PRD §5), so it is not an implementation-detail
  finding.
- Slices 1 and 2 are layer-shaped rather than user-visible end-to-end slices.
  That is inherent to a backend-only phase whose HTTP surface is slice 3, and
  the story's own criteria are layered the same way; only the concrete
  greenness break in finding 2 is raised.
