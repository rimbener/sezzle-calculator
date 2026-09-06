# review-slice-2 — Slice B — README (subtask-2)

- **Verdict:** APPROVED
- **Commands run:** `npx turbo run test --output-logs=errors-only` → 5 successful / 5 total (turbo cache valid for current inputs) — suite green.
- **Diff basis:** slice 1's `closing-commit: 25a2dce` (read from `tdd-1.md`). Diff = trail commit `2ee2b49` (the closing-commit bookkeeping record — no finding per protocol) + working tree: `README.md` (rewritten), `.nvmrc` (new), `tdd-2.md` (new record), `subtask-2.md`/`subtasks.md` (status flips). Nothing outside the slice's two specced paths (`README.md`, `.nvmrc`) plus records — no scope creep.
- **`refactor:` entries:** none exist for this task (per `subtasks.md`) — nothing to rule on.

## Lens findings

### Lens 1 — Correctness against the contract
No findings. Criteria AC-6/AC-7/AC-8 each carry a check in the build record's map, and the mechanical claims were re-verified against the tree:

- **AC-6** — `.nvmrc` is exactly `22.22.2`; root `engines.node` is `>=22.22.2`; root scripts exist for every command the README documents (`install`, `dev`, `test`, `test:watch`, `build`, `lint`, `check-types`, `format`); the `EBADDEVENGINES`/npm-major warning note is present and matches AGENTS.md's `devEngines` rationale; the Commands gate ran green as written.
- **AC-7** — architecture diagram present (SPA :5173 → api-gateway :3000 → calc-service :3001, HTTP-only, CORS to the SPA's origin, 3s deadline + one retry — all matching `apps/api-gateway/src/config.ts` defaults and AGENTS.md); assumptions/trade-offs section names all three required reasons (sync HTTP, static env-var config, one calc service); all five linked paths exist (`apps/api-gateway/README.md`, `apps/calc-service/README.md`, `apps/sezzle-calculator/README.md`, `packages/contracts/README.md`, `docs/PRD-P0.md`, `docs/PRD-P1.md`); the "Non-Goals table" reference resolves (PRD-P0 §3).
- **AC-8** — README walkthrough's curl commands target the real route (`POST /api/v1/calculate`, `apps/api-gateway/src/app.ts:26`) and its stated outcomes match the contract: arities 2/2/2/2/2/1/2 (`packages/contracts/src/operations.ts:17-23`), 400 `VALIDATION_ERROR` for `sqrt` with 2 operands, 422 for the three domain codes, non-finite result → `RESULT_NOT_FINITE` (`apps/calc-service/src/calculate.ts:15`), 502/504 `SERVICE_UNAVAILABLE`; UC-8's UI copy "Can't reach the calculation service — try again" matches the client's pinned string. The live walkthrough itself is the build record's claim, exercised per the subtask's own instruction.
- No missing `criterion → test` map entry; the map is complete for a docs-only slice.

### Lens 2 — Project conventions
No findings. Docs-only diff; no code, configs, or dependencies touched. The README documents only what AGENTS.md and the per-service READMEs already establish (dev/default ports, env vars, the seven operations, the error envelope) and adds nothing its design docs don't call for.

### Lens 3 — User surface
The README is this slice's user surface; verified rather than N/A. Every command, port, URL, status code, error code, and quoted UI message in it matches the code it describes (checks above). Markdown structure sound: 4 balanced code fences, diagram in its own block, turbo filter examples use real workspace names. No other user-facing surface touched.

### Lens 4 — Docs parity
No findings. The slice's deliverable is the docs update itself, and it is in the diff. No code behavior changed in this slice, so no other doc is owed an update; no contradiction found between the root README and the per-service READMEs or AGENTS.md.

## Findings table

| # | Lens | Severity | Location | Finding | Status |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | None. | — |
