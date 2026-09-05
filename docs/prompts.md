# Session Prompts

Prompts used with Claude Code to produce `docs/PRD.md`, in order. Each entry is the verbatim prompt, followed by the result it produced.

---

## 1. Initial request — PRD and Use Cases

> I am building a calculator for a company called Sezzle. The project is a coding assessment for a web application to show my skills and knowledge.
>
> Help me creating the PRD and Use Cases
> Read requirements from the file `docs/REQUIREMENTS.md`


**Result:** PRD v1 (`docs/PRD.md`) — problem statement, goals, non-goals, user stories, P0/P1/P2 requirements with acceptance criteria, 9 use cases, API contract, success metrics, open questions, phasing. Backend modeled as a single API service.

## 2. Microservices as a hard requirement

> But the BE is not using microservices, that is a hard requirement

**Result:** PRD v2 — backend restructured as a microservices architecture: API gateway + two operation services (basic-ops, advanced-ops), with new requirements for service decomposition, downstream failure handling (502/504), health endpoints, env-based configuration, and a partial-outage use case.


**Result:** Completed writing PRD v2.

## 3. Final decomposition

> Lets do a gateway + single calc service

**Result:** PRD v3 — decomposition settled as `api-gateway` (:3000, public) + `calc-service` (:3001, internal, all seven operations). Use cases, health reporting, metrics, and phasing adjusted; a future basic/advanced split documented as P2.

## 4. Independent review

> now run a subagent for doing a review of the PRD.md and show me the review

**Result:** A review subagent produced a structured critique: overall verdict, strengths, gaps and inconsistencies (3 contradictions, 8 ambiguities), over-engineering risks, and prioritized High/Medium/Low edits.

## 5. Clarification on one finding

> Explain real contradictions 2

**Result:** Explanation of why BE-8's "grep for arithmetic in the gateway" acceptance criterion was not mechanically checkable (false positives on `/` in paths, `+` in strings) and contradicted BE-12's duration logging.

## 6. Decisions on the review findings

> Missing coverage / ambiguity:
> 6. Calculator state machine underspecified: will be done during the implementation.
> 8. FE-3 not testable as written: will be done during the implementation.
>
> High
> Fix FE-2: "pressing equals (or invoking the unary sqrt)" — remove percentage from immediate-fire.
> BE-4: add acceptance line; add NaN example under RESULT_NOT_FINITE; change UC-3-A1 copy to fit both overflow and NaN (e.g. "Result is undefined or too large").
> BE-6: state the default timeout inline at P0 (e.g. 3s); BE-13 becomes configurability only.
>
> Medium
> 5. Add acceptance lines to remaining P0s, or scope the §10 claim; make FE-3 concrete (e.g. max 15 significant digits).
> 6. Replace BE-8's grep criterion with "gateway contains no modules implementing calculator operations."
> 7. Move gateway GET /health + 404 envelope to P1.
> 8. Close Open Question 2 and bump status.
> 9. Rank the P1s (suggested: FE-11 > FE-9 > BE-13 > BE-12 > FE-10 > BE-14).
>
> Low — state the versioning asymmetry as deliberate, align "~10 min"/"<10 min" phrasing, add Node pin to XC-2, "502/504" in the metrics row, arity-aware example error message in UC-6.

**Result:** PRD v4 — all selected review edits applied: acceptance criteria on every P0, NaN under `RESULT_NOT_FINITE`, 3s default timeout at P0, gateway plain `/health` and 404 envelope demoted to P1 (BE-18, BE-19), P1 priority order added, input state machine deferred to implementation as Open Question 5, all open questions resolved, status bumped to "approved for build".

## 7. Simplify the language

> Ok, now I want to shrink the document and make it more human readable, remove idioms, common expressions, etc. use simple and concise language

**Result:** PRD v5 — about 25% shorter; idioms and figurative phrasing replaced with plain language; same structure, requirement IDs, acceptance criteria, and use cases.

## 8. Save the prompts

> save this session prompts in prompts.md

**Result:** This file (`docs/prompts.md`).

## 9. Health endpoints to P1

> move all the /health to P1

**Result:** BE-7 (health endpoints) moved from P0 to P1; UC-9 marked P1; health routes annotated as P1 in the API contract; goals, BE-1/UC-7 acceptance, and phasing updated so no P0 item depends on health.

## 10. Remove success metrics

> remove 10 success metrics

**Result:** Section 10 (Success Metrics) deleted; Open Questions and Phasing renumbered.

## 11. Accessibility requirements

> Add accessibility requirements to the PRD.md:
> - WCAG 2.2 level AA
> - HTML semantic before ARIA
> - Minimum contrast ratio of 4.5:1
> - Labels in forms, alt in images, landmarks (`<nav>`, `<main>`, `<aside>`)

**Result:** New Goal 7 (WCAG 2.2 AA) and new P0 requirement FE-12 with those four points plus acceptance criteria (axe/Lighthouse audit, keyboard operability, contrast checks); accessibility audit added to Phase 4. Native `<button>`/`<input>` elements make basic keyboard operability P0 while typed shortcuts stay P1 (FE-9).

## 12. Split the PRD by priority

> now split the PRD.md into two files: PRD-P0.md and PRD-P1.md

**Result:** `docs/PRD.md` replaced by `docs/PRD-P0.md` (must-have scope: goals, architecture, all P0 requirements, use cases, API contract, open questions, Phases 1–4) and `docs/PRD-P1.md` (P1 priority order, P1/P2 requirements, UC-9, health API contract, Phase 5). Requirement and use-case IDs unchanged; cross-references link between the files.
