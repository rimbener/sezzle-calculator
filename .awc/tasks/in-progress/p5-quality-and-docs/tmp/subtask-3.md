# subtask-3 — Strike FE-12 from the docs

- **id:** subtask-3
- **title:** Strike FE-12 from the docs
- **slice:** C — docs strike
- **criteria:** AC-9
- **status:** todo
- **paths:**
  - `docs/PRD-P0.md`
  - `docs/spec-phases.md`
  - `AGENTS.md`

Remove FE-12 as a requirement everywhere it is stated as one:

- `docs/PRD-P0.md` — drop goal 7 ("Accessibility: The UI meets WCAG 2.2 level AA") from §2, delete the FE-12 entry from §7.2, and remove "accessibility audit (FE-12)" from §11's phase-4 row.
- `docs/spec-phases.md` — drop FE-12 from the phase-5 row's coverage list (`FE-6, FE-12, XC-2` → `FE-6, XC-2`) and from any other place it is stated as this phase's scope. The prompt log (`docs/prompts.md`) is a historical record — leave it alone.
- `AGENTS.md` — rewrite the architecture-rules line that reads "Target is WCAG 2.2 AA with native `<button>`/`<input>` elements and a 360px-wide floor" to keep the native-elements and 360px-floor parts and drop the WCAG target (the `CLAUDE.md` symlink follows automatically).

Leave `docs/PRD-P1.md` alone: FE-9's line (33) cites FE-12 — "(Basic keyboard operability of all controls is already P0 — FE-12; this adds typed shortcuts.)" — and that citation dangles once the strike lands. The strike breadth is a recorded human decision (story interview entries 1–2: PRD-P0, spec-phases, AGENTS.md); sweeping PRD-P1 would widen it without a human call, and basic keyboard operability stays true via the native `<button>`/`<input>` foundations, which remain.

The strike removes the requirement, not the foundations: native `<button>`/`<input>` elements, the `aria-live` display, and `role="alert"` errors stay as they are, and no sentence gains a claim that an audit runs. Do not touch `docs/REQUIREMENTS.md` (the original assessment brief) or the per-service READMEs (they describe what exists, not the WCAG target).
