import type { CalculateRequest } from '@repo/contracts'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Calculator } from './Calculator'
import type { CalculationOutcome } from './state'

/** The value and expression slots, read where `Display` puts them. */
function readout() {
  const display = screen.getByRole('status')
  return {
    value: display.querySelector('.sc-display__value')?.textContent ?? null,
    expression: display.querySelector('.sc-display__meta > span:last-child')?.textContent ?? null,
  }
}

/** `Display`'s elected state, read off its modifier class. */
const displayState = () => {
  const state = screen.getByRole('status').classList
  return state.contains('sc-display--error') ? 'error' : state.contains('sc-display--busy') ? 'busy' : 'idle'
}

/** A boundary that never answers: the calculator stays pending, as the app does without `onRequest`. */
const unanswered = () => vi.fn<(request: CalculateRequest) => Promise<CalculationOutcome>>(() => new Promise(() => {}))

/** Clicks keys by accessible name, in order; `.` is the decimal point. */
async function press(...names: string[]) {
  const user = userEvent.setup()
  for (const name of names) {
    await user.click(screen.getByRole('button', { name: name === '.' ? 'Decimal point' : name }))
  }
}

describe('Calculator — the shell (AC-3)', () => {
  it('starts with the value 0 and an empty expression line before any key is pressed', () => {
    render(<Calculator />)

    expect(readout()).toEqual({ value: '0', expression: '' })
  })
})

describe('Calculator — the key set (AC-2)', () => {
  it('has a native button for every digit and for the decimal point', () => {
    render(<Calculator />)

    for (const name of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Decimal point']) {
      const key = screen.getByRole('button', { name })
      expect(key.tagName).toBe('BUTTON')
    }
  })
})

describe('Calculator — operations, equals and clear (AC-2)', () => {
  it('has a native button for all seven operations, for equals and for clear', () => {
    render(<Calculator />)

    const names = ['Add', 'Subtract', 'Multiply', 'Divide', 'Power', 'Square root', 'Percentage', 'Equals', 'Clear']
    for (const name of names) {
      const key = screen.getByRole('button', { name })
      expect(key.tagName).toBe('BUTTON')
    }
  })
})

describe('Calculator — FE-1 amended (AC-2)', () => {
  it('has no sign-toggle key', () => {
    render(<Calculator />)

    expect(screen.queryByRole('button', { name: /sign|negate|plus.?minus|\+\/-|±/i })).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(20)
  })
})

describe('Calculator — entry driven through the UI (AC-10)', () => {
  it('builds the operand from clicked digits: 1, 2 shows 12', async () => {
    render(<Calculator />)

    await press('1', '2')

    expect(readout()).toEqual({ value: '12', expression: '' })
  })

  it('absorbs a leading zero: 0, 0, 5 shows 5, never 05 (AC-5)', async () => {
    render(<Calculator />)

    await press('0', '0')
    expect(readout().value).toBe('0')

    await press('5')
    expect(readout().value).toBe('5')
  })

  it('keeps the zeros after the decimal point: ., 0, 0, 7 shows 0.007 (AC-6)', async () => {
    render(<Calculator />)

    await press('.')
    expect(readout().value).toBe('0.')

    await press('0', '0', '7')
    expect(readout().value).toBe('0.007')
  })

  it('silently ignores a second decimal point (AC-7)', async () => {
    render(<Calculator />)

    await press('1', '.', '5', '.')

    expect(readout()).toEqual({ value: '1.5', expression: '' })
  })

  it('stops the operand at 15 characters, the point included (AC-8)', async () => {
    render(<Calculator />)

    await press('1', '.', ...'2345678901234'.split(''))
    expect(readout().value).toBe('1.2345678901234')

    await press('5')
    expect(readout()).toEqual({ value: '1.2345678901234', expression: '' })
  })

  it('C returns the calculator to its starting state while an operand is being entered (AC-9)', async () => {
    render(<Calculator />)

    await press('1', '.', '5', 'Clear')

    expect(readout()).toEqual({ value: '0', expression: '' })
  })
})

describe('Calculator — a calculation driven end to end through the UI (AC-25)', () => {
  it('calls the request boundary exactly once with the calculation and leaves the readout pending', async () => {
    const onRequest = unanswered()
    render(<Calculator onRequest={onRequest} />)

    await press('1', '2', 'Add', '5', 'Equals')

    expect(onRequest).toHaveBeenCalledTimes(1)
    expect(onRequest).toHaveBeenCalledWith({ operation: 'add', operands: [12, 5] })
    expect(readout()).toEqual({ value: '5', expression: '12 + 5 =' })
    expect(displayState()).toBe('busy')
  })
})

describe('Calculator — outcomes projected onto the display (AC-19, AC-22)', () => {
  it('shows a result outcome as the number over the completed calculation', async () => {
    render(<Calculator onRequest={async () => ({ result: 17 })} />)

    await press('1', '2', 'Add', '5', 'Equals')

    await waitFor(() => expect(readout()).toEqual({ value: '17', expression: '12 + 5 =' }))
    expect(displayState()).toBe('idle')
  })

  it('shows an error outcome as the carried message over the failed calculation, in the error state', async () => {
    render(<Calculator onRequest={async () => ({ error: { code: 'DIVISION_BY_ZERO', message: 'carried by the outcome' } })} />)

    await press('1', '2', 'Divide', '0', 'Equals')

    await waitFor(() => expect(readout()).toEqual({ value: 'carried by the outcome', expression: '12 ÷ 0 =' }))
    expect(displayState()).toBe('error')
  })
})

describe('Calculator — pending is frozen through the UI (AC-18)', () => {
  it('ignores every key, C included, and emits no second request', async () => {
    const onRequest = unanswered()
    render(<Calculator onRequest={onRequest} />)

    await press('9', 'Square root')
    expect(readout()).toEqual({ value: '9', expression: 'sqrt(9) =' })

    await press('7', '.', 'Add', 'Square root', 'Equals', 'Clear')

    expect(readout()).toEqual({ value: '9', expression: 'sqrt(9) =' })
    expect(displayState()).toBe('busy')
    expect(onRequest).toHaveBeenCalledTimes(1)
  })
})

describe('Calculator — entry refusals and C emit no request (AC-7, AC-9)', () => {
  it('a second decimal point and C leave the boundary uncalled', async () => {
    const onRequest = unanswered()
    render(<Calculator onRequest={onRequest} />)

    await press('1', '.', '5', '.', 'Clear')

    expect(readout()).toEqual({ value: '0', expression: '' })
    expect(onRequest).not.toHaveBeenCalled()
  })
})
