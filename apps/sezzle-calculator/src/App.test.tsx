import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('no longer renders the design-system gallery anywhere', () => {
    render(<App />)

    expect(screen.queryByRole('heading', { name: 'Design System' })).toBeNull()
  })
})

describe('App shell styles', () => {
  const css = readFileSync(resolve(__dirname, 'App.css'), 'utf8')
  const shell = css.match(/\.calculator\s*\{([^}]*)\}/)?.[1] ?? ''

  it('caps the calculator column at --shell-max and centres it', () => {
    expect(shell).toMatch(/max-width:\s*var\(--shell-max\)/)
    expect(shell).toMatch(/margin(-inline)?:.*auto/)
  })

  it('uses only design-system custom properties: no raw hex value, no raw pixel size', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(css).not.toMatch(/\d+px/)
  })
})
