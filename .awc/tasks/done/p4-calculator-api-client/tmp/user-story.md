# Wire the calculator to the real backend

**As a** calculator user
**I want** pressing `=` (or a unary key like `sqrt`) to actually send my calculation to the backend and show me what it answers
**so that** I get a real result (or a clear reason I didn't) instead of the calculator freezing, which is all it does today

## Context

`p3-calculator-ui` built the whole synchronous half of the calculator — keys, display, and a state machine that emits a calculation request and waits for an outcome — but wired nothing to a network. Its own spec says so plainly: "pressing `=` in `npm run dev` freezes the calculator until the page is reloaded... Phase 4 makes the app whole." That seam is already in place: `Calculator` accepts an `onRequest` prop that must resolve with the shared contract's `{ result }` or `{ error }` body and never reject, and the reducer already freezes every key while a request is `pending`.

This task supplies the other side of that seam: one typed module that does the actual `fetch` to the gateway's `POST /api/v1/calculate`, a hook that gives components access to it without any component calling `fetch` itself, and the wiring that plugs the hook's answer into `onRequest` — plus the two pieces of UI feedback FE-4/FE-5 require that phase 3 explicitly left out: the busy indicator (`Display`'s `busy` state, already built but unused) and the four error messages (division by zero, negative sqrt, backend outage, network failure, unexpected response).

No arithmetic is added anywhere — the client only calls the gateway and translates its reply (or its own failure to reach the gateway) into the outcome shape the reducer already understands.

## Acceptance criteria

- A completed calculation (`=` or a fired unary key) reaches the gateway's `POST /api/v1/calculate` and, on success, the display shows the number the gateway returned.
- While a calculation is in flight, the display shows a busy indicator; pressing `=` (or any key) again during that time sends no additional request to the gateway.
- A domain error from the gateway (422 `DIVISION_BY_ZERO`, `NEGATIVE_SQRT`, or `RESULT_NOT_FINITE`) is shown as its own clear message, and the failed calculation stays visible so the user can correct it.
- A backend outage (the gateway reports calc-service unreachable or timed out) is shown as "Calculations are temporarily unavailable — try again."
- A network failure (the gateway itself cannot be reached) is shown as "Can't reach the calculation service — try again."
- Any other unexpected reply (malformed body, a shape the shared schemas don't recognize) is shown as a clear, non-technical message — never a blank screen, a frozen display, or a raw exception in the UI.
- After any of the above errors, the next valid input clears the error and starts a fresh entry, exactly as the existing state machine already does.
- The frontend still contains no calc-service URL and performs no calculation itself — only the gateway is called, and only from the one client module.

## Notes

- The `onRequest` boundary (`Promise<CalculateResponse | ErrorResponse>`, never rejects), the reducer's frozen `pending` status, and `Display`'s `busy` state are all pre-existing from `p3-calculator-ui` — this task wires to them, it does not change them.
- Exact copy for the "unexpected response" message is not fixed by any PRD text (unlike the outage and network-failure messages, which are direct quotes from `docs/PRD-P0.md` FE-4 and UC-8) — that wording is a spec-level decision, not asked here.
- Gateway base URL, retry/timeout behavior beyond what the gateway itself already enforces (its own 3s deadline), and the exact module/hook boundaries are implementation choices for the spec step, not settled here.
