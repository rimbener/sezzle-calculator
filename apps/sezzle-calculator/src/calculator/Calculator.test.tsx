import { render, screen } from '@testing-library/react'
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
