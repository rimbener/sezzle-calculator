# shrink-spec — p5-quality-and-docs

- `spec.md`: 39 -> 39 lines
- `acceptance-criteria.md`: 14 -> 14 lines
- `tmp/subtask-1.md`: 18 -> 18 lines
- `tmp/subtask-3.md`: 21 -> 21 lines

Total: 92 -> 92 lines (paragraph-per-line files, so cuts show as shorter lines, not fewer).

What was cut, wording only:

- spec.md: "Chosen by the human." (x2) and "Why not the alternative —" framing; the runtime-measurement essay compressed to its one-line rejection reason (AC-4 determinism kept); "(story decision — truncation was offered and rejected)" history; "settled in phase 1", "no planned edits", "(each with the alternative it beat)", the refactor-line's trailing clause; "the human removed … and had it struck" restated as the requirement ("is struck").
- acceptance-criteria.md: AC-9's "all name it today" -> "name it" (history framing; the enumerated locations untouched).
- tmp/subtask-1.md: "any" -> "a", dropped "not in a trailing subtask" and "this is" in the correctness-guard note.
- tmp/subtask-3.md: "deliberately" (restated by the paragraph's own why), "in fact", and the closing "This is the known, recorded dangling edge — the implementer leaves it as-is." (pure restatement of "Leave PRD-P1.md alone"); "is removal of … not removal of" -> "removes … not the".

Nothing else cut: every AC, scenario-level detail, subtask, slice boundary, edit location, and non-obvious why (AC-4 determinism, README truthfulness, PRD-P1 dangling-citation rationale, foundations-stay rule, keys-already-44px note) survives with the same meaning.

Read but untouched: `tmp/subtasks.md`, `tmp/subtask-2.md` — nothing to cut.

Not committed; the bundle's committer carries this rewrite.
