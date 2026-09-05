import { describe, expect, it } from 'vitest'
import { toDisplay } from './display'
import { INITIAL_STATE } from './state'

describe('display — the projection from state to the Display slots', () => {
  it('shows the starting state as value 0, an empty expression line and the idle state', () => {
    expect(toDisplay(INITIAL_STATE)).toEqual({ value: '0', expression: '', state: 'idle' })
  })

  it('shows the operand being entered as the value, as typed', () => {
    expect(toDisplay({ status: 'entering', operands: ['0.007'] })).toEqual({ value: '0.007', expression: '', state: 'idle' })
  })
})

describe('display — a recorded operation shows in the expression line (AC-11)', () => {
  it.each([
    ['add', '12 +'],
    ['subtract', '12 −'],
    ['multiply', '12 ×'],
    ['divide', '12 ÷'],
    ['power', '12 ^'],
    ['percentage', '12% of'],
  ] as const)('keeps 12 in the value slot and renders %s as "%s"', (operation, expression) => {
    expect(toDisplay({ status: 'entering', operands: ['12'], operation })).toEqual({ value: '12', expression, state: 'idle' })
  })
})

describe('display — pending holds the emitted calculation still (AC-18)', () => {
  it.each([
    [{ operation: 'add', operands: ['12', '5'] }, '5', '12 + 5 ='],
    [{ operation: 'sqrt', operands: ['9'] }, '9', 'sqrt(9) ='],
    [{ operation: 'percentage', operands: ['12', '50'] }, '50', '12% of 50 ='],
  ] as const)('shows %o as the operand that was entered, the calculation with = and the idle state', (calculation, value, expression) => {
    const request = { operation: calculation.operation, operands: calculation.operands.map(Number) }

    expect(toDisplay({ status: 'pending', calculation, request })).toEqual({ value, expression, state: 'idle' })
  })
})

describe('display — a result (AC-19)', () => {
  it('puts the returned number in the value slot and the completed calculation in the expression line', () => {
    expect(toDisplay({ status: 'result', calculation: { operation: 'add', operands: ['12', '5'] }, value: 17 }))
      .toEqual({ value: '17', expression: '12 + 5 =', state: 'idle' })
    expect(toDisplay({ status: 'result', calculation: { operation: 'sqrt', operands: ['9'] }, value: 3 }))
      .toEqual({ value: '3', expression: 'sqrt(9) =', state: 'idle' })
  })

  it('renders the number as JavaScript does, unformatted (FE-6 is Phase 5)', () => {
    expect(toDisplay({ status: 'result', calculation: { operation: 'divide', operands: ['1', '3'] }, value: 1 / 3 }).value).toBe('0.3333333333333333')
  })
})

describe('display — an error (AC-22)', () => {
  it('shows the carried message in the value slot over the failed calculation, in the error state', () => {
    expect(toDisplay({ status: 'error', calculation: { operation: 'divide', operands: ['12', '0'] }, message: 'carried by the outcome' }))
      .toEqual({ value: 'carried by the outcome', expression: '12 ÷ 0 =', state: 'error' })
  })
})
