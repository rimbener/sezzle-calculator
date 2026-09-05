# subtask-2 — Operations, request schema, error codes and messages

- **slice:** 1 — the contract
- **criteria:** AC-1, AC-2, AC-3
- **status:** todo
- **paths:** `packages/contracts/src/index.ts`, `packages/contracts/src/operations.ts`, `packages/contracts/src/calculate.ts`, `packages/contracts/src/errors.ts`, `packages/contracts/src/messages.ts`, `packages/contracts/src/*.test.ts`

The whole contract, defined once (AC-3):

- **operations** — the seven names as a readonly tuple, the union type derived from it, and `OPERAND_COUNT`, the map from operation to operand count (1 for `sqrt`, 2 for the rest). The registry in subtask-3 reads the same map, so arity is stated once.
- **request schema** — one Zod schema: operation enum plus an array of finite numbers, refined against `OPERAND_COUNT`. Rejects `NaN` and `Infinity` as operands. The inferred request type is exported alongside it.
- **response and error shapes** — `{ result: number }`; `{ error: { code, message } }`; the five error codes as a const object plus their union type.
- **messages** — every message string from `spec.md`'s error contract, as constants or as small pure builders for the two that quote an operation name, following that section's three rules: only a supplied string operation is interpolated (so the absent/`null`/non-string case has its own constant naming the seven), the operand noun agrees with the count, and the operation is validated before the operands. No operand values are interpolated, so each message a test asserts is exact.

`src/index.ts` exists as an empty barrel from subtask-1; this subtask fills it with the real exports.

Tests cover AC-1 (each operation's well-formed request parses, at its own arity, with zero/negative/decimal operands) and AC-2 (each rejection produces its exact sentence — the unknown-operation case, the absent/`null`/non-string-operation case, the singular noun for `sqrt`, and the precedence when a request is wrong in both its operation and its operands).
