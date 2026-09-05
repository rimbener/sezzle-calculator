# sezzle-calculator

The calculator web app: a Vite + React single-page app that renders the
calculator on top of the `@repo/ui` design system. It owns no arithmetic and
makes no network calls of its own — the operations live in `calc-service`, and
the gateway that will carry a request there is Phase 4 of
`docs/spec-phases.md`.

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

Every refusal is silent — the readout does not change and no message appears.

The operation keys, `√` (`sqrt`) and `=` are rendered but **not wired yet**:
pressing one does nothing. They gain their behaviour in slice 3 of the current
phase (`.awc/tasks/in-progress/p3-calculator-ui/`), where the state machine
starts emitting calculation requests.

## How it is built

`src/calculator/` is the whole calculator:

- `keys.ts` — the key model: every key on the pad, in render order, with its
  glyph, accessible name and kind. Operation keys are named from
  `@repo/contracts`.
- `state.ts` — the state object and its four statuses (`entering`, `pending`,
  `result`, `error`); only `entering` is reachable today.
- `reducer.ts` — a pure function over that state. Imports no React, performs
  no I/O and does no arithmetic: entry is string append and a length check.
- `display.ts` — the projection from state to the `Display`'s three slots
  (`value`, `expression`, `state`).
- `Calculator.tsx` — the wiring: `useReducer` over the reducer, one dispatch
  per key press, the projection fed to `Display`.

The React Compiler is on (`@rolldown/plugin-babel` + `reactCompilerPreset` in
`vite.config.ts`), so there is no hand-written `useMemo`/`useCallback`. This
workspace runs its own flat ESLint config (`@stylistic`: no semicolons, single
quotes) rather than `@repo/eslint-config`.

## Testing it

Vitest with React Testing Library and `user-event`. The reducer and the
projection are tested directly; `Calculator.test.tsx` re-drives the entry rules
through clicks by accessible name; `scope-docs.test.ts` holds `docs/` and this
README to what the code does.

```sh
npx turbo test --filter=sezzle-calculator
npx turbo test:watch --filter=sezzle-calculator
```
