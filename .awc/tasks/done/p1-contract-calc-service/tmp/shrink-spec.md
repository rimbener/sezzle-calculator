# shrink-spec — p1-contract-calc-service

Wording only. Every acceptance criterion (19), subtask (5), slice boundary, heading,
table row and error string survives unchanged in meaning.

Every file is one paragraph or table row per line, so the line count does not move.
The word count is the real measure, given in parentheses.

- `spec.md`: 85 -> 85 lines (words 1424 -> 1347)
- `acceptance-criteria.md`: 47 -> 47 lines (words 885 -> 879)
- `tmp/subtasks.md`: 11 -> 11 lines (words 169 -> 164)
- `tmp/subtask-1.md`: 18 -> 18 lines (words 302 -> 280)
- `tmp/subtask-2.md`: 17 -> 17 lines (words 288 -> 286)
- `tmp/subtask-3.md`: 21 -> 21 lines (words 331 -> 327)
- `tmp/subtask-4.md`: 14 -> 14 lines (words 207 -> 204)
- `tmp/subtask-5.md`: 16 -> 16 lines (words 256 -> 245)

**Total: 229 -> 229 lines (words 3862 -> 3732, cut 130).**

## What was cut

- History and verification talk: "Verified on this machine", "all settled with the
  human", "AC-17 onward were added in review", "lands here with the workspace, not
  after it".
- Restatement: "the barrel the package's `exports` already point at", "so no message
  is a presentation string" (the sentence before it already says so), "physically
  separated", "and nothing of the underlying failure in the body".
- Hedges and padding: "exactly as", "the price, accepted", "Together those two are
  why", "whole gate", "does three things and nothing else" kept — it is the rule, not
  padding.
- The five ruled-out alternatives were compressed, not removed: the review credited
  them as a strength, so each keeps its trade-off and its reason, in fewer words.

Nothing in the error-contract table, the message strings, the criteria text or the
subtask paths was touched.
