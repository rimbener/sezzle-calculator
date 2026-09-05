import type { DisplayState } from '@repo/ui'
import type { CalculatorState } from './state'

export interface Readout {
  value: string
  expression: string
  state: DisplayState
}

/** The pure projection from machine state to `Display`'s three slots (`spec.md`, "Display contract"). */
export function toDisplay(state: CalculatorState): Readout {
  return { value: state.operand, expression: '', state: 'idle' }
}
