import { describe, expect, it } from 'vitest'
import { toDisplay } from './display'
import { INITIAL_STATE } from './state'

describe('display — the projection from state to the Display slots', () => {
  it('shows the starting state as value 0, an empty expression line and the idle state', () => {
    expect(toDisplay(INITIAL_STATE)).toEqual({ value: '0', expression: '', state: 'idle' })
  })

  it('shows the operand being entered as the value, as typed', () => {
    expect(toDisplay({ status: 'entering', operand: '0.007' })).toEqual({ value: '0.007', expression: '', state: 'idle' })
  })
})
