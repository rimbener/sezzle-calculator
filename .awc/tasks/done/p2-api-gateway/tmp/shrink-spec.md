# shrink-spec — p2-api-gateway

Wording only. Every criterion, subtask, slice boundary, heading and table row survives with the same meaning; AC-1..AC-21 keep their order, including AC-21 between AC-15 and AC-16.

- `spec.md`: 105 -> 105 lines
- `acceptance-criteria.md`: 51 -> 51 lines
- `tmp/subtask-1.md`: 18 -> 18 lines
- `tmp/subtask-2.md`: 10 -> 10 lines
- `tmp/subtask-3.md`: 15 -> 15 lines
- `tmp/subtask-4.md`: 16 -> 16 lines
- `tmp/subtask-5.md`: 14 -> 14 lines

Total: 229 -> 229 lines. Line counts do not move because each paragraph, table row and criterion is one long line; the cuts are inside those lines.

Read and left alone: `tmp/subtasks.md` — nothing to cut.

What was cut, by kind:

- Restatement of the line beside it: "Representation matters here, because the two obvious spellings both fail" -> "Representation matters, because both obvious spellings fail"; "assembles the real client ... and has no seam to inject one" -> "builds the real client ... with no seam".
- Doubled clauses: "a 400 makes no downstream request and needs no downstream at all" -> "a 400 needs no downstream at all"; "implements or imports an arithmetic operation, and none imports calc-service code" -> "implements or imports an arithmetic operation or calc-service code".
- Hedges and filler: "exactly that", "genuinely", "anywhere in it", "at all", "the very next", "materially", "on the strength of the earlier ones", "which is AC-20's clause".
- Rationale restated after its own point, in the Approach alternatives: each bullet keeps its reason, shortened to one clause.
- The `AGENTS.md` surfaces row was re-punctuated into two labelled sentences (slice 1, slice 3) instead of one clause chain; the same items are listed.
