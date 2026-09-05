# tdd-1 — slice 1, the shared contract (subtask-1)

Verification: `npx turbo run lint check-types test --output-logs=errors-only` — 12/12 green at the slice gate.

## Criterion → test

| Criterion | Test |
| --- | --- |
| AC-1 — `SERVICE_UNAVAILABLE` joins the codes | `packages/contracts/src/errors.test.ts` › "defines exactly the six error codes" |
| AC-1 — the two exact sentences | `packages/contracts/src/errors.test.ts` › "fixes the two SERVICE_UNAVAILABLE sentences (p2 AC-1)" |
| AC-2 — `{ result: <finite number> }`, extra key dropped, NaN/Infinity/missing/wrong type/null/non-object rejected | `packages/contracts/src/calculate.test.ts` › "calculateResponseSchema — parsing a downstream reply (p2 AC-2)" |
| AC-2 — the envelope with a known code, extra keys dropped, unknown code/missing field/wrong type/null/non-object rejected | `packages/contracts/src/errors.test.ts` › "errorResponseSchema — parsing a downstream envelope (p2 AC-2)" |
| AC-3 — every code has the spec's status, exhaustive over `ErrorCode`, statuses are literal types | `packages/contracts/src/errors.test.ts` › "STATUS_BY_CODE — each code's default status (p2 AC-3)" |
| AC-3 — the only such map in the repo | `apps/calc-service/src/status-map.test.ts` › "is declared in the contract and nowhere else" |
| barrel — the new exports reach `@repo/contracts` | `packages/contracts/src/index.test.ts` › "exports the whole contract from one entry point" |
| AC-4 — nothing regresses | calc-service's existing suite unchanged and green (13 files → 14 with the scan, 90 tests); root lint / check-types / test green; root `README.md`, `apps/sezzle-calculator`, `packages/ui` untouched |

refactor:subtask-1 → `apps/calc-service/src/app.test.ts` (existing) — pins the exact status, code and message of every response calc-service returns (success, every 400, the 422s, the 500), so the `preserves:` clause was already exercised; no new characterization test written. The move (calc-service imports `STATUS_BY_CODE`, drops its local map and the `hono/utils/http-status` import) landed as the GREEN of cycle 6, whose RED test named `apps/calc-service/src/app.ts` as the stray declarer.

## Cycles

1. RED errors.test.ts six codes + two sentences → GREEN `SERVICE_UNAVAILABLE` in `ERROR_CODES`, `SERVICE_UNREACHABLE_MESSAGE` / `SERVICE_TIMEOUT_MESSAGE` in messages.ts, `ERROR_MESSAGES` excludes the new code; check-types then demanded a `SERVICE_UNAVAILABLE: 502` entry in calc-service's local map (removed again in cycle 6) and `CalculationErrorCode` excluding the new code (`apps/calc-service/src/calculation-error.ts`, off the subtask's path list — type-only, the domain never raises it).
2. RED calculate.test.ts `calculateResponseSchema` → GREEN `z.object({ result: z.number() })`, `CalculateResponse` inferred from it.
3. RED errors.test.ts `errorResponseSchema` → GREEN `z.object({ error: { code: z.enum(codes), message: z.string() } })`, `ErrorResponse` inferred from it.
4. RED errors.test.ts `STATUS_BY_CODE` values + literal types → GREEN the `as const satisfies Record<ErrorCode, number>` literal in errors.ts.
5. RED index.test.ts barrel → GREEN index.ts exports `calculateResponseSchema`, `errorResponseSchema`, `STATUS_BY_CODE`, the two messages.
6. RED repo scan for a second `STATUS_BY_CODE` declaration (failed naming `apps/calc-service/src/app.ts`) → GREEN calc-service imports the contract's map (the refactor move). The scan first sat in errors.test.ts and broke `@repo/contracts`' check-types (no `@types/node` there); relocated unchanged to `apps/calc-service/src/status-map.test.ts` rather than adding Node types to the framework-free contract package.
7. Docs: `packages/contracts/README.md` and the two AGENTS.md entries (`@repo/contracts`: six codes, response schemas, `STATUS_BY_CODE`; `apps/calc-service`: imports the map, `status-map.test.ts`). Gate green.
