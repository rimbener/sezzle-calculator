# sezzle-calculator

The calculator web app: a Vite + React single-page app that renders the
calculator on top of the `@repo/ui` design system. It owns no arithmetic — the
operations live in `calc-service` — and reaches them only through the gateway's
`POST /api/v1/calculate`, carried by the typed client module and hook described
below (Phase 4 of `docs/spec-phases.md`).

## Running it

Start the dev server with:

```sh
npx turbo dev --filter=sezzle-calculator
```

`npm run build` in this directory runs `tsc -b && vite build`; `npm run
preview` serves the built output.

## What the calculator does today

The app shows a `Display` over a 4×5 `Keypad`: the digits `0`–`9`, the decimal
point, one key per `@repo/contracts` operation (`+`, `−`, `×`, `÷`, `^`, `%`,
`√`), `=` and `C`. Every key is a native `<button>` with an accessible name.

Entry is text, never arithmetic, and follows a desk calculator's rules:

- Digits append to the operand on the readout. A leading zero is absorbed:
  `0` stays `0`, and `0`, `0`, `5` reads `5`.
- The decimal point appends once and keeps its zeros: `.` on `0` reads `0.`,
  and `.`, `0`, `0`, `7` reads `0.007`. An operand holds one decimal point; a
  second press is ignored.
- An operand holds at most 15 characters, the decimal point included; a 16th
  press is ignored.
- `C` returns the calculator to its starting state, value `0`.

Operation keys record; `=` and `√` are the only keys that emit:

- An operation key commits the operand as the left one and records the
  operation: `12`, `+` keeps `12` on the readout with `12 +` on the expression
  line. The next digit or point starts the right operand.
- A second operation key **replaces** the recorded one and calculates nothing:
  `12`, `+`, `5`, `×` is `12 × 5`, and a digit then appends to the retained
  `5` — `12`, `+`, `5`, `×`, `7` is `12 × 57`.
- `=` emits a request once the entry is complete — an operation recorded and
  at least one key appended to the right operand (`5.` counts, and sends `5`).
  `=` on an incomplete entry is ignored.
- `√` (`sqrt`) emits on the press with the operand on the readout, and is
  ignored while an operation is recorded.
- Percentage is "x% of y" — `12% of 50` on the expression line, operands sent
  as `x` then `y`.

An emitted request moves the machine to `pending`: the readout holds the
calculation (`12 + 5 =`, `sqrt(9) =`), the `Display` switches to its **busy
state** — the meta line swaps `Ready` for `Working` while the call is in
flight — and **every key is ignored, `C` included**, so no second request can
leave. An outcome ends it:

- a **result** puts the number on the readout over the completed calculation;
  a digit or point then starts a fresh entry, an operation key makes the result
  the first operand, `C` resets;
- an **error** puts the `Display` in its error state with the message the
  outcome carried on the readout, over the failed calculation; a digit, the
  point or `C` recover, and every other key is ignored.

Every refusal is silent — the readout does not change and no message appears.

**`=` reaches the real gateway.** `App.tsx` calls `useCalculate()` — the hook —
and passes the function it returns to `Calculator`'s `onRequest` prop. The hook
builds one client from `src/api/client.ts`, which sends each request as one
`POST <gateway>/api/v1/calculate` and classifies the reply against the shared
`@repo/contracts` schemas before the state machine sees it. The gateway's base
URL comes from the `VITE_GATEWAY_URL` env var, defaulting to
`http://localhost:3000` — the api-gateway's dev port; setting the variable
retargets the app with no code change. The client never rejects, and it adds no
arithmetic of its own: it carries the request and reads the answer.

Every reply lands as one of four presentations:

- a **domain error** — a 422 with `DIVISION_BY_ZERO`, `NEGATIVE_SQRT` or
  `RESULT_NOT_FINITE`, relayed unchanged from the contract's own wording
  (`cannot divide by zero`, and its two siblings);
- a **backend outage** — a 502 or 504 behind the gateway, presented as
  "Calculations are temporarily unavailable — try again.";
- a **network failure** — `fetch` itself threw and the gateway is unreachable,
  presented as "Can't reach the calculation service — try again.";
- an **unexpected response** — anything else: malformed JSON, an unrecognised
  status, or a body failing the shared schemas, presented as
  "Something went wrong — try again."

## How it is built

`src/calculator/` is the whole calculator, and `src/api/` its one connection
to the gateway:

- `keys.ts` — the key model: every key on the pad, in render order, with its
  glyph, accessible name and kind. Operation keys are named from
  `@repo/contracts`.
- `state.ts` — the state object and its four statuses: `entering` (the
  operands typed so far and the recorded operation), `pending` (the emitted
  calculation and its `@repo/contracts` request), `result` and `error`.
- `reducer.ts` — a pure function over that state. Imports no React, performs
  no I/O and does no arithmetic: entry is string append and a length check,
  arity comes from the contract's `OPERAND_COUNT`, and the only conversion is
  reading the entered text as the request's number.
- `display.ts` — the projection from state to the `Display`'s three slots
  (`value`, `expression`, `state`), operator glyphs included. Results render
  with JavaScript's own number-to-string conversion; formatting is Phase 5's.
- `Calculator.tsx` — the wiring: `useReducer` over the reducer, one dispatch
  per key press, the projection fed to `Display`, and the `onRequest` effect
  that hands each new request out exactly once and dispatches the outcome.
- `src/api/client.ts` — the one typed module that talks to the gateway:
  config resolution (`VITE_GATEWAY_URL`, default `http://localhost:3000`), the
  `POST`, and the reply classified through `@repo/contracts`' own schemas into
  the outcome the state machine already understands — a `result`, or one of
  the four error envelopes. It never rejects.
- `src/api/useCalculate.ts` — the hook that builds that client once from the
  resolved gateway URL, for `App` to hand to `Calculator` as `onRequest`. No
  component calls `fetch` — the client module is the only file that does.

The React Compiler is on (`@rolldown/plugin-babel` + `reactCompilerPreset` in
`vite.config.ts`), so there is no hand-written `useMemo`/`useCallback`. This
workspace runs its own flat ESLint config (`@stylistic`: no semicolons, single
quotes) rather than `@repo/eslint-config`.

## Testing it

Vitest with React Testing Library and `user-event`. The reducer is driven
through every transition and the request it emits is checked against the
contract's schema; the projection is tested per readout shape;
`Calculator.test.tsx` re-drives the rules through clicks by accessible name and
runs a calculation end to end against a stub `onRequest`; `frontend-purity.test.ts`
scans this app and `@repo/ui` for `fetch`, `Math` and stray number parsing;
`scope-docs.test.ts` holds `docs/` and this README to what the code does.

```sh
npx turbo test --filter=sezzle-calculator
npx turbo test:watch --filter=sezzle-calculator
```
