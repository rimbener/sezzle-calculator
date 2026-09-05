/** The five error codes every service answers with, inside `{ error: { code, message } }`. */
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DIVISION_BY_ZERO: "DIVISION_BY_ZERO",
  NEGATIVE_SQRT: "NEGATIVE_SQRT",
  RESULT_NOT_FINITE: "RESULT_NOT_FINITE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** The one error envelope, at every status. */
export type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
  };
};
