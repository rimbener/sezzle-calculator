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
