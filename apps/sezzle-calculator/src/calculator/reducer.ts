import type { CalculatorKey } from './keys'
import { type CalculatorState, INITIAL_STATE } from './state'

export type Action
  = | { type: 'digit', digit: string }
    | { type: 'point' }
    | { type: 'clear' }

/** An operand holds at most this many characters, the decimal point included (FE-3, AC-8). */
export const OPERAND_MAX_LENGTH = 15

const full = (operand: string) => operand.length >= OPERAND_MAX_LENGTH

/** The action a key press dispatches; `undefined` for a key the machine does not handle yet. */
export function actionFor(key: CalculatorKey): Action | undefined {
  switch (key.kind) {
    case 'digit':
      return { type: 'digit', digit: key.label }
    case 'point':
      return { type: 'point' }
    case 'clear':
      return { type: 'clear' }
    default:
      return undefined
  }
}

/** Pure: state and action in, state out. Imports no React and performs no I/O. */
export function reducer(state: CalculatorState, action: Action): CalculatorState {
  switch (action.type) {
    case 'digit':
      if (state.operand === '0') return { ...state, operand: action.digit }
      if (full(state.operand)) return state
      return { ...state, operand: state.operand + action.digit }
    case 'point':
      if (state.operand.includes('.') || full(state.operand)) return state
      return { ...state, operand: state.operand + '.' }
    case 'clear':
      return INITIAL_STATE
  }
}
