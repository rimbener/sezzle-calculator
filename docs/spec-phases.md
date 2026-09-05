# Spec phases — PRD-P0 through `prd-to-spec`

How `docs/PRD-P0.md` gets turned into approved spec bundles: **five runs of
[`workflows/prd-to-spec/prd-to-spec.yaml`](../workflows/prd-to-spec/prd-to-spec.yaml)**, one per phase, in
the order below. Each run takes a task id and the requirement ids it covers,
interviews you twice (story, then spec), and lands two commits on the current
branch plus a bundle under `.awc/tasks/done/<task>/`.

The order follows §11 of the PRD, with §11's single frontend phase split in
two — the UI and its input state machine first, then the network wiring. Every
phase leaves the repo working and testable, and each phase's spec can name the
artifacts the previous phase already specified (the shared package, then the
gateway's contract, then the UI, then the client that calls it).

## Order and why

| #   | Task id                    | Covers                                                                             | Depends on                                                                   |
| --- | -------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | `p1-contract-calc-service` | XC-1, XC-3, BE-4, BE-5, BE-8, and the calc-service side of BE-1, BE-3, BE-9, BE-11 | —                                                                            |
| 2   | `p2-api-gateway`           | BE-2, BE-6, BE-10, and the gateway side of BE-1, BE-3, BE-5, BE-8, BE-9, BE-11     | phase 1 (shared package, error codes, internal route)                        |
| 3   | `p3-calculator-ui`         | FE-1, FE-3, Open Question 5, and the UI half of FE-8                               | phase 1 (the shared request/result types it speaks)                          |
| 4   | `p4-calculator-api-client` | FE-2, FE-4, FE-5, FE-7, and the network half of FE-8                               | phase 3 (the state machine it feeds), phase 2 (the public contract it calls) |
| 5   | `p5-quality-and-docs`      | FE-6, FE-12, XC-2                                                                  | phase 4 (the finished UI it audits), 1–2 (the commands the README documents) |

Rationale for the grouping:

- **XC-1 rides with phase 1, not alone.** The shared package is three files
  (types, Zod schemas, error codes) with no observable behavior of its own —
  a story step would have nothing user-visible to write. It gets specified
  where its first consumer is specified, and phase 2 imports it rather than
  redefining anything.
- **Five requirements span two services** (BE-1, BE-3, BE-5, BE-8, BE-9,
  BE-11). Each is split by service, and the split is stated in the request
  line so neither run silently specs the other's half. Phase 2's spec cites
  phase 1's bundle for the shared halves.
- **The frontend splits at the network boundary.** Phase 3 is pure and
  synchronous — keys, display, and the input state machine that turns key
  presses into a request — and phase 4 is everything asynchronous: the client,
  the hook, busy state, and the four error presentations. The seam is the
  reducer's request/outcome boundary (below), so phase 3 is fully testable
  with no fetch mocking and phase 4 adds transport without rewriting the UI.
  It also keeps Open Question 5 — the largest undecided item in the PRD — in a
  run of its own instead of sharing an interview with error handling.
- **Tests stay with their phase.** BE-11 in phases 1–2, FE-8 split across
  phases 3–4 the same way it is split by boundary — the
  downstream code workflow builds TDD-first, so a separate "write the tests"
  phase would spec work that already happened.
- **Phase 5 is what genuinely comes last:** a responsive pass and an
  accessibility audit need a working UI to run against, and the README
  documents commands the first four phases create.

Run them one at a time. A phase is finished when its trail sits under
`.awc/tasks/done/<task>/` and both its commits are in history; only then start
the next.

---

## Phase 1 — shared contract and calc-service

```
/prd-to-spec p1-contract-calc-service XC-1, XC-3, BE-4, BE-5, BE-8 + calc-service half of BE-1, BE-3, BE-9, BE-11: shared contract package and calc-service
```

**In scope:** the shared workspace package (types, Zod schemas, error codes,
the `{ error: { code, message } }` envelope); calc-service as its own Hono app
on :3001 with `POST /calculate`; all seven operations as pure functions behind
an operation registry; its own Zod validation; 400 for malformed input; 422
`DIVISION_BY_ZERO` / `NEGATIVE_SQRT` / `RESULT_NOT_FINITE`; env-var port with
a dev default; Vitest unit tests for every operation and every domain error,
plus route tests for status codes.

**Out of scope:** anything the gateway does — proxying, CORS, the 3s timeout,
502/504 mapping, `/api/v1/*`. No frontend.

**Answers to have ready** (the interviews will ask; the PRD already settles these):

- `percentage(x, y)` = x% of y = `(x / 100) * y` (XC-3).
- Operand counts: 1 for `sqrt`, 2 for the other six.
- Non-finite results — overflow to `Infinity`, or `NaN` from `(-8) ^ 0.5` —
  are `RESULT_NOT_FINITE`, not a crash and not `NaN` in the response body.
- Vitest, no Jest. Node >= 22.22.2.
- IEEE-754 doubles are acceptable; arbitrary precision is a documented non-goal.
- Calculation modules import no HTTP code — that is the testable boundary.

---

## Phase 2 — public api-gateway

```
/prd-to-spec p2-api-gateway BE-2, BE-6, BE-10 + gateway half of BE-1, BE-3, BE-5, BE-8, BE-9, BE-11: api-gateway with proxy and failure mapping
```

**In scope:** `api-gateway` as its own Hono app on :3000; `POST /api/v1/calculate`
as the only public route; Zod validation against the shared schemas; forwarding
valid requests to calc-service; 422 pass-through; 502 when calc-service is
unreachable and 504 when it exceeds the 3s timeout, both `SERVICE_UNAVAILABLE`;
CORS for the Vite dev origin; calc-service URL and port from env vars with dev
defaults; Vitest tests with the downstream mocked.

**Out of scope:** arithmetic of any kind, health endpoints (P1 — BE-7), the
404 envelope (P1 — BE-19), frontend work.

**Answers to have ready:**

- The gateway imports the shared package from phase 1 — it never redefines a
  schema or an error code, and never imports calc-service code.
- It must answer validation errors (400) even with calc-service down.
- Timeout is 3s by default, configurable by env var.
- Public surface is versioned (`/api/v1/*`); the internal route is not.
- Error messages name the operation's real operand count (1 for `sqrt`).

---

## Phase 3 — calculator UI and input state machine

```
/prd-to-spec p3-calculator-ui FE-1, FE-3 and Open Question 5 + UI half of FE-8: calculator UI and input state machine
```

**In scope:** digit pad, decimal point, all seven operation keys,
equals and clear, and the display; entry-level validation (one decimal point,
15-character cap with the decimal point counted, equals inert while input is invalid); and the input
state machine itself. This is the run that settles **Open Question 5** —
operator pressed mid-entry, digit after a result, operator replacement, error
recovery, leading zeros — and drops the `+/-` key permanently, since flipping
a sign is local arithmetic FE-2 forbids.

It also fixes the seam phase 4 plugs into: the state machine emits a
**calculation request** built from the shared contract types (phase 1) and
accepts a **result or error outcome** handed back to it, with `pending` as a
state it can occupy. Who performs the call is out of scope — phase 3's tests
drive the reducer and the components directly, with no fetch and no mocking.

Vitest + React Testing Library tests for rendering, key presses building the
expected state, the request the machine emits, and clear/reset.

**Out of scope:** `fetch` of any kind, the API client module and hook (phase 4),
error message copy and the busy indicator (phase 4), the responsive pass and
the accessibility audit (phase 5), keyboard shortcuts (P1 — FE-9), any local
arithmetic — including "harmless" cases like negating a number for display.

**Answers to have ready:**

- `sqrt` emits its request immediately on the key press; every other operation
  waits for `=`.
- A result becomes the first operand of the next operation; `C` resets with no
  request emitted.
- An error outcome keeps the input so it can be corrected, and clears on the
  next valid input — the machine models this even though the copy lands in
  phase 4.
- Operand counts come from the shared package: 1 for `sqrt`, 2 for the rest.
- Existing UI comes from `@repo/ui` (consumed as source), styled with the
  design-system tokens in `packages/ui/src/styles/` — see the design-system
  rules in `CLAUDE.md`: no raw hex, no raw pixel sizes, every object bordered,
  hard offset shadows.
- The app's own ESLint config (`@stylistic`: no semicolons, single quotes)
  governs files under `apps/sezzle-calculator`.
- The React Compiler is on — no hand-written `useMemo`/`useCallback`.

---

## Phase 4 — API client, loading and error states

```
/prd-to-spec p4-calculator-api-client FE-2, FE-4, FE-5, FE-7 + network half of FE-8: typed API client, hook, busy and error states
```

**In scope:** one typed API client module over the shared contract types
(phase 1), calling only `POST /api/v1/calculate` on the gateway; the hook that
components use it through; wiring that hook to the phase 3 state machine so
every calculation goes to the backend; the busy state that shows a pending
indicator and blocks duplicate submissions; and the four error presentations —
domain error (division by zero, negative sqrt), backend outage, network
failure, unexpected response — each a clear, non-technical message, never a
blank screen or a raw exception. Vitest + React Testing Library tests with the
API mocked: a successful calculation, each error presentation, and the busy
state.

**Out of scope:** the input state machine and the key/display components
(phase 3 — extend them, do not respec them); the responsive pass and the
accessibility audit (phase 5); calculating anything locally, including a
fallback when the backend is down.

**Answers to have ready:**

- The frontend never calls calc-service and contains no calc-service URL; the
  gateway base URL comes from an env var with a dev default.
- All fetch logic lives in that one module — no component calls `fetch`.
- 422 responses are domain errors with a per-code message; 502/504
  `SERVICE_UNAVAILABLE` is the outage message; a thrown `fetch` is the network
  message; anything that fails to match the shared schemas is the unexpected-
  response message.
- Errors keep the input so it can be corrected, and clear on the next valid
  input.
- A second `=` while a call is in flight does nothing — it does not queue a
  second request.
- Busy state blinks with `steps(1, end)` per `BRAND.md` — never a spinner.

---

## Phase 5 — responsive pass, accessibility audit and README

```
/prd-to-spec p5-quality-and-docs FE-6, FE-12, XC-2: responsive pass, WCAG 2.2 AA audit and README
```

**In scope:** layout from a 360px floor with touch targets >= 44px and no
horizontal scroll, vanilla CSS only; WCAG 2.2 AA — semantic HTML first, 4.5:1
text contrast, landmarks, labels on every control, native `<button>`/`<input>`,
an automated axe or Lighthouse pass with no AA violations, full keyboard
operability; the README with prerequisites (`.nvmrc`, `engines`), install/run/test
commands, the architecture diagram, API docs with examples including the
percentage formula, and the assumptions and trade-offs.

**Out of scope:** every P1 item in `docs/PRD-P1.md`. Deployment and CI-CD are
non-goals.

**Answers to have ready:**

- Target viewports: 360–430px for the mobile pass; long numbers shrink or truncate.
- The README must carry a reviewer from clone to full verification in under 10
  minutes with no undocumented steps (UC-11), including stopping calc-service
  to see UC-7.
- Commands run through Turborepo from the root; workspace scoping uses
  `--filter=<package name>`.

---

## After the five runs

Each phase leaves `spec.md`, `acceptance-criteria.md` and the subtask files
under `.awc/tasks/done/<task>/`. The code workflow reads that bundle; run it
per phase, in the same order. P1 work (`docs/PRD-P1.md`) only starts once all
five P0 phases are built and green.

## If a run halts

Relaunch with the **same** arguments and say which node to resume from. The
interview logs under `.awc/tasks/in-progress/<task>/tmp/` persist, so nothing
already answered gets asked twice; a trail already under
`.awc/tasks/done/<task>/` means that run reached its last node.
