# prd-to-spec

Turns one group of PRD requirements into an approved, committed spec bundle.
One run takes a task id and a request naming the requirement ids (for example
`BE-1, BE-3, BE-8, XC-1: shared contract package and calc-service`), reads
those sections of `docs/PRD-P0.md`, interviews you for what the PRD leaves
open, writes the user story and the spec bundle, has the bundle reviewed and
tightened, waits for your approval, and commits the result on the current
branch. The bundle lands under `.awc/tasks/spec-ready/<task>/`, where the
`spec-to-code` workflow picks it up.

## What a run produces

Under `.awc/tasks/spec-ready/<task>/` once the run ends:

| File | Written by |
| --- | --- |
| `spec.md` | the spec interview — the chosen approach, surfaces, error contract, decisions with their why |
| `acceptance-criteria.md` | the spec interview — plain criteria `AC-1 … AC-n`, one per behavior |
| `tmp/user-story.md` | the story capture — who, what, why, observable success |
| `tmp/story-interview-log.md`, `tmp/spec-interview-log.md` | every question asked and every answer, verbatim |
| `tmp/subtasks.md`, `tmp/subtask-N.md` | the subtask index and one file per atomic subtask, grouped in vertical slices |
| `tmp/review-spec.md`, `tmp/review-spec-verdict.md` | the automated review and its one-word verdict |
| `tmp/shrink-spec.md` | what the wording pass cut |

Two commits land on the current branch: `docs(spec): <task> — <request>` with
the bundle and its trail, then `chore(spec): hand off <task> to spec-to-code`
with the move to `spec-ready/`.

## How to launch

The workflow runs in place, on the current branch, from this checkout.

- **Claude Code**: `/prd-to-spec <task-id> <requirement ids and title>`
- **opencode**: `/prd-to-spec <task-id> <requirement ids and title>`
- **Codex**: ask it to run the `prd-to-spec` workflow, giving the task id and
  the requirement ids — the skill in `.codex/skills/prd-to-spec/` picks it up.

Example:

```
/prd-to-spec calc-service BE-1, BE-3, BE-4, BE-8, XC-1: shared contract package and calc-service
```

The run asks you questions during two interviews (story, then spec) and shows
you the bundle for approval at the end. Answer one question at a time; the
interviews log every exchange, so an interrupted run resumes where it stopped
when you relaunch it with the same arguments.

## The nodes

| # | id | type | does | ends on |
| --- | --- | --- | --- | --- |
| 1 | `story` | inline | `story_partner` reads the PRD sections the request names and asks you about what they leave open; writes `tmp/user-story.md` | `user_story` |
| 2 | `spec` | inline | `spec_partner` reads the story, interviews you on the solution side, writes the bundle | `spec_drafted` |
| 3 | `spec-review` | agent | `spec_reviewer` checks completeness, testability and traceability; records its verdict | `APPROVED` / `CHANGES_REQUESTED` |
| 4 | `spec-fix` | agent, `when:` | `spec_partner` resolves every finding; runs only on `CHANGES_REQUESTED` | `findings_resolved` |
| 5 | `spec-shrink` | agent | `text_shrinker` tightens the bundle's wording, meaning unchanged | `trimmed` |
| 6 | `spec-approval` | loop, cap 10 | `spec_partner` presents the bundle, applies your edits, closes on your explicit approval | `SPEC_APPROVED` |
| 7 | `commit-spec` | agent | `committer` stages `.awc/tasks/in-progress/<task>` and commits | `committed` / `unchanged` |
| 8 | `handoff` | run | `scripts/handoff-task.sh` moves the trail to `.awc/tasks/spec-ready/<task>/` | exit 0 |
| 9 | `commit-handoff` | agent | `committer` stages the moved paths and commits | `committed` / `unchanged` |

Every node runs in order; each one reads what the one before it wrote.

## Halts and resuming

A `blocked` return, an unmatched signal, a loop that hits its cap, or a
failing command halts the run with the node id and the agent's report. To
resume, launch again with the same arguments and tell the lead which node to
continue from. The interview logs and any commits persist, so the lead never
re-asks a logged question or redoes a landed commit.

## Package layout

```
workflows/prd-to-spec/
├── prd-to-spec.yaml      # the workflow
├── README.md
├── running.md            # the execution contract the lead follows
├── agents/
│   ├── workflow_lead.md  # the lead's role
│   ├── story_partner.md  # capture-and-confirm
│   ├── spec_partner.md   # write-bundle, fix-spec-findings, present-for-approval
│   ├── spec_reviewer.md  # review
│   ├── text_shrinker.md  # shrink-spec
│   └── committer.md      # commit
└── scripts/
    ├── handoff-task.sh         # hands the task trail to spec-to-code
    └── write-verdict-file.sh   # records a reviewer verdict as a one-line file
.claude/commands/prd-to-spec.md     # launcher — Claude Code
.codex/skills/prd-to-spec/SKILL.md  # launcher — Codex
.opencode/command/prd-to-spec.md    # launcher — opencode
```
