import type { ErrorCode } from "./errors.ts";
import { OPERAND_COUNT, OPERATIONS, type Operation } from "./operations.ts";

/** Every error message string, as whole sentences so tests assert the exact text. */

/**
 * One fixed sentence per code; never quotes the request. `VALIDATION_ERROR` and
 * `SERVICE_UNAVAILABLE` have several, named below.
 */
export const ERROR_MESSAGES: Readonly<
  Record<Exclude<ErrorCode, "VALIDATION_ERROR" | "SERVICE_UNAVAILABLE">, string>
> = {
  DIVISION_BY_ZERO: "cannot divide by zero",
  NEGATIVE_SQRT: "cannot take the square root of a negative number",
  RESULT_NOT_FINITE: "result is not a finite number",
  INTERNAL_ERROR: "internal error",
};

/** `VALIDATION_ERROR`: the body could not be parsed as JSON at all. */
export const INVALID_JSON_MESSAGE = "request body must be valid JSON";

/** `SERVICE_UNAVAILABLE` at 502: calc-service refused the connection or answered outside the contract. */
export const SERVICE_UNREACHABLE_MESSAGE = "calculation service is unreachable";

/** `SERVICE_UNAVAILABLE` at 504: calc-service did not answer within the deadline. */
export const SERVICE_TIMEOUT_MESSAGE =
  "calculation service did not respond in time";

/** `VALIDATION_ERROR`: `operation` absent, `null` or not a string — nothing to quote, so list the valid ones. */
export const OPERATION_REQUIRED_MESSAGE = `operation must be one of: ${OPERATIONS.join(", ")}`;

/** `VALIDATION_ERROR`: an `operation` string that is not one of the seven, quoted verbatim. */
export const unknownOperationMessage = (operation: string): string =>
  `unknown operation '${operation}'`;

/** `VALIDATION_ERROR`: `operands` missing, wrong count, non-numeric, `NaN` or `Infinity`. */
export const operandsMessage = (operation: Operation): string => {
  const count = OPERAND_COUNT[operation];
  const noun = count === 1 ? "operand" : "operands";
  return `operation '${operation}' requires exactly ${count} finite ${noun}`;
};
