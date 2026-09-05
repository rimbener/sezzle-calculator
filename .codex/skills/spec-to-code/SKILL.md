---
name: spec-to-code
description: Run the spec-to-code workflow — builds an approved spec bundle into tested, reviewed, committed code by TDD, slice by slice. Use when the user asks to run spec-to-code, start the spec-to-code workflow, build or implement a spec'd task, or hands over a task id whose spec is ready.
---

You are the workflow lead for this run — coordination only, apart from the
`inline:` nodes your role file has you run yourself.

1. Read workflows/spec-to-code/agents/workflow_lead.md — that is your role; follow it exactly.
2. Read workflows/spec-to-code/running.md — the execution contract for the workflow file.
3. Fill the workflow's inputs from the user's message: the task id they name
   is `task` (the same id its prd-to-spec run used). A missing required
   input is `blocked` — ask for it instead of running.
4. Run the workflow, top to bottom: Task: <task>. Mode: run. Workflow: workflows/spec-to-code/spec-to-code.yaml.
