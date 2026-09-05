import type { CalculateRequest, CalculateResponse, ErrorResponse, Operation } from '@repo/contracts'

/** The four statuses of the machine (`spec.md`, "The state machine"). */
export type Status = 'entering' | 'pending' | 'result' | 'error'

/** An emitted calculation as it stood on the readout: the operation and its operands in entry order — text, never numbers. */
export interface Calculation {
  operation: Operation
  operands: readonly string[]
}

/** The user is building an operand; the last one is live on the readout. */
export interface Entering {
  status: 'entering'
  /** The operands as typed, in entry order — text, never numbers. Never empty: the readout starts at `0`. */
  operands: readonly string[]
  /** The operation recorded by an operation key; absent while the first operand is being built. */
  operation?: Operation
}

/** A request has left and no outcome has landed yet. The readout holds `calculation`; `request` is what `Calculator` hands to `onRequest`. */
export interface Pending {
  status: 'pending'
  calculation: Calculation
  request: CalculateRequest
}

/** An outcome returned a number; `calculation` stays on the expression line. */
export interface Result {
  status: 'result'
  calculation: Calculation
  value: number
}

/** An outcome returned an error: the message it carried stands in the value slot over the failed `calculation`. */
export interface Failed {
  status: 'error'
  calculation: Calculation
  /** Carried by the outcome — this app defines no message of its own (`spec.md`, "Error contract"). */
  message: string
}

export type CalculatorState = Entering | Pending | Result | Failed

/** What answers a request: the contract's success body or its error envelope. Phase 4's client never rejects. */
export type CalculationOutcome = CalculateResponse | ErrorResponse

export const INITIAL_STATE: Entering = {
  status: 'entering',
  operands: ['0'],
}
