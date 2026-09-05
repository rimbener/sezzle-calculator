import { ERROR_MESSAGES, type ErrorCode } from "@repo/contracts";

/** The codes the domain itself can raise: valid input whose result cannot be computed. */
export type CalculationErrorCode = Exclude<
  ErrorCode,
  "VALIDATION_ERROR" | "INTERNAL_ERROR"
>;

/**
 * The domain's only way to say "this cannot be computed". Carries the contract's
 * code and its exact message; the HTTP layer maps it to a 422 without rewording.
 */
export class CalculationError extends Error {
  readonly code: CalculationErrorCode;

  constructor(code: CalculationErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "CalculationError";
    this.code = code;
  }
}
