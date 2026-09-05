import { OPERAND_COUNT, type Operation } from '@repo/contracts'
import type { CalculatorKey } from './keys'
import { type Calculation, type CalculationOutcome, type CalculatorState, type Entering, type Failed, INITIAL_STATE, type Pending, type Result } from './state'

export type Action
  = | { type: 'digit', digit: string }
    | { type: 'point' }
    | { type: 'operation', operation: Operation }
    | { type: 'equals' }
    | { type: 'clear' }
    | { type: 'outcome', outcome: CalculationOutcome }

/** An operand holds at most this many characters, the decimal point included (FE-3, AC-8). */
export const OPERAND_MAX_LENGTH = 15

const full = (operand: string) => operand.length >= OPERAND_MAX_LENGTH

/** The action a key press dispatches. */
export function actionFor(key: CalculatorKey): Action {
  switch (key.kind) {
    case 'digit':
      return { type: 'digit', digit: key.label }
    case 'point':
      return { type: 'point' }
    case 'operation':
      return { type: 'operation', operation: key.operation }
    case 'equals':
      return { type: 'equals' }
    case 'clear':
      return { type: 'clear' }
  }
}

/** A key that edits an operand: the operand after the key, or `undefined` for a refused press. */
type Edit = (operand: string) => string | undefined

const digitKey = (digit: string): Edit => operand =>
  operand === '0' ? digit : full(operand) ? undefined : operand + digit

const pointKey: Edit = operand =>
  operand.includes('.') || full(operand) ? undefined : operand + '.'

/** True once an operation is recorded and its next operand has not been started: the next digit or point opens it. */
const awaitingOperand = (state: Entering) =>
  state.operation !== undefined && state.operands.length < OPERAND_COUNT[state.operation]

/** An entry is complete once an operation is recorded and every operand it takes has had a key appended (AC-14). */
const complete = (state: Entering): state is Entering & { operation: Operation } =>
  state.operation !== undefined && state.operands.length === OPERAND_COUNT[state.operation]

/** Applies an edit to the operand being built — the last one typed, or a fresh `0` when the next operand is awaited. */
function build(state: Entering, edit: Edit): CalculatorState {
  const opening = awaitingOperand(state)
  const operand = edit(opening ? '0' : state.operands[state.operands.length - 1])
  if (operand === undefined) return state
  const committed = opening ? state.operands : state.operands.slice(0, -1)
  return { ...state, operands: [...committed, operand] }
}

/** The entered text read as the contract's number: `5.` reads as `5`. Parsing, not arithmetic. */
const toNumber = (operand: string) => Number(operand)

/** Emits the calculation: the request Phase 4 will answer, and the readout held still meanwhile. */
const emit = (calculation: Calculation): CalculatorState => ({
  status: 'pending',
  calculation,
  request: { operation: calculation.operation, operands: calculation.operands.map(toNumber) },
})

/** The outcome that ends a pending request. */
const settle = ({ calculation }: Pending, outcome: CalculationOutcome): CalculatorState =>
  'result' in outcome
    ? { status: 'result', calculation, value: outcome.result }
    : { status: 'error', calculation, message: outcome.error.message }

/** The result as the first operand of the next entry: the number's own string, never recomputed (AC-20). */
const promoted = (value: number): Entering => ({ status: 'entering', operands: [String(value)] })

/** The entry rules: digits and the point build operands, operation keys record, `=` and a unary key emit. */
function enter(state: Entering, action: Action): CalculatorState {
  switch (action.type) {
    case 'digit':
      return build(state, digitKey(action.digit))
    case 'point':
      return build(state, pointKey)
    case 'operation':
      // A unary operation fires on the press (AC-15); with an operation recorded it can neither replace nor fire (AC-16).
      if (OPERAND_COUNT[action.operation] === 1) {
        return state.operation === undefined ? emit({ operation: action.operation, operands: state.operands }) : state
      }
      return { ...state, operation: action.operation }
    case 'equals':
      return complete(state) ? emit({ operation: state.operation, operands: state.operands }) : state
    case 'clear':
      return INITIAL_STATE
    case 'outcome':
      return state
  }
}

/** After an outcome (AC-20, AC-21, AC-23): a digit or point starts over, `C` resets, and only a result — a number — can be promoted by an operation key. */
function settled(state: Result | Failed, action: Action): CalculatorState {
  switch (action.type) {
    case 'digit':
    case 'point':
      return enter(INITIAL_STATE, action)
    case 'clear':
      return INITIAL_STATE
    case 'operation':
      return state.status === 'result' ? enter(promoted(state.value), action) : state
    default:
      return state
  }
}

/** Pure: state and action in, state out. Imports no React and performs no I/O. */
export function reducer(state: CalculatorState, action: Action): CalculatorState {
  switch (state.status) {
    case 'entering':
      return enter(state, action)
    case 'pending':
      return action.type === 'outcome' ? settle(state, action.outcome) : state
    case 'result':
    case 'error':
      return settled(state, action)
  }
}
