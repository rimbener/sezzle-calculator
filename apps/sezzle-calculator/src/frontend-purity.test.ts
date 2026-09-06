import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GATEWAY_URL_VARIABLE } from './api/client.constants'

// AC-24: the frontend computes nothing and calls nothing. No source under the app or
// `@repo/ui` uses `Math` or number parsing, except the reducer turning entered text
// into the request's numbers; the one `fetch` lives in the API client (AC-7).
const ROOTS = [join(__dirname, '.'), join(__dirname, '../../../packages/ui/src')]
const FORBIDDEN = [/\bXMLHttpRequest\b/, /\bWebSocket\b/, /\bMath\./, /\beval\s*\(/, /\bparseFloat\s*\(/, /\bparseInt\s*\(/]
const REQUEST_BUILDER = join(__dirname, 'calculator/reducer.ts')
const API_CLIENT = join(__dirname, 'api/client.ts')
const API_CLIENT_CONSTANTS = join(__dirname, 'api/client.constants.ts')

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

  it('calls fetch in the API client alone (AC-7)', () => {
    const fetches = files.filter(file => /\bfetch\s*\(/.test(source(file))).map(file => relative(__dirname, file))

    expect(fetches).toEqual([relative(__dirname, API_CLIENT)])
  })

  it('names the gateway URL env var in the API client constants alone (AC-7)', () => {
    const named = files.filter(file => source(file).includes(GATEWAY_URL_VARIABLE)).map(file => relative(__dirname, file))

    expect(named).toEqual([relative(__dirname, API_CLIENT_CONSTANTS)])
  })

  it('reads entered text as a number in the reducer alone, where the request is built', () => {
    const parsing = files.filter(file => /\bNumber\s*\(/.test(source(file)))

    expect(parsing).toEqual([REQUEST_BUILDER])
  })
})
