# Subtasks — p1-contract-calc-service

Three vertical slices, each independently green: slice 1 leaves a tested contract package, slice 2 a tested calculation domain in a workspace the root tasks fan out over cleanly, slice 3 a running, curl-able service. Criteria: [`../acceptance-criteria.md`](../acceptance-criteria.md).

| Slice | Subtask | Title | Criteria |
| --- | --- | --- | --- |
| 1 — the contract | [subtask-1](subtask-1.md) | `@repo/contracts` workspace, tooling and README | AC-4, AC-5 |
| 1 — the contract | [subtask-2](subtask-2.md) | Operations, request schema, error codes and messages | AC-1, AC-2, AC-3 |
| 2 — the calculation domain | [subtask-3](subtask-3.md) | `apps/calc-service` workspace, pure operations, registry and README | AC-6, AC-7, AC-8, AC-9, AC-17, AC-18 |
| 3 — the HTTP surface | [subtask-4](subtask-4.md) | Hono app: `POST /calculate`, validation and error mapping | AC-10, AC-11, AC-12, AC-13, AC-14 |
| 3 — the HTTP surface | [subtask-5](subtask-5.md) | Server entry, port configuration and README | AC-15, AC-16, AC-19 |
