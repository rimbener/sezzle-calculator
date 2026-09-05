# review-spec — p4-calculator-api-client

**Verdict: APPROVED**

## Method

Read `tmp/user-story.md`, `spec.md`, `acceptance-criteria.md`, `tmp/subtasks.md`,
`tmp/subtask-1.md`..`subtask-3.md`, `tmp/spec-interview-log.md`,
`tmp/story-interview-log.md`. Cross-checked every factual claim against the
live repo rather than trusting the bundle's prose:

- `apps/sezzle-calculator/src/calculator/state.ts`, `reducer.ts`, `display.ts`,
  `Calculator.tsx`, `App.tsx`, `App.test.tsx`, `keys.ts` — confirms the
  `onRequest` seam, the frozen `pending` status, `settle()`'s
  result/error mapping, and that `display.ts`'s `pending` case currently
  projects `idle` (the one line this spec changes to `busy`).
- `packages/ui/src/display.tsx` + `styles/components.css` — confirms
  `DisplayState` already has `"busy"` and the `steps(1,end)` blink animation
  already exists in `@repo/ui`, so nothing in `docs/spec-phases.md` Phase 4's
  "blinks with steps(1,end)" answer is unbuilt; this spec only has to flip
  the projection, matching its "Not touched: packages/ui" claim.
- `apps/api-gateway/src/calc-client.ts` + `config.ts` — confirms the
  "modeled one layer up" shape the Approach section claims, and confirms
  `SERVICE_UNAVAILABLE` is what the gateway sends for both `unreachable` and
  `timeout` reasons (502/504), matching the spec's "outage and
  network-failure share one code" table.
- `apps/api-gateway/src/app.ts` — confirms the gateway itself never emits
  `INTERNAL_ERROR`, so the "unexpected response" case in the client is
  genuinely a client-side catch-all, not a code path already tested downstream.
- `packages/contracts/src/errors.ts`, `calculate.ts` — confirms `INTERNAL_ERROR`
  and `SERVICE_UNAVAILABLE` are valid `ErrorCode` enum members (so the
  client's synthesized envelopes type-check against `ErrorResponse`) and that
  `calc-service`'s own `onError` catch-all (`apps/calc-service/src/app.ts`)
  really does reach for `INTERNAL_ERROR`, as the spec claims when justifying
  code reuse instead of a new code.
- `apps/sezzle-calculator/src/frontend-purity.test.ts`,
  `scope-docs.test.ts`, `README.md`, `AGENTS.md`, `docs/PRD-P0.md` (FE-2,
  FE-4, FE-5, FE-7, FE-8, UC-7, UC-8), `docs/spec-phases.md` Phase 4 — confirms
  every quoted message string, every FE/UC reference, and the current shape
  of the purity/docs tests the subtasks say they'll extend.
- `.awc/tasks/done/p3-calculator-ui/spec.md` — confirms the "dead end until
  Phase 4" and "`busy` deferred to Phase 4" claims are real, not fabricated,
  and that this bundle doesn't re-litigate anything p3 locked.

No blockers, no majors, no minors found that rise to a finding. Two points
considered and deliberately not raised as findings, recorded here so a future
reviewer doesn't have to re-derive them:

- **Env var name left as "e.g. `VITE_GATEWAY_URL`" in subtask-1 rather than
  fixed in `spec.md`'s Resolved decisions.** Considered as a minor (an
  implementation choice affecting what `AC-14`'s README documents, decided in
  a subtask rather than pinned in the spec proper). Not raised as a finding:
  AC-6 is testable regardless of the exact name chosen, subtask-1 gives a
  concrete, self-consistent example that satisfies the `VITE_`-prefix
  constraint it also correctly states, and the spec's "Resolved decisions"
  table is reserved for genuine either-way calls (message copy, timeout,
  code reuse) rather than every naming detail — this one has no real
  alternative reading once "same pattern as the two backend services" and
  "must be `VITE_`-prefixed" are both given.
- **README/AGENTS.md correction landing in subtask-3 (slice 3) rather than
  subtask-2 (slice 2), even though slice 2 is what first makes the frontend
  actually call the gateway.** Considered against the "docs discipline" bar
  (a trailing docs-only subtask is a major). Not raised: subtask-3 is not a
  docs-only trailing subtask — it ships its own real behavior (the
  `pending`→`busy` projection change) that the docs update is written to
  describe together with the client/hook/error messages as one coherent
  paragraph (AC-14 explicitly asks for the busy indicator and the four
  messages to be documented together). Splitting the README edit across two
  slices to narrate "now it calls the gateway" and then "now it also shows
  busy" would produce a briefly self-contradictory README (calling the
  gateway but not yet describing what happens while it's in flight) rather
  than avoid one.

## Traceability

- Every AC (1-15) has exactly one owning subtask; every subtask cites only
  ACs it owns; nothing orphaned.
- `spec.md`'s Approach names one chosen design with a "why" for each of five
  alternatives it weighs and declines — no unresolved alternative, no
  invented one.
- Two decisions in `tmp/spec-interview-log.md` (unexpected-response wording;
  no client-side timeout) both appear, correctly attributed, in `spec.md`'s
  Resolved decisions table.
- `spec.md`'s "Not touched" list (`packages/contracts`, `packages/ui`, the
  reducer, the key model) matches what the subtasks actually touch — no
  scope creep into locked P1/earlier-phase surfaces.
- All quoted strings (FE-4/UC-7/UC-8's outage and network messages, the
  interview's unexpected-response copy) are verbatim matches against
  `docs/PRD-P0.md` and the interview log — no paraphrase drift.

## Verdict

APPROVED — zero findings.
