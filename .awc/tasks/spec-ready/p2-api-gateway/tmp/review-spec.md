# Spec review — p2-api-gateway

**Verdict: CHANGES_REQUESTED** (3 major, 6 minor) — all nine resolved by `fix-spec-findings`; see the `fix:` line under each.

Reviewed: `spec.md`, `acceptance-criteria.md`, `tmp/subtasks.md`, `tmp/subtask-1..5.md`,
against `tmp/user-story.md`, `tmp/spec-interview-log.md`, `docs/PRD-P0.md` (§4, §7.1, §8,
§9, §11), `docs/PRD-P1.md`, `docs/spec-phases.md` (phase 2), `AGENTS.md` (= `CLAUDE.md`),
the Phase 1 trail under `.awc/tasks/done/p1-contract-calc-service/`, and the tree as it
stands (`packages/contracts/src/*`, `apps/calc-service/src/*`, root `package.json`,
`turbo.json`).

What holds up, so the fix step does not re-open it: the approach is named with a
why-not line for each of six alternatives; the three P0-vs-P1 / undocumented-semantics
collisions the story flagged are recorded human decisions (`tmp/spec-interview-log.md`
1–5) and are not re-litigated here; no new third-party dependency is proposed; all 20
criteria are observable and each has exactly one owning subtask; the slices are vertical
and ordered (contract → client → surface); subtask `paths` are real locations consistent
with the repo's layering; the one behavior-preserving refactor (`STATUS_BY_CODE`) carries
a `refactor:` entry with a `preserves:` clause on the subtask whose behavior needs it,
with both sides of the move in `paths`; non-goals are present and match §11's phasing.

---

## F-1 — no subtask owns the `AGENTS.md` update this task's own diff falsifies — **major**

- Files: `spec.md` § Surfaces touched; `tmp/subtask-1.md`, `tmp/subtask-5.md` (`paths`).
- `AGENTS.md` (`CLAUDE.md` is a symlink to it) is named neither as touched nor as not
  touched, and appears in no subtask's `paths`. The slice makes at least six of its
  statements false: `AGENTS.md:7` ("the gateway is not built"); `:42` (the suites list —
  `apps/api-gateway/src/**/*.test.ts` would be a third); `:39` ("`@types/node` … in all
  three workspaces that depend on it" — a fourth); `:46` (the `@repo/contracts` entry:
  "the five error codes" becomes six, plus the response schemas and the status map);
  `:50` (the `apps/calc-service` entry says "one `STATUS_BY_CODE` table" lives in its
  `app.ts` — subtask-1 moves it); `:56` (the `@repo/eslint-config` consumers list);
  and § Monorepo layout has no `apps/api-gateway` entry at all.
- This is the docs-discipline rule, and Phase 1 set the precedent in this very repo:
  each of its three slice commits (`c868309`, `4287dc7`, `67d8a0f`) carries `AGENTS.md`,
  and its spec review raised the same omission as a major (`review-slice-1.md` F-3,
  noting "`CLAUDE.md` is agent guidance, not the README or the architecture write-up, so
  XC-2 does not defer it"). `spec.md`'s non-goals defer only the root `README.md` and the
  architecture write-up, which does not cover `AGENTS.md`.
- Resolves when: `AGENTS.md` appears in `spec.md` § Surfaces touched and in the `paths`
  of the subtask whose slice makes each statement false (the contract lines in slice 1,
  the gateway entry/suites/consumers lines in slice 3) — not as a trailing docs subtask.
- status: resolved
- fix: resolved — `spec.md` § Surfaces touched now carries an `AGENTS.md` row naming each falsified statement and the slice that owns it; `AGENTS.md` is in `tmp/subtask-1.md`'s `paths` (the `@repo/contracts` and `apps/calc-service` entries) and in `tmp/subtask-5.md`'s (the "gateway is not built" line, the new `apps/api-gateway` layout entry, the suites list, the `@types/node` count, the eslint-config consumers). No trailing docs subtask.

## F-2 — no criterion covers UC-7's recovery postcondition — **major**

- Files: `acceptance-criteria.md` AC-15; `tmp/subtask-4.md`.
- `tmp/user-story.md` § Acceptance criteria states "the gateway stays up, and restarting
  calc-service restores service without restarting the gateway"; PRD BE-6's acceptance
  and UC-7's postcondition say the same. AC-15 stops at the 502/504 mapping; AC-13 covers
  only that validation still answers with the downstream stopped; AC-9 covers recovery
  *within* one call (refused → retry → success), which is a different behaviour.
- Nothing in the bundle makes a later valid request succeeding after an outage
  observable — i.e. that the gateway caches no failure and opens no circuit. It is the
  one thing UC-7 asks a reviewer to check by hand, and it is the cheapest test in the
  slice (Phase 1 has the analogue at `apps/calc-service/src/app.test.ts:197-201`).
- Resolves when: AC-15 gains that behaviour, or a new criterion owned by subtask-4 does,
  worded observably (a valid request after two 502s succeeds once the fake answers, with
  no restart).
- status: resolved
- fix: resolved — new **AC-21** in `acceptance-criteria.md`, owned by subtask-4: after consecutive 502s from a refusing downstream, the next valid request returns 200 once the downstream answers, with no gateway restart and no cached failure. `tmp/subtask-4.md` states the test (one app instance, three requests, nothing reset between them) and `tmp/subtasks.md` lists AC-21 against subtask-4.

## F-3 — `tmp/subtask-5.md` contradicts itself, and `spec.md` § Approach, on the server test's downstream — **major**

- File: `tmp/subtask-5.md`; criterion AC-18.
- Two sentences apart it says "The real client is constructed here from the resolved
  config and global `fetch` — the one place production wiring is assembled" and "The
  downstream stays faked — no calc-service process is started". As written `start(env)`
  exposes no seam for a fake, and `spec.md` § Approach explicitly rejects the remaining
  route ("no ports, no patched globals"; the discarded alternative "Stub
  `globalThis.fetch` in tests"). Phase 1's `server.test.ts` also spawns `node
  src/server.ts` as a child process for the announce (AC-18 requires it), where nothing
  in-process can be faked at all.
- AC-18 requires the service to *answer* `POST /api/v1/calculate` on the bound port, so
  what it answers with no downstream is load-bearing, not incidental.
- Resolves when: the subtask says which it is — assert the 502 an unreachable downstream
  produces (no fake needed, and it doubles as an end-to-end check of F-2's path), point
  `CALC_SERVICE_URL` at a stub the test binds, or give `start` the same injection seam
  `createApp` has — and the sentence that contradicts it goes.
- status: resolved
- fix: resolved — `tmp/subtask-5.md` now says which it is: **no fake anywhere**. The test points `CALC_SERVICE_URL` at a port nothing is listening on and asserts the 400 (no downstream needed) and the 502 (~100 ms, refusal plus one retry) the real wiring produces, with `CALC_SERVICE_TIMEOUT_MS` set small; the contradicting sentence is gone. **AC-18** is reworded to match, naming the unreachable downstream and what the service answers with it.

## F-4 — the moved `STATUS_BY_CODE` has no stated type, and both obvious answers are wrong — **minor**

- Files: `tmp/subtask-1.md` (the `refactor:` entry and the AC-3 bullet); `spec.md`
  § Surfaces touched, § Error contract.
- Today `apps/calc-service/src/app.ts:18` types it
  `Readonly<Record<ErrorCode, ContentfulStatusCode>>`, importing that type from
  `hono/utils/http-status`, and `fail` hands the looked-up value straight to `c.json`.
  subtask-1 promises calc-service's "own `fail` and route code are untouched". Neither
  file says how the type survives the move: importing the Hono type puts a framework
  dependency in `@repo/contracts` — the package `apps/sezzle-calculator` will import in
  Phase 4, and precisely what `spec.md` § Approach refuses for the shared `fail`
  ("framework-shaped code in the framework-free contract package") — while widening to
  `number` breaks `c.json`'s literal-union parameter and fails `check-types`.
- Resolves when: subtask-1 states the representation (e.g. the object literal declared
  `as const` so the statuses stay literal types, no `hono` import in the contract) and
  confirms `@repo/contracts`' dependencies stay `zod` only.
- status: resolved
- fix: resolved — `tmp/subtask-1.md` states the representation: a plain object literal declared `as const satisfies Record<ErrorCode, number>`, so the statuses stay literal types that satisfy Hono's `ContentfulStatusCode` at calc-service's `c.json` while the map stays exhaustive, with no `hono` import in the contract and `@repo/contracts`' dependencies still `zod` alone. `spec.md` § Error contract restates it in one clause.

## F-5 — the deadline expiring during the retry pause is unclassified — **minor**

- Files: `spec.md` § The downstream call (the outcome table); `acceptance-criteria.md`
  AC-9, AC-10.
- The table pairs "connection refused twice → 502" with "deadline reached with no answer
  → 504", and AC-10 says the budget "covers the whole call including a retry". The case
  where attempt 1 is refused and the shared budget expires during the ~100 ms pause or
  mid-attempt-2 satisfies neither row cleanly; 502 `unreachable` and 504 `timeout` are
  both consistent with the criteria as written. It is reachable in production with a
  small configured timeout and is exactly the kind of case subtask-3's fake-timer tests
  will land on.
- Resolves when: one row or one clause fixes it (a suggestion: a refusal already
  observed wins, so the answer is 502, and 504 is reserved for a call that only ever
  hung).
- status: resolved
- fix: resolved — `spec.md` § The downstream call splits the row in two: the deadline expiring after an attempt was refused is 502 (a refusal already observed wins), 504 is reserved for a call that only ever hung. AC-9 and AC-10 carry the same clause, and § Resolved decisions gains a row with its why.

## F-6 — slice 2 is not independently green for the root `dev` task — **minor**

- Files: `tmp/subtask-2.md` (`paths`: `apps/api-gateway/package.json`);
  `tmp/subtask-5.md`; `tmp/subtasks.md` ("Three vertical slices, each independently
  green").
- subtask-2 gives the new workspace "the same scripts (`dev`, `start`, …)" as
  calc-service's — `node --watch src/server.ts` and `node src/server.ts` — but
  `src/server.ts` is created in subtask-5, in slice 3. At the end of slice 2 the
  workspace is in the `apps/*` glob with a `dev` script pointing at a file that does not
  exist, so root `npm run dev` (a Turbo task over every workspace) fails for it. `lint`,
  `check-types`, `test` and `build` are unaffected.
- Resolves when: the two entry-point scripts land in subtask-5 with the file, or slice 2
  says plainly that they are declared ahead of their entry point and that root `dev` is
  green only from slice 3 — AC-20's `npm run dev` clause is subtask-5's either way.
- status: resolved
- fix: resolved — `tmp/subtask-2.md` declares only `lint`, `check-types`, `test` and `test:watch`; `dev` and `start` land in `tmp/subtask-5.md` with `src/server.ts`, whose `paths` now include `apps/api-gateway/package.json`. Root `dev` is therefore never pointed at a missing file, and AC-20's `npm run dev` clause stays subtask-5's.

## F-7 — a `paths` glob where every other entry is a file — **minor**

- File: `tmp/subtask-1.md`, `paths: … packages/contracts/src/*.test.ts …`.
- Downstream slice review reads scope from `paths`; a glob admits every existing suite
  in the package, including `turbo-tasks.test.ts`, which this task has no business
  touching. Every other subtask names files.
- Resolves when: the test files are named (the codes/messages suite, the response-schema
  suite, the status-map suite and `index.test.ts` for the new exports).
- status: resolved
- fix: resolved — the glob is replaced by the three files this task touches: `packages/contracts/src/errors.test.ts` (the code, its two messages, the status map), `packages/contracts/src/calculate.test.ts` (the response schemas) and `packages/contracts/src/index.test.ts` (the barrel's new exports). `turbo-tasks.test.ts` and `operations.test.ts` are out of scope.

## F-8 — the P1-into-P0 collision (BE-13) is recorded only as a parenthetical — **minor**

- File: `spec.md` § Configuration (`CALC_SERVICE_TIMEOUT_MS` row) and § Resolved
  decisions.
- `CLAUDE.md` ("Do not build P1 items before P0 is done") and `docs/PRD-P1.md` § Scope
  ("Build P1 items only after all P0 items are done") are locked; pulling BE-13 forward
  collides with both. It *is* a recorded human decision (`tmp/user-story.md` § Context,
  third bullet), so the collision is settled and is not a blocker — but `spec.md` carries
  it only as "(BE-13, pulled into P0 — `tmp/user-story.md`)" inside a table cell, and
  § Resolved decisions, the table the code workflow reads decisions from, has no row for
  it. The other two calls from the same interview (the retry, the unrecognisable-answer
  rule) each got their own row.
- Resolves when: § Resolved decisions gains a row naming BE-13, that the human made the
  call, and why (BE-6's ~3s acceptance still holds; the 504 path becomes testable without
  three real seconds).
- status: resolved
- fix: resolved — `spec.md` § Resolved decisions gains a row for `CALC_SERVICE_TIMEOUT_MS`: the human made the call (`tmp/user-story.md` § Context), `docs/spec-phases.md` already calls the timeout env-configurable, BE-6's ~3s acceptance still holds because the default is 3000, and the 504 path becomes testable without three real seconds.

## F-9 — AC-2 does not say what an extra key does — **minor**

- File: `acceptance-criteria.md` AC-2.
- The criterion enumerates the rejections exhaustively — `NaN`, `Infinity`, a missing
  field, a wrong type, a null body, an unknown code, a non-object body — and omits an
  unrecognised key: `{"result": 5, "junk": 1}`, or an envelope with a third field. Zod's
  default (strip and accept) and the spec's own posture at the public edge ("junk fields
  die at the public edge", `spec.md` § Resolved decisions) point opposite ways, and
  AC-16's "no extra fields on either" is about what the gateway *emits*. A test writer
  has to guess, and the answer decides whether such a reply is a 200 or a 502 (AC-8).
- Resolves when: AC-2 names the case in whichever direction the spec wants it.
- status: resolved
- fix: resolved — AC-2 names the case in the accepting direction: an unrecognised key is dropped, so `{ "result": 5, "junk": 1 }` is a valid result of 5 and an envelope with a third field parses too. `spec.md` § The downstream call states the same rule and why it does not weaken AC-16, which governs what the gateway emits.
