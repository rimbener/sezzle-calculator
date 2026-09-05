# Acceptance criteria — p4-calculator-api-client

Plain format. Each criterion is observable, is owned by exactly one subtask ([`tmp/subtasks.md`](tmp/subtasks.md)), and says nothing about how it is implemented. Context: [`spec.md`](spec.md).

## Slice 1 — the gateway API client module

- **AC-1** — Given a valid calculation request, the client sends exactly one `POST` to `<gateway URL>/api/v1/calculate` with a JSON content type and the contract's `{ operation, operands }` body; a 200 reply matching `calculateResponseSchema` resolves with `{ result }`.
- **AC-2** — A 422 reply carrying `DIVISION_BY_ZERO`, `NEGATIVE_SQRT` or `RESULT_NOT_FINITE` resolves with that exact code and message, unchanged from the gateway's reply.
- **AC-3** — A 502 or 504 reply carrying `SERVICE_UNAVAILABLE` resolves with `{ error: { code: "SERVICE_UNAVAILABLE", message: "Calculations are temporarily unavailable — try again." } }`, regardless of which of the gateway's two outage messages it sent.
- **AC-4** — When `fetch` itself throws (the gateway cannot be reached), the client resolves — it never rejects — with `{ error: { code: "SERVICE_UNAVAILABLE", message: "Can't reach the calculation service — try again." } }`.
- **AC-5** — Any other reply — malformed JSON, an unrecognised status, or a body that fails the shared schemas, a stray 400 included — resolves with `{ error: { code: "INTERNAL_ERROR", message: "Something went wrong — try again." } }`.
- **AC-6** — The gateway base URL resolves from an env var, defaulting to `http://localhost:3000` when it is unset; setting the variable changes the URL the client calls, with no code change.
- **AC-7** — No source file under `apps/sezzle-calculator` other than the client module calls `fetch` or references the gateway URL's env var.

## Slice 2 — the hook and the wired app

- **AC-8** — A hook returns a function with the exact shape `Calculator`'s `onRequest` prop expects, built from the client module; no component under `apps/sezzle-calculator` calls `fetch` directly.
- **AC-9** — `App` passes that function to `Calculator`, so a full key sequence ending in `=` (or an immediately-firing unary key) reaches the client and, on a mocked successful reply, the display shows the number the mocked reply carried — FE-2's boundary, proven end to end, not only at the unit level.
- **AC-10** — Root `lint`, `check-types`, `test` and `build` all pass with the client and hook wired in.

## Slice 3 — busy state, error presentations and docs

- **AC-11** — While a request is pending, `Display` shows its `busy` state, not `idle`, still holding the calculation exactly as it did before this phase; a second `=` (or unary key) press during that time still sends no additional request.
- **AC-12** — Each of the four failure kinds — a domain error, a backend outage, a network failure, and an unexpected response — driven end to end through the wired app with a mocked reply, shows its own message in the display's error state, over the failed calculation, with no blank screen and no raw exception reaching the UI.
- **AC-13** — After any of the four errors, the next digit or decimal point clears the error and starts a fresh entry, and `C` returns the calculator to its starting state — both already the reducer's rule, re-confirmed with a real outcome flowing through the wired client.
- **AC-14** — The app's `README.md` describes the client module, the hook, the gateway URL's env var and default, the busy indicator, and the four error messages; it no longer describes `=` as a dead end.
- **AC-15** — Root `lint`, `check-types`, `test` and `build` all pass; `AGENTS.md`'s statement that the SPA "does not yet call the gateway... makes no network calls of its own" is corrected to say that it now does.
