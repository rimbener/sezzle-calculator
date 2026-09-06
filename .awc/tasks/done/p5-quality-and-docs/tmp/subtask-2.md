# subtask-2 — Root README and .nvmrc

- **id:** subtask-2
- **title:** Root README and .nvmrc
- **slice:** B — README
- **criteria:** AC-6, AC-7, AC-8
- **status:** done
- **paths:**
  - `README.md` (root — replaces the stock Turborepo starter)
  - `.nvmrc` (new, repo root)

Replace the starter README with the project's own, self-sufficient for UC-11: prerequisites with the Node pin (`.nvmrc` at `22.22.2`, matching the root `engines.node >=22.22.2`, plus the note that npm 11/12 warns by design — see AGENTS.md's `devEngines` rationale), install, run, and test commands that work verbatim from a fresh clone (`npm install`, `npm run dev` / the per-workspace turbo filters, `npm test`, `npm run build`), an architecture diagram (SPA → api-gateway :3000 → calc-service :3001, talk over HTTP only), the assumptions and trade-offs (why sync HTTP, static env-var config, one calc service), the seven operations and their meanings, and links to the per-service READMEs (`apps/api-gateway`, `apps/calc-service`, `apps/sezzle-calculator`, `packages/contracts`) for API details and curl examples — the root README must never contradict them. It may reference XC-3's percentage definition where it lives (calc-service README); it must not duplicate the per-service docs' depth.

Verify by performing UC-11 yourself against what you wrote: fresh-clone fidelity (commands run as written), all suites green, both services + SPA start, UC-1…UC-8 exercisable, under 10 minutes, no undocumented steps.
