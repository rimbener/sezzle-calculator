import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('no longer renders the design-system gallery anywhere', () => {
    render(<App />)

    expect(screen.queryByRole('heading', { name: 'Design System' })).toBeNull()
  })
})

describe('App — wired to the gateway (AC-9)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends a full key sequence ending in = to the gateway and shows the mocked reply\'s result', async () => {
    const fetch = vi.fn(async () =>
      new Response(JSON.stringify({ result: 17 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetch)

    render(<App />)
    const user = userEvent.setup()
    for (const name of ['1', '2', 'Add', '5', 'Equals']) {
      await user.click(screen.getByRole('button', { name }))
    }

    await waitFor(() => {
      const display = screen.getByRole('status')
      expect(display.querySelector('.sc-display__value')?.textContent).toBe('17')
      expect(display.querySelector('.sc-display__meta > span:last-child')?.textContent).toBe('12 + 5 =')
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toStrictEqual({ operation: 'add', operands: [12, 5] })
  })

  it('fires an immediately-firing unary key straight to the gateway, without =, and shows the mocked reply\'s result', async () => {
    const fetch = vi.fn(async () =>
      new Response(JSON.stringify({ result: 3 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetch)

    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '9' }))
    await user.click(screen.getByRole('button', { name: 'Square root' }))

    await waitFor(() => {
      const display = screen.getByRole('status')
      expect(display.querySelector('.sc-display__value')?.textContent).toBe('3')
      expect(display.querySelector('.sc-display__meta > span:last-child')?.textContent).toBe('sqrt(9) =')
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toStrictEqual({ operation: 'sqrt', operands: [9] })
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
