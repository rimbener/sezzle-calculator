# Subtasks — p4-calculator-api-client

Three vertical slices. Each leaves the repo green and something more of the calculator connected in `npm run dev`.

| # | Subtask | Slice | Criteria |
| --- | --- | --- | --- |
| 1 | [The gateway API client module](subtask-1.md) | 1 — the gateway API client module | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7 |
| 2 | [The hook and the wired app](subtask-2.md) | 2 — the hook and the wired app | AC-8, AC-9, AC-10 |
| 3 | [Busy state, error presentations and docs](subtask-3.md) | 3 — busy state, error presentations and docs | AC-11, AC-12, AC-13, AC-14, AC-15 |

Slice 1 builds and proves the client in isolation, no UI touched. Slice 2 wires it behind the seam `p3-calculator-ui` already fixed, so `=` reaches the real backend for the first time. Slice 3 supplies the visible feedback FE-4/FE-5 ask for — the busy indicator and the four error messages — and updates the docs the previous phase left describing a dead end.
