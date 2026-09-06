import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { NETWORK_MESSAGE, OUTAGE_MESSAGE, UNEXPECTED_MESSAGE } from './api/client.constants'

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

describe('App — the four error presentations (AC-12)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    {
      name: 'a domain error',
      reply: { status: 422, body: { error: { code: 'DIVISION_BY_ZERO', message: 'cannot divide by zero' } } },
      keys: ['1', '2', 'Divide', '0', 'Equals'],
      expression: '12 ÷ 0 =',
      message: 'cannot divide by zero',
    },
    {
      name: 'a backend outage',
      reply: { status: 502, body: { error: { code: 'SERVICE_UNAVAILABLE', message: 'calculation service is unreachable' } } },
      keys: ['1', '2', 'Add', '5', 'Equals'],
      expression: '12 + 5 =',
      message: OUTAGE_MESSAGE,
    },
    {
      name: 'a network failure',
      reply: undefined,
      keys: ['1', '2', 'Add', '5', 'Equals'],
      expression: '12 + 5 =',
      message: NETWORK_MESSAGE,
    },
    {
      name: 'an unexpected response',
      reply: { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: 'stray 400' } } },
      keys: ['1', '2', 'Add', '5', 'Equals'],
      expression: '12 + 5 =',
      message: UNEXPECTED_MESSAGE,
    },
  ] as const)('shows $name\'s message over the failed calculation, in the error state', async ({ reply, keys, expression, message }) => {
    const fetch = vi.fn(async () =>
      reply === undefined
        ? (() => { throw new Error('connection refused') })()
        : new Response(JSON.stringify(reply.body), {
            status: reply.status,
            headers: { 'content-type': 'application/json' },
          }),
    )
    vi.stubGlobal('fetch', fetch)

    render(<App />)
    const user = userEvent.setup()
    for (const name of keys) {
      await user.click(screen.getByRole('button', { name }))
    }

    await waitFor(() => {
      const display = screen.getByRole('status')
      expect(display.querySelector('.sc-display__value')?.textContent).toBe(message)
      expect(display.querySelector('.sc-display__meta > span:last-child')?.textContent).toBe(expression)
    })
    expect(screen.getByRole('status').classList.contains('sc-display--error')).toBe(true)
  })
})

describe('App — recovery after an outcome (AC-13)', () => {
  afterEach(() => vi.unstubAllGlobals())

  /** The four failure kinds of spec.md's error-contract table, as fetch mocks. */
  const failures = [
    { name: 'a domain error', reply: { status: 422, body: { error: { code: 'DIVISION_BY_ZERO', message: 'cannot divide by zero' } } } },
    { name: 'a backend outage', reply: { status: 502, body: { error: { code: 'SERVICE_UNAVAILABLE', message: 'calculation service is unreachable' } } } },
    { name: 'a network failure', reply: undefined },
    { name: 'an unexpected response', reply: { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: 'stray 400' } } } },
  ] as const

  const stub = (reply: (typeof failures)[number]['reply']) =>
    vi.fn(async () =>
      reply === undefined
        ? (() => { throw new Error('connection refused') })()
        : new Response(JSON.stringify(reply.body), {
            status: reply.status,
            headers: { 'content-type': 'application/json' },
          }),
    )

  const press = async (...names: string[]) => {
    const user = userEvent.setup()
    for (const name of names) {
      await user.click(screen.getByRole('button', { name }))
    }
  }

  it.each(failures)('a digit after $name clears the error and starts a fresh entry', async ({ reply }) => {
    vi.stubGlobal('fetch', stub(reply))

    render(<App />)
    await press('1', '2', 'Add', '5', 'Equals')
    await waitFor(() => expect(screen.getByRole('status').classList.contains('sc-display--error')).toBe(true))

    await press('7')

    const display = screen.getByRole('status')
    expect(display.querySelector('.sc-display__value')?.textContent).toBe('7')
    expect(display.querySelector('.sc-display__meta > span:last-child')?.textContent).toBe('')
    expect(display.classList.contains('sc-display--error')).toBe(false)
  })

  it('a decimal point after the error starts a fresh entry too', async () => {
    vi.stubGlobal('fetch', stub(failures[1].reply))

    render(<App />)
    await press('1', '2', 'Add', '5', 'Equals')
    await waitFor(() => expect(screen.getByRole('status').classList.contains('sc-display--error')).toBe(true))

    await press('Decimal point')

    const display = screen.getByRole('status')
    expect(display.querySelector('.sc-display__value')?.textContent).toBe('0.')
    expect(display.classList.contains('sc-display--error')).toBe(false)
  })

  it('C after the error returns the calculator to its starting state', async () => {
    vi.stubGlobal('fetch', stub(failures[2].reply))

    render(<App />)
    await press('1', '2', 'Add', '5', 'Equals')
    await waitFor(() => expect(screen.getByRole('status').classList.contains('sc-display--error')).toBe(true))

    await press('Clear')

    const display = screen.getByRole('status')
    expect(display.querySelector('.sc-display__value')?.textContent).toBe('0')
    expect(display.querySelector('.sc-display__meta > span:last-child')?.textContent).toBe('')
    expect(display.classList.contains('sc-display--error')).toBe(false)
  })

  it('C after a result returns the calculator to its starting state', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ result: 17 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ))

    render(<App />)
    await press('1', '2', 'Add', '5', 'Equals')
    await waitFor(() => expect(screen.getByRole('status').querySelector('.sc-display__value')?.textContent).toBe('17'))

    await press('Clear')

    const display = screen.getByRole('status')
    expect(display.querySelector('.sc-display__value')?.textContent).toBe('0')
    expect(display.querySelector('.sc-display__meta > span:last-child')?.textContent).toBe('')
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

describe('App shell styles — the 360px floor (AC-1)', () => {
  const css = readFileSync(resolve(__dirname, 'App.css'), 'utf8')
  const shell = css.match(/\.calculator\s*\{([^}]*)\}/)?.[1] ?? ''
  const spacing = readFileSync(resolve(__dirname, '../../../packages/ui/src/styles/tokens/spacing.css'), 'utf8')
  const keypad = readFileSync(resolve(__dirname, '../../../packages/ui/src/styles/components.css'), 'utf8')
    .split('/* ---- Keypad ---- */')[1]?.split('/* ---- ')[0] ?? ''
  const token = (name: string) => Number(spacing.match(new RegExp(`--${name}:\\s*([\\d.]+)px`))?.[1])
  const pad = keypad.match(/\.sc-keypad\s*\{([^}]*)\}/)?.[1] ?? ''

  it('the keypad, the widest fixed child, fits the viewport at 360, so nothing scrolls horizontally', () => {
    expect(shell).toMatch(/padding:\s*0 var\(--space-4\)/)
    expect(pad).toMatch(/grid-template-columns:\s*repeat\(4,\s*minmax\(var\(--key-size-sm\), 1fr\)\)/)
    expect(pad).toMatch(/gap:\s*var\(--space-3\)/)
    expect(pad).toMatch(/padding:\s*var\(--space-5\)/)
    expect(pad).toMatch(/border:\s*var\(--border-2\) solid/)
    // Four columns at their 48px floor + three gaps + the pad's padding and border, inside the shell's side padding.
    const padWidth = 4 * token('key-size-sm') + 3 * token('space-3') + 2 * token('space-5') + 2 * token('border-2')
    expect(padWidth + 2 * token('space-4')).toBeLessThanOrEqual(360)
  })
})
