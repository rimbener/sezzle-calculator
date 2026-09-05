# Subtasks — p3-calculator-ui

Three vertical slices. Each leaves the repo green and something more of the calculator visible in `npm run dev`.

| # | Subtask | Slice | Criteria |
| --- | --- | --- | --- |
| 1 | [`Keypad` in the design system](subtask-1.md) | 1 — the calculator shell | AC-1 |
| 2 | [The calculator shell in the app](subtask-2.md) | 1 — the calculator shell | AC-2, AC-3 |
| 3 | [Entry rules in the reducer](subtask-3.md) | 2 — entry | AC-4, AC-5, AC-6, AC-7, AC-8 |
| 4 | [Entry wired to the UI, and `C`](subtask-4.md) | 2 — entry | AC-9, AC-10 |
| 5 | [Operation keys, `=` gating and `sqrt`](subtask-5.md) | 3 — operations, requests and outcomes | AC-11, AC-12, AC-13, AC-14, AC-15, AC-16 |
| 6 | [Request emission, pending and outcomes](subtask-6.md) | 3 — operations, requests and outcomes | AC-17, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23 |
| 7 | [The full machine behind the UI](subtask-7.md) | 3 — operations, requests and outcomes | AC-24, AC-25 |

Slice 1 makes the calculator visible and inert. Slice 2 makes it type. Slice 3 makes it a state machine that emits requests and consumes outcomes — with `=` a dead end in the running app until Phase 4, by decision (`spec.md`, non-goals).
