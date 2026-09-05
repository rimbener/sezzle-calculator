import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Calculator } from './Calculator'

/** The three readout slots as the user sees them: `Display` puts value and expression in fixed places. */
function readout() {
  const display = screen.getByRole('status')
  return {
    value: display.querySelector('.sc-display__value')?.textContent ?? null,
    expression: display.querySelector('.sc-display__meta > span:last-child')?.textContent ?? null,
  }
}

/** Clicks keys by accessible name, in order — digits and the point by their labels. */
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
