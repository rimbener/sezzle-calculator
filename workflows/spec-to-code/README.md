# spec-to-code

Turns one approved spec bundle into tested, reviewed, committed code. One run
takes a task id — the same id its `prd-to-spec` run used — opens the bundle
that run left under `.awc/tasks/spec-ready/<task>/`, builds every vertical
slice by strict TDD with a quick review per slice, runs one exhaustive
engineering review over the whole diff, trims the comments it added,
re-verifies the Definition of Done, and commits everything on `task/<task>`
in a worktree. The run finishes on its own; you review the branch afterwards
and open the pull request yourself.

## What a run produces

Commits on `task/<task>`, cut from the branch you launched on:

| Commit | Made by |
| --- | --- |
| one `feat(<scope>): …` per slice, plus a small trail commit recording its closing hash | the TDD implementer |
| fix commits after the review and the DoD, where findings existed | the TDD implementer |
| the comment rewrite | the shrinker |
| `chore(spec-to-code): open <task> for the build` | the committer |
| `chore(spec-to-code): <task> task trail` | the committer |
| `chore(spec-to-code): archive <task> task trail` | the committer |

Under `.awc/tasks/done/<task>/` once the run ends — the spec bundle
`prd-to-spec` wrote, plus:

| File | Written by |
| --- | --- |
| `tmp/tdd-N.md` | the implementer — each slice's `criterion → test` map, one line per cycle, its `closing-commit:` |
| `tmp/review-slice-N.md`, `tmp/review-slice-verdict-N.md` | the slice reviewer — findings and the one-word verdict |
| `tmp/review.md`, `tmp/review-verdict.md` | the engineering reviewer — the durable findings trail and its verdict |
| `tmp/shrink-comments.md` | the shrinker — which files' comments it cut, and by how much |
| `tmp/dod.md` | the DoD validator — the checklist with one line of evidence per item |

## How to launch

The workflow runs in a worktree at `.worktrees/<task>` on branch
`task/<task>`. Launch from `main` (the ref every review diffs against), with
the package and the task's `spec-ready/` bundle committed on it:

```sh
./spec-to-code.sh <task-id> claude        # or codex / opencode
```

On a terminal the script asks for the workflow name and the branch prefix,
with `spec-to-code` and `task` as defaults; press Enter to accept them.
Headless runs take those defaults, or `AWC_NAME` and `AWC_BRANCH_PREFIX` from
the environment. The script cuts the worktree from the current branch, or
reuses it when it already exists, starts the host inside it and hands over to
the workflow lead. The worktree stays after the run for you to open the pull
request from; re-running the script resumes in the existing tree.

Example:

```sh
./spec-to-code.sh calc-service claude
```

The three in-session launchers run the same workflow from whatever checkout
the host is already in — useful for resuming inside the worktree:

- **Claude Code**: `/spec-to-code <task-id>`
- **opencode**: `/spec-to-code <task-id>`
- **Codex**: ask it to run the `spec-to-code` workflow for the task id — the
  skill in `.codex/skills/spec-to-code/` picks it up.

The run asks you nothing: the spec was approved in `prd-to-spec`, and every
gate here is a command or a validator. Expect it to take a while; the lead
reports each node as it lands.

## The nodes

| # | id | type | does | ends on |
| --- | --- | --- | --- | --- |
| 1 | `open-task` | run | `scripts/open-task.sh` moves `spec-ready/<task>` to `in-progress/<task>`; a resumed run passes through | exit 0 |
| 2 | `commit-open` | agent | `committer` stages the moved paths and commits, so every later diff shows only the slice's own work | `committed` / `unchanged` |
| 3 | `install` | run | `npm ci --silent` | exit 0 |
| 4 | `build` | loop, cap 8 | per slice: `implementer_tdd` builds it red→green→refactor, `reviewer_slice` runs the suite and reviews the slice's diff, `implementer_tdd` fixes every finding, commits and records the closing hash | `DONE` once every slice is built |
| 5 | `review` | loop, cap 2 | the full gate, `reviewer_engineering` over the whole diff against `main`, `implementer_tdd` fixes every finding and commits, the gate again | `DONE` once every finding in `review.md` is resolved |
| 6 | `shrink-comments` | agent | `text_shrinker` rewrites comments changed since `main`, proves the code unchanged, runs the gate, commits | `trimmed` |
| 7 | `shrink-gate` | run | the full gate | exit 0 |
| 8 | `dod` | loop, cap 2 | `dod_validator` re-runs the checklist, `implementer_tdd` closes gaps and commits | `DONE` once `dod.md` is all-pass |
| 9 | `commit-trail` | agent | `committer` stages `.awc/tasks/in-progress/<task>` and commits | `committed` / `unchanged` |
| 10 | `finish` | run | `scripts/finish-task.sh` moves the trail to `.awc/tasks/done/<task>/` | exit 0 |
| 11 | `commit-archive` | agent | `committer` stages the moved paths and commits | `committed` / `unchanged` |

Every node runs in order; each one reads what the one before it wrote.

## The gate

Two vars name the checks, both through Turbo with `--output-logs=errors-only`,
so a green run prints nothing and a red one quotes the failing task:

| var | command |
| --- | --- |
| `commands` | `npx turbo run lint check-types test --output-logs=errors-only` |
| `test_command` | `npx turbo run test --output-logs=errors-only` |

Every workspace the implementer creates needs `lint`, `check-types` and
`test` scripts for Turbo to run them; the slice reviewer's conventions lens
checks that wiring.

## Halts and resuming

A `blocked` return, an unmatched signal, a loop that hits its cap, or a
failing command halts the run with the node id and the agent's report. To
resume, run `./spec-to-code.sh <task-id> <host>` again and tell the lead
which node to continue from. Build records, reviews and commits persist, so
the lead never redoes a landed commit.

## Package layout

```
spec-to-code.sh                 # worktree launch — creates or reuses .worktrees/<task>
agents-cli.conf                 # host roster the launch script reads
workflows/spec-to-code/
├── spec-to-code.yaml     # the workflow
├── README.md
├── running.md            # the execution contract the lead follows
├── agents/
│   ├── workflow_lead.md        # the lead's role
│   ├── implementer_tdd.md      # build-slice, fix-slice-findings, fix-review-findings, close-dod-gaps
│   ├── reviewer_slice.md       # review-slice
│   ├── reviewer_engineering.md # full-review
│   ├── text_shrinker.md        # shrink-comments
│   ├── dod_validator.md        # validate
│   └── committer.md            # commit
└── scripts/
    ├── open-task.sh            # opens the spec-ready bundle for the build
    ├── finish-task.sh          # archives the task trail
    └── write-verdict-file.sh   # records a reviewer verdict as a one-line file
.claude/commands/spec-to-code.md     # launcher — Claude Code
.codex/skills/spec-to-code/SKILL.md  # launcher — Codex
.opencode/command/spec-to-code.md    # launcher — opencode
```
