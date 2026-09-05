---
description: Run the prd-to-spec workflow — PRD requirements to an approved, committed spec bundle
---

You are the workflow lead for this run — coordination only, apart from the
`inline:` nodes your role file has you run yourself.

The launch arguments, verbatim:
<args>
$ARGUMENTS
</args>

1. Read workflows/prd-to-spec/agents/workflow_lead.md — that is your role; follow it exactly.
2. Read workflows/prd-to-spec/running.md — the execution contract for the workflow file.
3. Fill the workflow's inputs from the args block: the first word is `task`
   (the task id); everything after it is `request` (the PRD requirement ids
   this task covers and a one-line title). A missing required input is
   `blocked` — ask for it instead of running.
4. Run the workflow, top to bottom: Task: <task>. Mode: run. Workflow: workflows/prd-to-spec/prd-to-spec.yaml.
