import type { ErrorCode } from "./errors.ts";
import { OPERAND_COUNT, OPERATIONS, type Operation } from "./operations.ts";

/** Every error message string, hand-written so a test asserts the sentence and never a fragment. */

/** One fixed sentence per code that never quotes anything from the request. */
export const ERROR_MESSAGES: Readonly<
  Record<Exclude<ErrorCode, "VALIDATION_ERROR">, string>
> = {
  DIVISION_BY_ZERO: "cannot divide by zero",
  NEGATIVE_SQRT: "cannot take the square root of a negative number",
  RESULT_NOT_FINITE: "result is not a finite number",
  INTERNAL_ERROR: "internal error",
};

/** `VALIDATION_ERROR`: the body could not be parsed as JSON at all. */
export const INVALID_JSON_MESSAGE = "request body must be valid JSON";

/** `VALIDATION_ERROR`: `operation` absent, `null`, or not a string — nothing to quote, so name the valid ones. */
export const OPERATION_REQUIRED_MESSAGE = `operation must be one of: ${OPERATIONS.join(", ")}`;

/** `VALIDATION_ERROR`: a supplied `operation` string that names none of the seven, quoted verbatim. */
export const unknownOperationMessage = (operation: string): string =>
  `unknown operation '${operation}'`;

/** `VALIDATION_ERROR`: wrong operand count, missing `operands`, non-numeric, `NaN` or `Infinity`. The count is the operation's real arity and the noun agrees with it. */
export const operandsMessage = (operation: Operation): string => {
  const count = OPERAND_COUNT[operation];
  const noun = count === 1 ? "operand" : "operands";
  return `operation '${operation}' requires exactly ${count} finite ${noun}`;
};
