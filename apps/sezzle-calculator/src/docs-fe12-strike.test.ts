import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// FE-12 is struck: no accessibility or WCAG requirement remains in PRD-P0, spec-phases, or AGENTS.md.
// prompts.md and PRD-P1.md are historical records; the p5 launch-args line in spec-phases.md is the
// verbatim command that produced this run — the one allowed mention.
const ROOT = join(__dirname, '..', '..', '..')
const LAUNCH_ARGS = /^\/prd-to-spec p5-quality-and-docs/m
const FORBIDDEN = /\bFE-12\b|WCAG|axe|Lighthouse|accessibility|4\.5:1/i

const flaggedLines = (file: string, options?: { skipLaunchArgs?: boolean }): string[] =>
  readFileSync(file, 'utf8')
    .split('\n')
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => !(options?.skipLaunchArgs && LAUNCH_ARGS.test(line)) && FORBIDDEN.test(line))
    .map(({ line, index }) => `${file}:${index + 1}: ${line.trim()}`)

describe('FE-12 is struck from the docs (AC-9)', () => {
  it('names no audit or WCAG target in PRD-P0 or spec-phases outside the launch-args record', () => {
    const hits = [
      ...flaggedLines(join(ROOT, 'docs', 'PRD-P0.md')),
      ...flaggedLines(join(ROOT, 'docs', 'spec-phases.md'), { skipLaunchArgs: true }),
    ]

    expect(hits).toEqual([])
  })

  it('states the 360px floor and native elements in AGENTS.md without the WCAG target', () => {
    const agents = readFileSync(join(ROOT, 'AGENTS.md'), 'utf8')

    expect(agents).not.toMatch(/WCAG/i)
    expect(agents).toMatch(/native `<button>`\/`<input>` elements/i)
    expect(agents).toMatch(/360px-wide floor/)
  })

  it('keeps the verbatim p5 launch-args record', () => {
    const phases = readFileSync(join(ROOT, 'docs', 'spec-phases.md'), 'utf8')

    expect(phases).toMatch(LAUNCH_ARGS)
  })
})
