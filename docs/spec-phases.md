# Spec phases — PRD-P0 through `prd-to-spec`

How `docs/PRD-P0.md` gets turned into approved spec bundles: **four runs of
[`workflows/prd-to-spec/prd-to-spec.yaml`](../workflows/prd-to-spec/prd-to-spec.yaml)**, one per phase, in
the order below. Each run takes a task id and the requirement ids it covers,
interviews you twice (story, then spec), and lands two commits on the current
branch plus a bundle under `.awc/tasks/done/<task>/`.

The order follows §11 of the PRD: every phase leaves the repo working and
testable, and each phase's spec can name the artifacts the previous phase
already specified (the shared package, then the gateway's contract, then the UI).

## Order and why

| # | Task id | Covers | Depends on |
| --- | --- | --- | --- |
| 1 | `p1-contract-calc-service` | XC-1, XC-3, BE-4, BE-5, BE-8, and the calc-service side of BE-1, BE-3, BE-9, BE-11 | — |
| 2 | `p2-api-gateway` | BE-2, BE-6, BE-10, and the gateway side of BE-1, BE-3, BE-5, BE-8, BE-9, BE-11 | phase 1 (shared package, error codes, internal route) |
| 3 | `p3-calculator-ui` | FE-1, FE-2, FE-3, FE-4, FE-5, FE-7, FE-8, Open Question 5 | phase 2 (the public contract it calls) |
| 4 | `p4-quality-and-docs` | FE-6, FE-12, XC-2 | phase 3 (the UI it audits), 1–2 (the commands the README documents) |

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
- **Tests stay with their phase.** BE-11 in phases 1–2, FE-8 in phase 3 — the
  downstream code workflow builds TDD-first, so a separate "write the tests"
  phase would spec work that already happened.
- **Phase 4 is what genuinely comes last:** a responsive pass and an
  accessibility audit need a UI to run against, and the README documents
  commands the first three phases create.

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
- Vitest, no Jest. Node >= 24.
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

## Phase 3 — calculator UI

```
/prd-to-spec p3-calculator-ui FE-1, FE-2, FE-3, FE-4, FE-5, FE-7, FE-8 and Open Question 5: calculator UI, input state machine and API client
```

**In scope:** digit pad, decimal point, sign toggle, all seven operation keys,
equals and clear, and the display; one typed API client module over the shared
contract types, used through a hook; entry-level validation (one decimal point,
15-significant-digit cap, equals inert while input is invalid); the four error
presentations (domain, backend outage, network failure, unexpected response);
busy state that blocks duplicate submissions; Vitest + React Testing Library
tests. This is the run that settles **Open Question 5** — the input state
machine: operator pressed mid-entry, digit after a result, operator
replacement, error recovery, leading zeros, sign toggle.

**Out of scope:** the responsive pass and the accessibility audit (phase 4),
keyboard shortcuts (P1 — FE-9), any local arithmetic.

**Answers to have ready:**

- `sqrt` fires immediately on the key press; every other operation waits for `=`.
- A result becomes the first operand of the next operation; `C` resets with no
  API call.
- Errors keep the input so it can be corrected, and clear on the next valid input.
- Existing UI comes from `@repo/ui` (consumed as source), styled with the
  design-system tokens in `packages/ui/src/styles/` — see the design-system
  rules in `CLAUDE.md`: no raw hex, no raw pixel sizes, every object bordered,
  hard offset shadows.
- The app's own ESLint config (`@stylistic`: no semicolons, single quotes)
  governs files under `apps/sezzle-calculator`.
- The React Compiler is on — no hand-written `useMemo`/`useCallback`.

---

## Phase 4 — responsive pass, accessibility audit and README

```
/prd-to-spec p4-quality-and-docs FE-6, FE-12, XC-2: responsive pass, WCAG 2.2 AA audit and README
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

## After the four runs

Each phase leaves `spec.md`, `acceptance-criteria.md` and the subtask files
under `.awc/tasks/done/<task>/`. The code workflow reads that bundle; run it
per phase, in the same order. P1 work (`docs/PRD-P1.md`) only starts once all
four P0 phases are built and green.

## If a run halts

Relaunch with the **same** arguments and say which node to resume from. The
interview logs under `.awc/tasks/in-progress/<task>/tmp/` persist, so nothing
already answered gets asked twice; a trail already under
`.awc/tasks/done/<task>/` means that run reached its last node.
