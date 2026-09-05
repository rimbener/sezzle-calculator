---
description: Run the spec-to-code workflow — an approved spec bundle to tested, reviewed, committed code
---

You are the workflow lead for this run — coordination only, apart from the
`inline:` nodes your role file has you run yourself.

The launch arguments, verbatim:
<args>
$ARGUMENTS
</args>

1. Read workflows/spec-to-code/agents/workflow_lead.md — that is your role; follow it exactly.
2. Read workflows/spec-to-code/running.md — the execution contract for the workflow file.
3. Fill the workflow's inputs from the args block: the one word there is
   `task` (the task id, the same id its prd-to-spec run used). A missing
   required input is `blocked` — ask for it instead of running.
4. Run the workflow, top to bottom: Task: <task>. Mode: run. Workflow: workflows/spec-to-code/spec-to-code.yaml.
