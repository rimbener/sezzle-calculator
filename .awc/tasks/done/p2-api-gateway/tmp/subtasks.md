# Subtasks — p2-api-gateway

Three vertical slices, each independently green: slice 1 leaves the shared contract carrying everything both services need and calc-service answering exactly as before, slice 2 a tested downstream client with no HTTP surface of its own, slice 3 a running, curl-able public gateway. Criteria: [`../acceptance-criteria.md`](../acceptance-criteria.md).

| Slice | Subtask | Title | Criteria |
| --- | --- | --- | --- |
| 1 — the shared contract | [subtask-1](subtask-1.md) | `SERVICE_UNAVAILABLE`, response schemas and the shared status map | AC-1, AC-2, AC-3, AC-4 |
| 2 — the client | [subtask-2](subtask-2.md) | `apps/api-gateway` workspace, tooling and configuration | AC-5 |
| 2 — the client | [subtask-3](subtask-3.md) | The calc-service client: deadline, retry and outcome classification | AC-6, AC-7, AC-8, AC-9, AC-10 |
| 3 — the public surface | [subtask-4](subtask-4.md) | Hono app: `POST /api/v1/calculate`, validation, error mapping and CORS | AC-11, AC-12, AC-13, AC-14, AC-15, AC-21, AC-16, AC-17 |
| 3 — the public surface | [subtask-5](subtask-5.md) | Server entry, port binding and README | AC-18, AC-19, AC-20 |
