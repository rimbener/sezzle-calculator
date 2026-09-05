export const OPERATIONS = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "power",
  "sqrt",
  "percentage",
] as const;

export type Operation = (typeof OPERATIONS)[number];

export type OperandCount = 1 | 2;

/** How many operands each operation takes. The registry and the request schema both read this. */
export const OPERAND_COUNT: Readonly<Record<Operation, OperandCount>> = {
  add: 2,
  subtract: 2,
  multiply: 2,
  divide: 2,
  power: 2,
  sqrt: 1,
  percentage: 2,
};
