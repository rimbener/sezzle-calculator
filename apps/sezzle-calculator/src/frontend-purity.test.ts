import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// AC-24: the frontend computes nothing and calls nothing. No source file under the app
// or `@repo/ui` reaches for `fetch`, `Math` or number parsing beyond the one place the
// entered text becomes the contract's number — the request the reducer emits.
const ROOTS = [join(__dirname, '.'), join(__dirname, '../../../packages/ui/src')]
const FORBIDDEN = [/\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bWebSocket\b/, /\bMath\./, /\beval\s*\(/, /\bparseFloat\s*\(/, /\bparseInt\s*\(/]
const REQUEST_BUILDER = join(__dirname, 'calculator/reducer.ts')

const sourcesUnder = (path: string): string[] => {
  if (!statSync(path).isDirectory()) return /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : []
  return readdirSync(path).flatMap(name => sourcesUnder(join(path, name)))
}

describe('the frontend computes nothing (AC-24)', () => {
  const files = ROOTS.flatMap(sourcesUnder)
  const source = (file: string) => readFileSync(file, 'utf8')

  it('scans the calculator and the design system', () => {
    expect(files).toContain(join(__dirname, 'calculator/Calculator.tsx'))
    expect(files).toContain(join(ROOTS[1], 'display.tsx'))
  })

  it.each(FORBIDDEN)('has no source file matching %s', (pattern) => {
    const hits = files.filter(file => pattern.test(source(file))).map(file => relative(__dirname, file))

    expect(hits).toEqual([])
  })

  it('reads entered text as a number in the reducer alone, where the request is built', () => {
    const parsing = files.filter(file => /\bNumber\s*\(/.test(source(file)))

    expect(parsing).toEqual([REQUEST_BUILDER])
  })
})
