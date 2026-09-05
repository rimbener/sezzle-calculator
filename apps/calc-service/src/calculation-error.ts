import { ERROR_MESSAGES, type ErrorCode } from "@repo/contracts";

/** Codes the domain raises: valid input whose result cannot be computed. */
export type CalculationErrorCode = Exclude<
  ErrorCode,
  "VALIDATION_ERROR" | "INTERNAL_ERROR" | "SERVICE_UNAVAILABLE"
>;

/** Carries the contract's code and exact message; the HTTP layer maps it to 422 unchanged. */
export class CalculationError extends Error {
  readonly code: CalculationErrorCode;

  constructor(code: CalculationErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "CalculationError";
    this.code = code;
  }
}
