import { describe, expect, it } from 'vitest'
import { calculateRequestSchema, type Operation } from '@repo/contracts'
import { type Action, reducer } from './reducer'
import { type CalculationOutcome, type CalculatorState, INITIAL_STATE } from './state'

const digit = (d: string): Action => ({ type: 'digit', digit: d })
const point: Action = { type: 'point' }
const clear: Action = { type: 'clear' }

/** Runs a key sequence through the reducer from the starting state. */
const run = (...actions: Action[]) => actions.reduce(reducer, INITIAL_STATE)

/** The operands of an entering state — or the status, so a wrong status fails loudly. */
const operands = (state: CalculatorState) => (state.status === 'entering' ? state.operands : state.status)

describe('reducer — digit entry (AC-4)', () => {
  it('appends digits to the operand being entered: 1, 2 gives 12', () => {
    expect(operands(run(digit('1'), digit('2')))).toEqual(['12'])
  })
})

describe('reducer — leading zero absorbed (AC-5)', () => {
  it('keeps 0 on 0 and never shows 05 or 005: 0, 0, 5 gives 5', () => {
    expect(operands(run(digit('0')))).toEqual(['0'])
    expect(operands(run(digit('0'), digit('0')))).toEqual(['0'])
    expect(operands(run(digit('0'), digit('0'), digit('5')))).toEqual(['5'])
  })
})

describe('reducer — the decimal point keeps its zeros (AC-6)', () => {
  it('shows 0. on the starting 0, and ., 0, 0, 7 gives 0.007', () => {
    expect(operands(run(point))).toEqual(['0.'])
    expect(operands(run(point, digit('0'), digit('0'), digit('7')))).toEqual(['0.007'])
  })
})

describe('reducer — a second decimal point is ignored (AC-7)', () => {
  it('returns the state unchanged when the operand already holds a point', () => {
    const before = run(digit('1'), point, digit('5'))

    expect(reducer(before, point)).toBe(before)
    expect(operands(before)).toEqual(['1.5'])
  })
})

describe('reducer — the operand stops at 15 characters, point included (AC-8)', () => {
  const fifteenDigits = '123456789012345'.split('').map(digit)

  it('ignores the 16th digit and returns the state unchanged', () => {
    const atCap = run(...fifteenDigits)

    expect(operands(atCap)).toEqual(['123456789012345'])
    expect(reducer(atCap, digit('6'))).toBe(atCap)
  })

  it('ignores a point as the 16th character too', () => {
    const atCap = run(...fifteenDigits)

    expect(reducer(atCap, point)).toBe(atCap)
  })

  it('counts the decimal point as one of the 15 characters', () => {
    const atCap = run(digit('1'), point, ...'2345678901234'.split('').map(digit))

    expect(operands(atCap)).toEqual(['1.2345678901234'])
    expect(reducer(atCap, digit('5'))).toBe(atCap)
  })
})

describe('reducer — C while entering (AC-9)', () => {
  it('returns the calculator to its starting state', () => {
    expect(run(digit('1'), point, digit('5'), clear)).toEqual(INITIAL_STATE)
  })
})

const operation = (op: Operation): Action => ({ type: 'operation', operation: op })

describe('reducer — an operation key records the operation (AC-11)', () => {
  it('commits the entered operand as the left one and records the operation: 1, 2, + ', () => {
    expect(run(digit('1'), digit('2'), operation('add'))).toEqual({ status: 'entering', operands: ['12'], operation: 'add' })
  })
})

describe('reducer — the second operand (AC-11, AC-12)', () => {
  it('starts a second operand after the operation, leaving the first committed: 1, 2, +, 5', () => {
    expect(run(digit('1'), digit('2'), operation('add'), digit('5'))).toEqual({ status: 'entering', operands: ['12', '5'], operation: 'add' })
  })

  it('starts the second operand from a bare point too: 1, 2, +, . gives 0.', () => {
    expect(operands(run(digit('1'), digit('2'), operation('add'), point))).toEqual(['12', '0.'])
  })
})

describe('reducer — a second operation key replaces the recorded one and calculates nothing (AC-12)', () => {
  it('leaves the left operand and the typed second operand alone: 1, 2, +, 5, × is 12 × 5', () => {
    expect(run(digit('1'), digit('2'), operation('add'), digit('5'), operation('multiply')))
      .toEqual({ status: 'entering', operands: ['12', '5'], operation: 'multiply' })
  })

  it('replaces the operation pressed immediately after another one: 1, 2, +, × is 12 ×', () => {
    expect(run(digit('1'), digit('2'), operation('add'), operation('multiply')))
      .toEqual({ status: 'entering', operands: ['12'], operation: 'multiply' })
  })
})

describe('reducer — the retained second operand is still the entry in progress (AC-13)', () => {
  it('appends the next digit to it: 1, 2, +, 5, ×, 7 is 12 × 57', () => {
    expect(run(digit('1'), digit('2'), operation('add'), digit('5'), operation('multiply'), digit('7')))
      .toEqual({ status: 'entering', operands: ['12', '57'], operation: 'multiply' })
  })

  it('appends the point to it too: 1, 2, +, 5, ×, . is 12 × 5.', () => {
    expect(operands(run(digit('1'), digit('2'), operation('add'), digit('5'), operation('multiply'), point))).toEqual(['12', '5.'])
  })
})

const equals: Action = { type: 'equals' }

describe('reducer — = is inert while the entry is incomplete (AC-14)', () => {
  it('returns the state unchanged when no operation is recorded', () => {
    const before = run(digit('1'), digit('2'))

    expect(reducer(before, equals)).toBe(before)
  })

  it('returns the state unchanged when the second operand has had no key appended', () => {
    const before = run(digit('1'), digit('2'), operation('add'))

    expect(reducer(before, equals)).toBe(before)
  })
})

describe('reducer — sqrt is refused while an operation is recorded (AC-16)', () => {
  it('returns the state unchanged, whether or not a second operand has been typed', () => {
    const recorded = run(digit('1'), digit('2'), operation('add'))
    expect(reducer(recorded, operation('sqrt'))).toBe(recorded)

    const withSecond = run(digit('1'), digit('2'), operation('add'), digit('5'))
    expect(reducer(withSecond, operation('sqrt'))).toBe(withSecond)
  })
})

describe('reducer — sqrt emits on the press when no operation is recorded (AC-15)', () => {
  it('moves to pending with the displayed operand as the single operand, and a request valid against the contract', () => {
    const pending = run(digit('9'), operation('sqrt'))

    expect(pending).toEqual({
      status: 'pending',
      calculation: { operation: 'sqrt', operands: ['9'] },
      request: { operation: 'sqrt', operands: [9] },
    })
    expect(calculateRequestSchema.safeParse(pending.status === 'pending' && pending.request).success).toBe(true)
  })
})

describe('reducer — = on a complete entry emits the request (AC-17)', () => {
  const requestOf = (state: CalculatorState) => (state.status === 'pending' ? state.request : state.status)

  it('names the operation and its operands in entry order, valid against the contract schema', () => {
    const pending = run(digit('1'), digit('2'), operation('add'), digit('5'), equals)

    expect(pending).toEqual({
      status: 'pending',
      calculation: { operation: 'add', operands: ['12', '5'] },
      request: { operation: 'add', operands: [12, 5] },
    })
    expect(calculateRequestSchema.safeParse(requestOf(pending)).success).toBe(true)
  })

  it('reads a trailing bare decimal point as the integer: 5. sends 5, and counts as complete (AC-14)', () => {
    expect(requestOf(run(digit('1'), digit('2'), operation('add'), digit('5'), point, equals))).toEqual({ operation: 'add', operands: [12, 5] })
  })

  it('sends percentage as x then y — "x% of y" (XC-3)', () => {
    expect(requestOf(run(digit('1'), digit('2'), operation('percentage'), digit('5'), digit('0'), equals))).toEqual({ operation: 'percentage', operands: [12, 50] })
  })

  it('evaluates the replaced operation over the retained operands: 12 × 5 (AC-12) and 12 × 57 (AC-13)', () => {
    expect(requestOf(run(digit('1'), digit('2'), operation('add'), digit('5'), operation('multiply'), equals)))
      .toEqual({ operation: 'multiply', operands: [12, 5] })
    expect(requestOf(run(digit('1'), digit('2'), operation('add'), digit('5'), operation('multiply'), digit('7'), equals)))
      .toEqual({ operation: 'multiply', operands: [12, 57] })
  })
})

describe('reducer — pending is frozen (AC-18)', () => {
  const pending = run(digit('1'), digit('2'), operation('add'), digit('5'), equals)
  const everyKey: Action[] = [digit('7'), point, operation('multiply'), operation('sqrt'), equals, clear]

  it.each(everyKey)('ignores %o, C included, so no second request can leave', (action) => {
    expect(reducer(pending, action)).toBe(pending)
  })
})

const outcome = (o: CalculationOutcome): Action => ({ type: 'outcome', outcome: o })

describe('reducer — a result outcome (AC-19)', () => {
  it('carries the number and keeps the completed calculation', () => {
    const pending = run(digit('1'), digit('2'), operation('add'), digit('5'), equals)

    expect(reducer(pending, outcome({ result: 17 }))).toEqual({
      status: 'result',
      calculation: { operation: 'add', operands: ['12', '5'] },
      value: 17,
    })
  })
})

/** A settled `12 + 5 =` with 17 on the readout. */
const result = () => reducer(run(digit('1'), digit('2'), operation('add'), digit('5'), equals), outcome({ result: 17 }))

describe('reducer — an operation key on a result makes it the first operand (AC-20)', () => {
  it('records the operation over the result: 17 shown, − gives 17 −', () => {
    expect(reducer(result(), operation('subtract'))).toEqual({ status: 'entering', operands: ['17'], operation: 'subtract' })
  })

  it('fires sqrt on the result as its operand', () => {
    expect(reducer(result(), operation('sqrt'))).toMatchObject({ status: 'pending', request: { operation: 'sqrt', operands: [17] } })
  })
})

describe('reducer — a digit or point on a result starts a fresh entry (AC-21)', () => {
  it('discards the result and its calculation: 17 shown, 3 gives 3 with nothing recorded', () => {
    expect(reducer(result(), digit('3'))).toEqual({ status: 'entering', operands: ['3'] })
    expect(reducer(result(), point)).toEqual({ status: 'entering', operands: ['0.'] })
  })

  it('holds for a sqrt result identically', () => {
    const sqrtResult = reducer(run(digit('9'), operation('sqrt')), outcome({ result: 3 }))

    expect(reducer(sqrtResult, digit('3'))).toEqual({ status: 'entering', operands: ['3'] })
  })
})

/** The failed `12 ÷ 0 =`, carrying a message this app never defines. */
const failure = { error: { code: 'DIVISION_BY_ZERO', message: 'carried by the outcome' } } as const
const error = () => reducer(run(digit('1'), digit('2'), operation('divide'), digit('0'), equals), outcome(failure))

describe('reducer — an error outcome (AC-22)', () => {
  it('carries the message the outcome brought and keeps the failed calculation', () => {
    expect(error()).toEqual({
      status: 'error',
      calculation: { operation: 'divide', operands: ['12', '0'] },
      message: 'carried by the outcome',
    })
  })
})

describe('reducer — recovery from an error, and C from either ending (AC-23)', () => {
  it('a digit or the point starts a fresh entry, discarding the failed calculation', () => {
    expect(reducer(error(), digit('3'))).toEqual({ status: 'entering', operands: ['3'] })
    expect(reducer(error(), point)).toEqual({ status: 'entering', operands: ['0.'] })
  })

  it.each<Action>([operation('add'), operation('sqrt'), equals])('refuses %o silently, leaving the message and the failed calculation', (action) => {
    const failed = error()

    expect(reducer(failed, action)).toBe(failed)
  })

  it('C returns the calculator to its starting state from a result and from an error', () => {
    expect(reducer(result(), clear)).toEqual(INITIAL_STATE)
    expect(reducer(error(), clear)).toEqual(INITIAL_STATE)
  })
})
