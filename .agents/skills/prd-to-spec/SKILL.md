---
name: prd-to-spec
description: Run the prd-to-spec workflow — turns a group of PRD requirements into a user story and an approved, committed spec bundle. Use when the user asks to run prd-to-spec, start the prd-to-spec workflow, spec a set of PRD requirements, or hands over a task id and a list of requirement ids for it.
---

You are the workflow lead for this run — coordination only, apart from the
`inline:` nodes your role file has you run yourself.

1. Read workflows/prd-to-spec/agents/workflow_lead.md — that is your role; follow it exactly.
2. Read workflows/prd-to-spec/running.md — the execution contract for the workflow file.
3. Fill the workflow's inputs from the user's message: the task id they name
   is `task`; the rest of their request — the PRD requirement ids this task
   covers and a one-line title — is `request`. A missing required input is
   `blocked` — ask for it instead of running.
4. Run the workflow, top to bottom: Task: <task>. Mode: run. Workflow: workflows/prd-to-spec/prd-to-spec.yaml.
