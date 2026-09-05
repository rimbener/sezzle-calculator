import type { Operation } from '@repo/contracts'
import type { KeyFace } from '@repo/ui'

interface KeyBase {
  /** The glyph on the key face. */
  label: string
  /** The accessible name. */
  name: string
  face: KeyFace
}

export type CalculatorKey
  = | (KeyBase & { kind: 'digit' })
    | (KeyBase & { kind: 'point' })
    | (KeyBase & { kind: 'operation', operation: Operation })
    | (KeyBase & { kind: 'equals' })
    | (KeyBase & { kind: 'clear' })

const digit = (d: string): CalculatorKey => ({ kind: 'digit', label: d, name: d, face: 'number' })

const operation = (op: Operation, label: string, name: string, face: KeyFace = 'operator'): CalculatorKey =>
  ({ kind: 'operation', operation: op, label, name, face })

/** Every key on the pad, in render order — four to a row. Adding an operation is one line here. */
export const KEYS: readonly CalculatorKey[] = [
  { kind: 'clear', label: 'C', name: 'Clear', face: 'clear' },
  operation('sqrt', '√', 'Square root', 'function'),
  operation('power', '^', 'Power'),
  operation('divide', '÷', 'Divide'),
  digit('7'),
  digit('8'),
  digit('9'),
  operation('multiply', '×', 'Multiply'),
  digit('4'),
  digit('5'),
  digit('6'),
  operation('subtract', '−', 'Subtract'),
  digit('1'),
  digit('2'),
  digit('3'),
  operation('add', '+', 'Add'),
  operation('percentage', '%', 'Percentage'),
  digit('0'),
  { kind: 'point', label: '.', name: 'Decimal point', face: 'number' },
  { kind: 'equals', label: '=', name: 'Equals', face: 'equals' },
]
