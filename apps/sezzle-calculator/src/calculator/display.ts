import type { Operation } from '@repo/contracts'
import type { DisplayState } from '@repo/ui'
import type { Calculation, CalculatorState } from './state'

export interface Readout {
  value: string
  expression: string
  state: DisplayState
}

const last = (operands: readonly string[]) => operands[operands.length - 1]

type Render = (operands: readonly string[]) => string

/** `12 + 5`, or `12 +` while the right operand is still to come. */
const infix = (glyph: string): Render => ([left, right]) => [`${left} ${glyph}`, right].filter(Boolean).join(' ')

/** The expression-line shape of each operation (`spec.md`, "Display contract"): percentage reads as "x% of y", never as a modulo. */
const RENDER: Readonly<Record<Operation, Render>> = {
  add: infix('+'),
  subtract: infix('−'),
  multiply: infix('×'),
  divide: infix('÷'),
  power: infix('^'),
  sqrt: ([x]) => `sqrt(${x})`,
  percentage: ([x, y]) => [`${x}% of`, y].filter(Boolean).join(' '),
}

/** An emitted calculation on the expression line: `12 + 5 =`, `sqrt(9) =`. */
const emitted = ({ operation, operands }: Calculation) => `${RENDER[operation](operands)} =`

/** The pure projection from machine state to `Display`'s three slots (`spec.md`, "Display contract"). */
export function toDisplay(state: CalculatorState): Readout {
  switch (state.status) {
    case 'entering':
      return {
        value: last(state.operands),
        // Only the committed operand shows here; the one being built is in the value slot.
        expression: state.operation ? RENDER[state.operation]([state.operands[0]]) : '',
        state: 'idle',
      }
    case 'pending':
      return { value: last(state.calculation.operands), expression: emitted(state.calculation), state: 'idle' }
    case 'result':
      return { value: String(state.value), expression: emitted(state.calculation), state: 'idle' }
    case 'error':
      return { value: state.message, expression: emitted(state.calculation), state: 'error' }
  }
}
