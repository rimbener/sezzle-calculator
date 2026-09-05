import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// AC-2's docs half: the pad ships with no sign-toggle key, so the scope docs must say the same.
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

// AC-8's docs half: the cap is 15 characters, point included — not "significant digits".
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

// `AGENTS.md` describes the test suites; it must name the frontend and `@repo/ui` suites, not deny them.
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

// `spec.md` assigns the app README "what the calculator does today": it must describe
// the calculator, not the Vite template.
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

  // `=` emits a request nothing answers yet; the README must say so and name the seam.
  it('says `=` is a dead end until the API client lands, through the onRequest boundary', () => {
    expect(readme).toMatch(/`=`/)
    expect(readme).toMatch(/dead end/i)
    expect(readme).toMatch(/Phase 4|API client/)
    expect(readme).toMatch(/onRequest/)
  })
})

// Every pin above reads a file outside this workspace, which Turbo's default hash skips,
// so a cached pass would replay over a docs edit. turbo.json lists them as `test` inputs.
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
