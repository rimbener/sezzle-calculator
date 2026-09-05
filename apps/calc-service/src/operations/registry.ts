import type { Operation } from "@repo/contracts";

import { add } from "./add.ts";
import { divide } from "./divide.ts";
import { multiply } from "./multiply.ts";
import { percentage } from "./percentage.ts";
import { power } from "./power.ts";
import { sqrt } from "./sqrt.ts";
import { subtract } from "./subtract.ts";

/** A pure operation over already-validated operands; arity is the contract's `OPERAND_COUNT`. */
export type OperationFn = (...operands: number[]) => number;

/**
 * Operation name → pure function. Adding an operation is a module here plus one
 * entry; `Record<Operation, …>` makes a missing entry a type error, not a 500.
 */
export const OPERATION_REGISTRY: Readonly<Record<Operation, OperationFn>> = {
  add,
  subtract,
  multiply,
  divide,
  power,
  sqrt,
  percentage,
};
