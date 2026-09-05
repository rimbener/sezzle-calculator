# dod — p4-calculator-api-client

## Verdict

**PASS** -> .awc/tasks/in-progress/p4-calculator-api-client/tmp/dod.md

## Objective checks re-run

- `npx turbo run lint check-types test --output-logs=errors-only` (the invocation's exact Commands) — **15/15 tasks successful** (5 workspaces × lint/check-types/test). All cached (`FULL TURBO`) against a clean working tree (`git status --porcelain` empty), so the cache key hashes exactly this code. The npm `EBADDEVENGINES` warning is the one AGENTS.md documents as working-as-intended.
- No open blocker or major in the review trail: `review.md` verdict **APPROVED** with all three prior findings marked `[resolved]` (`review-verdict.md: APPROVED`; slice-2 F1/F2 and slice-3 F1 each have a recorded fix cycle in `tdd-2.md:17-20` / `tdd-3.md:22-24`). **No remaining minors** — nothing needs human acceptance in `spec.md`.

## Checklist

- [x] **Functionality** — every AC-1…AC-15 mapped to an existing, passing test (AC-1–6 `client.test.ts:34-129`; AC-7 `frontend-purity.test.ts:34-44`; AC-8 `useCalculate.test.ts:10`; AC-9 `App.test.tsx:17-61` incl. the unary-key case at :46; AC-11 `display.test.ts:28` + `Calculator.test.tsx:130,164`; AC-12 `App.test.tsx:72`; AC-13 `App.test.tsx:130`; AC-14 `scope-docs.test.ts:107-126`; AC-15 `scope-docs.test.ts:67-79`). All three subtasks record `refactor:` → "carries none"; no `preserves:` clause exists to pin. Error paths covered per the spec's four-row table.
- [x] **Conventions** — app's flat ESLint style holds (no semicolons, single quotes in the new files); `frontend-purity.test.ts` scan (one named exception `api/client.ts`) green, so no component calls `fetch` and no other file references the env var; one typed client module per FE-7, no split; no hand-written `useMemo` (`useCalculate.ts:5-6`).
- [x] **Architecture & dependencies** — diff (`5041d4b..HEAD`) touches exactly the spec's Surfaces-touched set: `packages/contracts`, `packages/ui`, `calc-service`, `api-gateway`, the reducer and key model all untouched; manifest/lockfile/`.npmrc`/`patches` diff vs `main` is **empty** (verified this run), matching `review.md`'s "no dependency change" — nothing to name.
- [x] **User surface** — README rewritten and pinned green by `scope-docs.test.ts:107-126` (client+hook, `VITE_GATEWAY_URL` defaulting to `http://localhost:3000`, busy + the four messages, no "dead end"); `AGENTS.md:7` corrected (SPA calls the gateway through `src/api/client.ts` + `useCalculate`, only network call the one `POST /api/v1/calculate`) and pinned by `scope-docs.test.ts:67-79`. Busy projection is the one reserved line (`display.ts:43`).
- [x] **Security** — URL is config + static path (`client.ts:89`), body rebuilt from typed fields only (`client.ts:97`); every reply passes `@repo/contracts` schemas before use (`client.ts:72-85`); the blanket catch resolves a fixed code-owned message (`client.ts:101-103`) and AC-12 asserts exact messages reach the display; no secrets anywhere, no timers/handles to clean up.
- [x] **Testing rigor** — every AC traceable to a test in `tdd-1.md`/`tdd-2.md`/`tdd-3.md` maps; mapped test names verified to exist in the files this run. Slice-2 F2's missing unary case now present and green.
- [x] **Observability & docs** — reducer/state machine untouched (busy lands only through the reserved projection); docs updated in the same diff as the behavior and pinned by the suite (green).

## Notes

- The AC-10/AC-15 **build** leg is not in this invocation's Commands (which cover lint/check-types/test only), so it was not re-run here; its evidence is the recorded run at the fix steps — `tdd-2.md:7` (build 1/1) and `tdd-3.md:9` (16/16 with build, fresh) — actual run records, not inspection, matching the protocol's bar for resolved findings. `review.md` likewise records 16/16 with build and defers re-running to CI.
- No check was denied or blocked; no finding was resolved by inspection alone.
