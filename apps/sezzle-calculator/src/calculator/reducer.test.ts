import { describe, expect, it } from 'vitest'
import { type Action, reducer } from './reducer'
import { INITIAL_STATE } from './state'

const digit = (d: string): Action => ({ type: 'digit', digit: d })
const point: Action = { type: 'point' }
const clear: Action = { type: 'clear' }

/** Runs a key sequence through the reducer from the starting state. */
const run = (...actions: Action[]) => actions.reduce(reducer, INITIAL_STATE)

describe('reducer — digit entry (AC-4)', () => {
  it('appends digits to the operand being entered: 1, 2 gives 12', () => {
    expect(run(digit('1'), digit('2')).operand).toBe('12')
  })
})

describe('reducer — leading zero absorbed (AC-5)', () => {
  it('keeps 0 on 0 and never shows 05 or 005: 0, 0, 5 gives 5', () => {
    expect(run(digit('0')).operand).toBe('0')
    expect(run(digit('0'), digit('0')).operand).toBe('0')
    expect(run(digit('0'), digit('0'), digit('5')).operand).toBe('5')
  })
})

describe('reducer — the decimal point keeps its zeros (AC-6)', () => {
  it('shows 0. on the starting 0, and ., 0, 0, 7 gives 0.007', () => {
    expect(run(point).operand).toBe('0.')
    expect(run(point, digit('0'), digit('0'), digit('7')).operand).toBe('0.007')
  })
})

describe('reducer — a second decimal point is ignored (AC-7)', () => {
  it('returns the state unchanged when the operand already holds a point', () => {
    const before = run(digit('1'), point, digit('5'))

    expect(reducer(before, point)).toBe(before)
    expect(before.operand).toBe('1.5')
  })
})

describe('reducer — the operand stops at 15 characters, point included (AC-8)', () => {
  const fifteenDigits = '123456789012345'.split('').map(digit)

  it('ignores the 16th digit and returns the state unchanged', () => {
    const atCap = run(...fifteenDigits)

    expect(atCap.operand).toHaveLength(15)
    expect(reducer(atCap, digit('6'))).toBe(atCap)
  })

  it('ignores a point as the 16th character too', () => {
    const atCap = run(...fifteenDigits)

    expect(reducer(atCap, point)).toBe(atCap)
  })

  it('counts the decimal point as one of the 15 characters', () => {
    const atCap = run(digit('1'), point, ...'2345678901234'.split('').map(digit))

    expect(atCap.operand).toBe('1.2345678901234')
    expect(atCap.operand).toHaveLength(15)
    expect(reducer(atCap, digit('5'))).toBe(atCap)
  })
})

describe('reducer — C while entering (AC-9)', () => {
  it('returns the calculator to its starting state', () => {
    expect(run(digit('1'), point, digit('5'), clear)).toEqual(INITIAL_STATE)
  })
})
