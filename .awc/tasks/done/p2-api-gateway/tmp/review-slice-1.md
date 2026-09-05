# review-slice-1 — slice 1, the shared contract (subtask-1)

**Verdict: APPROVED**

Reviewed once against `Base: main` (commits and working tree), plus the one untracked file the slice added, `apps/calc-service/src/status-map.test.ts`. The only commit past `main` is `b8404db` (moving the `.awc` bundle from `spec-ready` to `in-progress`) — bookkeeping, no finding.

## Suite

`npx turbo run test --output-logs=errors-only` from the launch directory: `Tasks: 4 successful, 4 total` (replayed from Turbo's cache — the inputs it hashes, untracked `status-map.test.ts` included, are unchanged since the run that went green). Six packages in scope; `@repo/eslint-config` and `@repo/typescript-config` have no `test` script, as before. No failing test.

## Diff reviewed

`AGENTS.md`, `apps/calc-service/src/app.ts`, `apps/calc-service/src/calculation-error.ts`, `packages/contracts/README.md`, `packages/contracts/src/{calculate,errors,index,messages}.ts`, `packages/contracts/src/{calculate,errors,index}.test.ts`, new `apps/calc-service/src/status-map.test.ts`. 11 tracked files, +211/−38.

## Lens 1 — correctness against the contract

| Criterion | Test | Ruling |
| --- | --- | --- |
| AC-1 — `SERVICE_UNAVAILABLE` joins the codes; the two exact sentences | `packages/contracts/src/errors.test.ts:19` "defines exactly the six error codes" (value and `ErrorCode` union); `:55` "fixes the two SERVICE_UNAVAILABLE sentences" — both strings asserted verbatim | covered |
| AC-2 — result body | `packages/contracts/src/calculate.test.ts:144` — finite numbers accepted, `{ result: 5, junk: 1 }` parses to `{ result: 5 }`, `NaN`/`±Infinity`/missing/string/null result, null/number/string/array body and an error envelope all rejected | covered |
| AC-2 — error envelope | `packages/contracts/src/errors.test.ts:72` — every known code accepted, extra key at either level dropped, unknown/lower-case/missing code, missing/non-string message, null/string/missing `error`, null/string/array body and a result body all rejected | covered |
| AC-3 — statuses and exhaustiveness | `packages/contracts/src/errors.test.ts:124` — the six values the spec's § Error contract lists; `keyof typeof STATUS_BY_CODE` ≡ `ErrorCode`; literal `400` / `502` types | covered |
| AC-3 — the only such map in the repo | `apps/calc-service/src/status-map.test.ts:31` scans every `apps/*/src` and `packages/*/src` for a `const|let|var STATUS_BY_CODE` declaration and expects exactly `packages/contracts/src/errors.ts` | covered |
| barrel | `packages/contracts/src/index.test.ts:6` — the full export key set, the six new names included | covered |
| AC-4 — nothing regresses | `apps/calc-service/src/app.test.ts` unchanged (`git diff main` on it is empty) and green; the diff touches no `package.json`, so neither `apps/sezzle-calculator` nor `packages/ui` gains a dependency; root `README.md` untouched | covered by the suite I ran; see the note below on the other root tasks |

**`refactor:` entry** — "move `STATUS_BY_CODE` out of `apps/calc-service/src/app.ts` into `@repo/contracts` and import it back — preserves: every response calc-service returns today keeps its exact status, code and message". Present in the diff and exactly as named: `apps/calc-service/src/app.ts:6` imports the map, the local declaration (`:15-22` on `main`) and the `hono/utils/http-status` import are gone, `fail` at `app.ts:18-21` still indexes the same table by code; `packages/contracts/src/errors.ts:20-27` is the destination. Nothing past the entry: `fail`, `parseJson`, `createApp`, `onError` and the route are byte-identical apart from `fail`'s doc comment. `preserves:` clause — exercised by the suite I ran: `app.test.ts` pins status **and** `toStrictEqual` body (code + message) for the 200s, every 400 (`:90-113`), every 422 (`:155-157`) and the 500 (`:179-182`), and all pass. Green; the clause holds.

**Type-only knock-on outside the subtask's `paths` list** — `apps/calc-service/src/calculation-error.ts:6` adds `"SERVICE_UNAVAILABLE"` to the `Exclude<>` behind `CalculationErrorCode`. Forced, not creep: `ERROR_MESSAGES` (`messages.ts:10-12`) excludes the new code, so without the exclusion `ERROR_MESSAGES[code]` in the `CalculationError` constructor stops type-checking the moment the code joins `ErrorCode`. No runtime effect; the domain never raises it. Not a finding — noted so the record's path list is read as incomplete rather than the diff as over-reaching.

Nothing built ahead of a scenario: no gateway code, no `apps/api-gateway`, no 504 logic — the contract carries `502` as the default and the spec leaves 504 to the gateway's own path.

## Lens 2 — project conventions

- `@repo/contracts` stays framework-free: `errors.ts` imports only `zod`; `package.json` dependencies unchanged (`zod` alone). The `as const satisfies Record<ErrorCode, number>` spelling matches `spec.md` § Error contract and its reason (literal statuses for Hono's `c.json`, exhaustive over the codes, no framework type).
- The repo-wide scan sits in calc-service, not the contract package, so `@types/node` does not enter `packages/contracts` (tdd-1 cycle 6). It mirrors the shape of the existing `domain-purity.test.ts`. Acceptable placement: the criterion is repo-wide ("the only such map in the repo") and calc-service is the workspace that used to hold the duplicate.
- Style matches the files edited: `@repo/eslint-config` workspaces (semicolons, double quotes) throughout; `.ts` extensions on relative imports; `verbatimModuleSyntax`-style `type` imports kept.
- Layering intact: `app.ts` still only parses, calls and serialises; no arithmetic anywhere in the diff.

No finding.

## Lens 3 — user surface

**N/A for the HTTP surface** — calc-service's `POST /calculate` responses are unchanged (refactor `preserves:` clause above); no public route, CLI, config or UI is added in this slice. For the developer-facing package API, the new names follow the package's existing conventions: `SCREAMING_CASE` for constants (`STATUS_BY_CODE`, `SERVICE_UNREACHABLE_MESSAGE`, `SERVICE_TIMEOUT_MESSAGE` beside `INVALID_JSON_MESSAGE`), `camelCaseSchema` for schemas (`calculateResponseSchema`, `errorResponseSchema` beside `calculateRequestSchema`), and the two sentences are exactly the ones `spec.md` § Error contract and AC-1 spell out.

## Lens 4 — docs parity

In this slice's diff, as the spec's Surfaces table requires for slice 1:

- `packages/contracts/README.md:3-10` — now names both response schemas, "six error codes" and `STATUS_BY_CODE`. Matches the code.
- `AGENTS.md:50` (`@repo/contracts` entry) — response schemas, six codes, `STATUS_BY_CODE` with its declared shape and the `zod`-only dependency. Matches the code.
- `AGENTS.md:51` (`apps/calc-service` entry) — `STATUS_BY_CODE` "imported, not declared here", and `status-map.test.ts` described. Matches the code.

Checked for contradictions left behind: `AGENTS.md` § What this is still says the gateway is not built (true after slice 1); its tests sentence still lists `packages/contracts/src/*.test.ts` and `apps/calc-service/src/**/*.test.ts` (still the only suites); `apps/calc-service/README.md` never mentioned where the status table lives and remains accurate; the root `README.md` is untouched (AC-4). No stale statement found. Nothing deferred.

## Note on AC-4's other root tasks

`Commands:` named the test task only, so I ran that and nothing else. The build record (`tdd-1.md:3`) reports `lint check-types test` 12/12 green at the slice gate but does not name `npm run build`. The build cannot have moved — `build` exists only in `apps/sezzle-calculator/package.json`, and no file under `apps/sezzle-calculator` or `packages/ui` is in this diff — so this is not a finding; the task-level gate that runs all four root scripts should confirm it.

## Findings

None. All lenses pass; the suite is green; the `refactor:` entry is present, exactly scoped, and its `preserves:` clause is exercised by the unchanged `app.test.ts`.
