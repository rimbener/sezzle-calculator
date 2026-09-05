import { ERROR_CODES } from "@repo/contracts";

import { CalculationError } from "../calculation-error.ts";

export const sqrt = (x: number): number => {
  if (x < 0) throw new CalculationError(ERROR_CODES.NEGATIVE_SQRT);
  return Math.sqrt(x);
};
