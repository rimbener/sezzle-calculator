# subtask-3 — Entry rules in the reducer

- **slice:** 2 — entry
- **criteria:** AC-4, AC-5, AC-6, AC-7, AC-8
- **status:** done
- **paths:** `apps/sezzle-calculator/src/calculator/state.ts`, `apps/sezzle-calculator/src/calculator/reducer.ts`, `apps/sezzle-calculator/src/calculator/reducer.test.ts`

The pure state machine begins here, with only the keys that build an operand. `state.ts` holds the state type and the initial state — the four statuses of `spec.md`'s state-machine section, though only `entering` is reachable in this subtask — and `reducer.ts` is a pure function from state and action to state, importing no React and nothing that performs I/O.

The entry rules, all of them silent on refusal:

- a digit appends to the operand being entered;
- a leading zero is absorbed, so the operand is never `05`, while zeros after the decimal point are kept;
- the decimal point appends once, and a second one in the same operand is ignored;
- the operand stops at **15 characters, the decimal point included** — the 16th is ignored.

A refused press returns state unchanged, so a test can assert equality against the state it started from.

Tests call the reducer directly with sequences of key actions: `1`,`2`; `0`,`0`,`5`; `.` then `0`,`0`,`7`; a second point; and a sequence past the cap, including one that reaches the cap with a decimal point in it so the character count is pinned rather than a digit count.
