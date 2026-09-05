import { ERROR_CODES, type CalculateRequest } from "@repo/contracts";

import { CalculationError } from "./calculation-error.ts";
import { OPERATION_REGISTRY } from "./operations/registry.ts";

/**
 * Runs a validated request. A non-finite result fails here as `RESULT_NOT_FINITE`,
 * so no operation checks on its own.
 */
export const calculate = ({
  operation,
  operands,
}: CalculateRequest): number => {
  const result = OPERATION_REGISTRY[operation](...operands);
  if (!Number.isFinite(result)) {
    throw new CalculationError(ERROR_CODES.RESULT_NOT_FINITE);
  }
  return result;
};
