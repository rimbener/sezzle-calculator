# review — p4-calculator-api-client (full-review)

- **mode:** full-review (all four lenses, one pass)
- **base:** `main`
- **verdict:** **APPROVED**
- **suite:** no red anywhere in the trail — slice gates recorded green in `tdd-1.md`/`tdd-2.md`/`tdd-3.md`, the two build-leg gaps (slice-2 F1, slice-3 F1) fixed and re-recorded as 16/16 with `build` included. Not re-run here per protocol; CI gates the suites separately.

## Trail

- Diff base: `main`. As the slice reviews already noted, `main` is not an ancestor of this branch (merge-base `5041d4b`; main advanced), so the `main..HEAD` range carries base-divergence noise: the `.claude`/`.codex` command and skill files. Verified this round: those changes are commits on `main` itself (`0be9791`, `f42ac3f` — `git log main --not HEAD -- .claude .codex`), nothing authored on this branch. No finding carried; the review targets the task's own work.
- The task's own diff (commits `5d7e53c`…`68d7b0f` plus the working tree) touches exactly the spec's "Surfaces touched" table and the `.awc` trail bookkeeping — nothing outside it.
- Slice reviews on record: slice 1 APPROVED (no findings), slice 2 CHANGES_REQUESTED (F1 build-leg, F2 unary-key coverage — both `[resolved]` in `tdd-2.md:17-20`), slice 3 CHANGES_REQUESTED (F1 build-leg — `[resolved]` in `tdd-3.md:22-24`). Nothing re-litigated; all three fixes verified below, not by inspection alone where a record exists.

## Lens [code] — scope, criteria → tests

Every AC maps to ≥ 1 concrete test present in the diff; `tdd-1/2/3.md` maps match real test names:

- AC-1 → `client.test.ts:35-46` (one POST, JSON content type, contract body, 200 → `{ result }` strict-equal); AC-2 → `client.test.ts:49-60` (it.each over the three domain codes, envelope relayed unchanged); AC-3 → `client.test.ts:62-71` (502/504 with both gateway outage messages → `OUTAGE_MESSAGE`); AC-4 → `client.test.ts:73-81` (rejecting fetch resolves, never rejects, with `NETWORK_MESSAGE`); AC-5 → `client.test.ts:83-108` (nine stray replies + non-JSON bodies); AC-6 → `client.test.ts:110-129` (default pinned `http://localhost:3000`, override wins, resolved var names the called URL); AC-7 → `frontend-purity.test.ts:34-44` (fetch scan allows exactly `api/client.ts`; env-var scan the same — exception pattern follows the existing `Number(`/reducer one, `FORBIDDEN` not loosened generally).
- AC-8 → `useCalculate.test.ts` (shape typed against `NonNullable<CalculatorProps['onRequest']>`); AC-9 → `App.test.tsx:17-61` (full `=` sequence **and** the unary case — slice-2 F2's fix — each asserting exactly one POST with the right body and the mocked result shown); AC-10 → `tdd-2.md:7` gate now `lint check-types test build` — 16/16.
- AC-11 → `display.test.ts:28-41` (pending → `'busy'`, it.add/sqrt/percentage) + `Calculator.test.tsx` (`displayState()` busy assertions; the second-`=` freeze keeps `onRequest` at exactly 1); AC-12 → `App.test.tsx:72-128` (one end-to-end case per row of the spec's error-contract table, exact message in the value slot over the failed calculation, `sc-display--error`); AC-13 → `App.test.tsx:130-246` (digit/decimal after each of the four errors, `C` from error and from result); AC-14 → `scope-docs.test.ts:107-126` (client+hook, env var+default, busy+four messages, no "dead end"); AC-15 → `scope-docs.test.ts:67-79` + `tdd-3.md:9` gate 16/16 with build.
- `refactor:` — all three subtasks record "carries none; nothing to pin" (`tdd-1.md` implicitly, `tdd-2.md:15`, `tdd-3.md:20`); no `preserves:` clause exists to rule on, and the diff contains no behavior-preserving move the subtasks didn't declare.
- Message strings verified byte-for-byte against `spec.md`'s error-contract table and the PRD quotes (FE-4 outage wording, UC-8 `docs/PRD-P0.md:209`), em-dashes and trailing periods included.
- No finding.

## Lens [arch] — layering, dependencies, compatibility

- Documented layering respected: all seven operations stay in calc-service (untouched); the SPA holds no calc-service URL; the only network call is the client's one `POST /api/v1/calculate`; the gateway is untouched; `packages/contracts` untouched — classification reuses its schemas and existing codes (`SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`), no new code invented.
- The locked `onRequest` prop seam is used as designed, not bypassed (`App.tsx:6-8`); `Calculator.tsx` and the reducer/key model untouched (spec non-goal held — `display.ts` changes only the one reserved `pending`→`busy` line, `display.ts:43`).
- No new dependency, abstraction, indirection, or config surface: `apps/sezzle-calculator/package.json` is byte-identical to main (`@repo/contracts` and `@repo/ui` pre-existing); **no manifest, lockfile, or patch change anywhere in the diff — no dependency change**; nothing patched or vendored. The client-module-without-config-split and no-client-timeout choices are recorded spec decisions, not unreviewed additions.
- Compatibility: no persisted state or schema change; the projection's `'busy'` value is already a valid `DisplayState` in the untouched `@repo/ui` (`display.tsx:4`), and `packages/ui/src/styles/components.css:335` already styles it — no silent breakage of existing data or in-flight work.
- No finding.

## Lens [perf]

- One fetch per request, asserted `toHaveBeenCalledTimes(1)` in both wired AC-9 cases. The one real serialization hazard — `useCalculate` building a fresh client per render and the effect re-firing on identity change mid-pending — is structurally closed: `Calculator.tsx:22-28`'s `sent` ref short-circuits any re-run (StrictMode replay included), so no double POST regardless of the compiler's memoization.
- Single `response.text()` read per reply; no busy-wait, no unbounded buffering, no timers/handles to tear down; nothing heavy on paths that don't need it. No finding.

## Lens [security]

Trust boundaries the diff touches: the outbound `fetch` and the inbound reply.

- Injection: none — the URL is config (`VITE_GATEWAY_URL`/dev default) + a static path, never user input; the body is `JSON.stringify` of typed fields rebuilt explicitly (`client.ts:100-104`), so extra caller keys never reach the gateway.
- Untrusted reply handling: every reply is parsed and run through `@repo/contracts`' schemas before use; only schema-validated envelopes reach the UI; no raw exception reaches the display (AC-12 asserts the exact message); the blanket `catch` at `client.ts:106` is the spec'd never-reject contract (AC-4), not error hiding — it resolves a fixed, code-owned message.
- Sensitive data: no secrets in URLs, logs, argv, or committed files; the env var carries only a URL. Path traversal and process lifecycle: N/A — no filesystem paths from user input, no spawned processes; the response body is fully consumed via `text()`.

No finding.

## Dependency diff

**No dependency change** — no `package.json`, lockfile, `.npmrc`, or `patches/` entry anywhere in `main..HEAD`; `apps/sezzle-calculator/package.json` verified byte-identical. Nothing to rule on beyond "accepted as none".

## Prior findings carried

- slice-2 F1 (AC-10 build leg) — `[resolved]`: `tdd-2.md:7` records the 16/16 gate with `build`.
- slice-2 F2 (unary-key end-to-end) — `[resolved]`: `App.test.tsx:45-61`, green on first run per `tdd-2.md:19`.
- slice-3 F1 (AC-15 build leg) — `[resolved]`: `tdd-3.md:9` records the 16/16 gate with `build`.
- None reopened.
