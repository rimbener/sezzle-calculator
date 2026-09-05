import { ERROR_CODES } from "@repo/contracts";

import { CalculationError } from "../calculation-error.ts";

export const divide = (x: number, y: number): number => {
  if (y === 0) throw new CalculationError(ERROR_CODES.DIVISION_BY_ZERO);
  return x / y;
};
