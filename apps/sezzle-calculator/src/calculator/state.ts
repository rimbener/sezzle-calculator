/** The four statuses of the machine (`spec.md`, "The state machine"). */
export type Status = 'entering' | 'pending' | 'result' | 'error'

export interface CalculatorState {
  status: Status
  /** The operand being entered, as typed — text, never a number. */
  operand: string
}

export const INITIAL_STATE: CalculatorState = {
  status: 'entering',
  operand: '0',
}
