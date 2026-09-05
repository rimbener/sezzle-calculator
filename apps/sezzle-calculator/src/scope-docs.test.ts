import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// AC-2's docs half: `docs/` is the source of truth for scope, and the pad ships
// with no sign-toggle key, so the scope docs must say the same.
const docs = (name: string) => readFileSync(resolve(__dirname, '../../../docs', name), 'utf8')
const line = (text: string, marker: string) => text.split('\n').find(l => l.includes(marker)) ?? ''

describe('scope docs agree with the pad (AC-2)', () => {
  const prd = docs('PRD-P0.md')
  const phases = docs('spec-phases.md')

  it('PRD-P0 lists no sign toggle under FE-1 or FE-3', () => {
    expect(line(prd, '**FE-1')).not.toBe('')
    expect(line(prd, '**FE-1')).not.toMatch(/sign toggle/i)
    expect(line(prd, '**FE-3')).not.toBe('')
    expect(line(prd, '**FE-3')).not.toMatch(/sign toggle/i)
  })

  it('PRD-P0 records Open Question 5 as settled by this bundle, with no sign toggle', () => {
    const oq5 = line(prd, 'Calculator input state machine')
    expect(oq5).toMatch(/^5\. \*\*\(Resolved\)\*\*/)
    expect(oq5).toMatch(/p3-calculator-ui/)
    expect(oq5).not.toMatch(/sign toggle/i)
  })

  it('spec-phases lists no sign toggle in Phase 3', () => {
    const phase3 = phases.split('## Phase 3')[1]?.split('\n## ')[0] ?? ''
    expect(phase3).not.toBe('')
    expect(phase3).not.toMatch(/sign toggle/i)
  })
})

// AC-8's docs half: the operand cap the machine enforces counts 15 characters, the
// decimal point included — not "significant digits" — and the scope docs must say so.
describe('scope docs state the operand cap as the machine enforces it (AC-8)', () => {
  const prd = docs('PRD-P0.md')
  const phases = docs('spec-phases.md')

  it('PRD-P0 FE-3 caps an operand at 15 characters, the decimal point included', () => {
    const fe3 = line(prd, '**FE-3')
    expect(fe3).not.toMatch(/significant digits/i)
    expect(fe3).toMatch(/15 characters/)
    expect(fe3).toMatch(/decimal point included/i)
  })

  it('spec-phases describes the Phase 3 cap in characters, not significant digits', () => {
    const phase3 = phases.split('## Phase 3')[1]?.split('\n## ')[0] ?? ''
    expect(phase3).not.toMatch(/significant.digit/i)
    expect(phase3).toMatch(/15-character cap/)
  })
})

// review-slice-1 F-1: `AGENTS.md` describes the test suites; once the frontend and
// `@repo/ui` grow suites of their own the sentence must name them, not deny them.
describe('AGENTS.md names every workspace with a test suite', () => {
  const tests = line(readFileSync(resolve(__dirname, '../../../AGENTS.md'), 'utf8'), 'Tests: Vitest')

  it('names the frontend and @repo/ui suites and no longer says they have none', () => {
    expect(tests).not.toBe('')
    expect(tests).not.toMatch(/still have none/)
    expect(tests).toMatch(/apps\/sezzle-calculator\/src\/\*\*\/\*\.test\.tsx?/)
    expect(tests).toMatch(/packages\/ui\/src\/\*\.test\.tsx/)
    expect(tests).toMatch(/afterEach\(cleanup\)/)
  })
})

// review-slice-2 F-1: `spec.md` assigns `apps/sezzle-calculator/README.md` "what the
// calculator does today". Once the calculator types, the README must say so — and
// stop being the Vite template.
describe('the app README describes what the calculator does today', () => {
  const readme = readFileSync(resolve(__dirname, '../README.md'), 'utf8')

  it('is no longer the Vite template', () => {
    expect(readme).not.toMatch(/^# React \+ TypeScript \+ Vite/)
    expect(readme).not.toMatch(/This template provides a minimal setup/)
  })

  it('states the entry rules the reducer enforces', () => {
    expect(readme).toMatch(/leading zero/i)
    expect(readme).toMatch(/one decimal point/i)
    expect(readme).toMatch(/15 characters/)
    expect(readme).toMatch(/`C`/)
  })

  it('states the operation rules the machine enforces', () => {
    expect(readme).toMatch(/replaces/i)
    expect(readme).toMatch(/sqrt|square root/i)
    expect(readme).toMatch(/pending/)
    expect(readme).not.toMatch(/not (yet )?wired/i)
  })

  // Slice 3: `=` emits a request nothing answers yet — the README must say so, and name the seam.
  it('says `=` is a dead end until the API client lands, through the onRequest boundary', () => {
    expect(readme).toMatch(/`=`/)
    expect(readme).toMatch(/dead end/i)
    expect(readme).toMatch(/Phase 4|API client/)
    expect(readme).toMatch(/onRequest/)
  })
})

// review F-1: every pin above reads a file outside this workspace, which Turbo's
// default hash does not cover — the cached green would replay over a docs edit.
// The workspace turbo.json names those files as inputs of the `test` task.
describe('the test task hashes the docs it pins', () => {
  const turbo = JSON.parse(readFileSync(resolve(__dirname, '../turbo.json'), 'utf8'))

  it('extends the root config and keeps the default inputs', () => {
    expect(turbo.extends).toEqual(['//'])
    expect(turbo.tasks.test.inputs).toContain('$TURBO_DEFAULT$')
  })

  it('lists docs/*.md and AGENTS.md at the repo root as inputs', () => {
    expect(turbo.tasks.test.inputs).toContain('$TURBO_ROOT$/docs/*.md')
    expect(turbo.tasks.test.inputs).toContain('$TURBO_ROOT$/AGENTS.md')
  })
})
