import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// AC-10: no accessibility tooling is added — no axe or Lighthouse dependency in any
// workspace. Every workspace's package.json is scanned so none grows one.
const ROOT = join(__dirname, '..', '..', '..')
const FORBIDDEN = /\b(axe|lighthouse)/i
const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

const workspacePackageJsons = (): string[] =>
  ['apps', 'packages'].flatMap(group =>
    readdirSync(join(ROOT, group), { withFileTypes: true })
      .filter(entry => entry.isDirectory() && existsSync(join(ROOT, group, entry.name, 'package.json')))
      .map(entry => join(ROOT, group, entry.name, 'package.json')),
  ).concat(join(ROOT, 'package.json'))

const dependencyNames = (file: string): string[] => {
  const pkg = JSON.parse(readFileSync(file, 'utf8')) as Partial<Record<string, Record<string, string>>>
  return SECTIONS.flatMap(section => Object.keys(pkg[section] ?? {}))
}

describe('no accessibility tooling in any workspace (AC-10)', () => {
  it('scans the root package.json and every workspace', () => {
    const paths = workspacePackageJsons()

    expect(paths).toContain(join(ROOT, 'package.json'))
    for (const workspace of ['apps/sezzle-calculator', 'apps/calc-service', 'apps/api-gateway', 'packages/ui', 'packages/contracts', 'packages/eslint-config', 'packages/typescript-config']) {
      expect(paths, workspace).toContain(join(ROOT, ...workspace.split('/'), 'package.json'))
    }
  })

  it('has no axe or Lighthouse dependency in any workspace', () => {
    const hits = workspacePackageJsons().flatMap(file =>
      dependencyNames(file)
        .filter(name => FORBIDDEN.test(name))
        .map(name => `${relative(ROOT, file)}: ${name}`))

    expect(hits).toEqual([])
  })
})
