# review-slice-1 — the gateway API client module

Verdict: **APPROVED** — no findings.

## Scope

Base `main` is not an ancestor of this branch (merge-base `5041d4b`; `main` has advanced). The diff `main..HEAD` therefore mixes base-divergence noise (`.claude`/`.codex` command and skill files) into the range. The slice's own work is unambiguous and that is what was reviewed: the one commit on this side, `5d7e53c` — pure `.awc` task-opening bookkeeping, twelve renames, no content change — plus the working tree, which touches exactly the subtask's three paths:

- `apps/sezzle-calculator/src/api/client.ts` (new, untracked)
- `apps/sezzle-calculator/src/api/client.test.ts` (new, untracked)
- `apps/sezzle-calculator/src/frontend-purity.test.ts` (modified)

The `.claude`/`.codex` entries are outside the slice's work (older-base divergence, not written by this slice) and carry no finding.

## Command result

`npx turbo run test --output-logs=errors-only` — 5 tasks successful, 5 total, all cache-verified (Turbo hash matches current inputs, so the green result is for exactly this code). No red.

## Lens 1 — correctness against the contract

Suite green; every AC has a concrete test, and `tdd-1.md`'s criterion → test map names match the real test names in the diff:

- AC-1 → `the request (AC-1)` — asserts one call, POST, JSON content type, `{ operation, operands }` body, 200 → `{ result: 3 }` strict-equal. Covered.
- AC-2 → it.each over the three domain codes at 422, echoed envelope strict-equal. Covered.
- AC-3 → it.each over 502 with the gateway's `SERVICE_UNREACHABLE_MESSAGE` and 504 with `SERVICE_TIMEOUT_MESSAGE`, resolving to `OUTAGE_MESSAGE`. Covered.
- AC-4 → rejecting fetch resolves (never rejects) with `NETWORK_MESSAGE`. Covered.
- AC-5 → it.each over nine stray replies (stray 400/500/503, schema-failing 200s, non-domain 422, wrong-code 502/504) plus non-JSON bodies at 200/422/502. Covered.
- AC-6 → default pinned to `http://localhost:3000`, override wins, and the client calls the URL the resolved variable names. Covered.
- AC-7 → `frontend-purity.test.ts` — the fetch scan expects exactly `[api/client.ts]`, and the env-var-name scan (importing `GATEWAY_URL_VARIABLE`, so the test file does not self-match) expects the same. The scan change follows the existing `Number(`/reducer exception pattern rather than loosening `FORBIDDEN` generally, as the subtask directed. Covered.

`refactor:` — subtask-1 carries none; nothing to check. No behaviour ahead of a scenario; the diff adds nothing the subtask does not name. The AC-3/AC-4/AC-5 message strings match the acceptance-criteria table byte-for-byte, including the em-dashes and trailing periods.

## Lens 2 — project conventions

- One typed module (FE-7, spec Approach): config resolution, the fetch call and classification together in `client.ts`. No split.
- No arithmetic and no other `fetch` in the frontend — the purity scan is green over app and `@repo/ui` sources.
- Classification uses the contracts' own `calculateResponseSchema`/`errorResponseSchema`; no new error code, no second `STATUS_BY_CODE`, `packages/contracts` untouched.
- No client-side timeout or retry — the spec's declined alternative is genuinely absent.
- Style matches the app's flat ESLint config (no semicolons, single quotes) and the app's extensionless relative-import norm; the factory-with-injectable-fetch shape mirrors `apps/api-gateway/src/calc-client.ts` as the subtask directed.
- Nothing added beyond the approved spec's surfaces; non-goals (reducer, keys, display, contracts) are untouched in this slice.

## Lens 3 — user surface

No rendered surface yet (the hook, wiring and display states are slices 2–3). The surface this slice does add is config + error copy: `VITE_GATEWAY_URL` is the name the subtask's named family pointed at, and the three user-facing messages are the spec's exact quotes (verified against `docs/PRD-P0.md` FE-4 and UC-8 wording). Conforms.

## Lens 4 — docs parity

No behaviour change beyond adding a module nothing calls yet — no existing documented behaviour contradicted. The README and `AGENTS.md` updates are slice 3's owned criteria (AC-14, AC-15) per the approved spec's surfaces table. No deferred docs within this slice.
