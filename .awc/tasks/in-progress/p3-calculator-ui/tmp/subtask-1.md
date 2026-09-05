# subtask-1 — `Keypad` in the design system

- **slice:** 1 — the calculator shell
- **criteria:** AC-1
- **status:** todo
- **paths:** `packages/ui/src/keypad.tsx`, `packages/ui/src/index.ts`, `packages/ui/src/styles/components.css`, `packages/ui/src/design-system.tsx`, `packages/ui/src/keypad.test.tsx`, `CLAUDE.md`

A grid container and nothing more. `Keypad` renders its children into a CSS grid, forwards the rest of its DOM props, and composes class names with `clsx` like every other component in the package. It knows no operation names and imports nothing from `@repo/contracts`; `Key`'s existing `span` prop already handles a wide `0` or `=`.

Its classes go in `components.css` beside `.sc-key`, named `sc-keypad*`, and obey `BRAND.md`: gaps and radii from the spacing tokens, `var(--border-2) solid var(--border-strong)` on the pad itself, `--shadow-panel` as its shadow. No raw hex value and no raw pixel size anywhere in the new CSS.

`packages/ui` follows `@repo/eslint-config` — semicolons, double quotes — not the app's style. Export the component and its props type from `src/index.ts`, and add a keypad section to `design-system.tsx` so the gallery still shows everything the package offers once the app stops rendering it. `CLAUDE.md` lists that barrel by name under `## @repo/ui` — add `Keypad` in the same slice so the documented barrel does not go stale.

Tests render a keypad holding a few `Key` children and assert they are all present and that the pad carries its class.
