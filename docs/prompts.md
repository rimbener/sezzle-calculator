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

## 13. Design system build

### 13.1 — Opening brief (form-generated)

> We will create a design system in this project.
>
> **Company description:** Sezzle Calculator: A simple calculator app
>
> **Attached codebases** (read-only, mounted via File System Access API):
> - `sezzle-calculator/` — explore with local_ls first, then local_read; use local_grep only to search file contents. Paths start with `sezzle-calculator/`
>
> **Additional notes:**
> I want to create a new design system for the project described in PRD-P0.md, I want a simple retro design.
>
> *(followed by the standard design-system build instructions: explore assets, write readme.md, set project title, write token CSS, document content fundamentals and visual foundations, create specimen cards, copy assets, author components, build UI kits, write SKILL.md)*

### 13.2

> Create the components into the code base

**Result:** Generating the real .tsx + vanilla-CSS files, ready to drop into packages/ui.
All nine components are written as real TypeScript — no hand-porting needed. Unzip into packages/ui/ and you get:

button/card/badge/key/display/callout/busy-lamp/input/toggle.tsx — typed props extending the right DOM interfaces, useId label association, no inline styles
styles/components.css — every class in vanilla CSS, tokens only, zero raw hex, with prefers-reduced-motion handling
index.ts — barrel exporting components and prop types
package.json.example — merge the exports and sideEffects keys into yours
Then import "@repo/ui/styles.css" once and import { Key, Display } from "@repo/ui".

Three things to delete: the starter button.tsx (it fires an alert()), card.tsx, and code.tsx.

### 13.3

> Create a simple skill, without code, css, etc

**Result:** Two files: SKILL.md and BRAND.md. Unzip into .claude/skills/sezzle-calculator-design/ — no tokens, no CSS, no components, no UI kit.

BRAND.md carries the whole system in prose: hex values as a plain list, type roles, construction rules (2px borders, hard offset shadows, the 4px press), states, iconography, voice, and a short description of each element so Claude can write the markup itself rather than copying files.

Trade-off worth knowing: without tokens/, output won't use var(--…) — it'll write literal hex. Fine for mocks and prototypes; for production in the real repo, use the full version so the code stays token-driven.

### 13.4

> add tokens into the little skill


**Result:** Now SKILL.md + BRAND.md + styles.css + tokens/ — ten files, still no components or UI kit.

BRAND.md now names the token for every value instead of just printing hex: --key-operator rather than #F0A93B, font: var(--type-key) rather than a hand-assembled font stack. SKILL.md tells Claude to link styles.css and never write a raw hex — so output stays token-driven and drops straight into the real repo.
## 14. Design system gallery component

### 14.1 — Build the gallery

> add one component named design-system.tsx that has one example of each possible component in @packages/ui . be sure to add all the iterations

**Result:** `apps/sezzle-calculator/src/design-system.tsx` — a single `DesignSystem` component rendering every `@repo/ui` export in every variant: Button (5 variants × 3 sizes, disabled, block), Card (paper/sunken with eyebrow/title/footer, body-only), Badge (5 tones), Key (5 faces, sublabel, active, disabled, plus a 4-column keypad using `span`), Display (idle/busy/error, sm/md/lg, defaults), Callout (4 tones with `code`, title-only, dismissible), BusyLamp (idle/busy/up/down, labelled and bare), Input (plain, hint, suffix, invalid, disabled, read-only, no label), Toggle (interactive, static, disabled on/off, label-less). Layout in a companion `design-system.css` using tokens only — no raw hex, no raw px, no inline styles. `App.tsx` mounted it.

### 14.2 — Move it into the package

> ok, but move the files into @../../packages/ui/ and just import it on @src/App.tsx

**Result:** Gallery moved to `packages/ui/src/design-system.tsx` (restyled to the package's own conventions: semicolons, double quotes, relative sibling imports) and `packages/ui/src/styles/design-system.css`, which `styles/styles.css` now `@import`s — keeping the CSS out of the `.tsx` so `tsc --noEmit` still resolves. Exported from the barrel, so both `@repo/ui` and `@repo/ui/design-system` resolve it. `App.tsx` reduced to importing and rendering `<DesignSystem />`.
