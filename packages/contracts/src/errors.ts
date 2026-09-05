import { z } from "zod";

/** The six error codes every service answers with, inside `{ error: { code, message } }`. */
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DIVISION_BY_ZERO: "DIVISION_BY_ZERO",
  NEGATIVE_SQRT: "NEGATIVE_SQRT",
  RESULT_NOT_FINITE: "RESULT_NOT_FINITE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Each code's default HTTP status; a new code needs an entry. `as const` keeps
 * each status a literal (Hono's `c.json` needs one); `satisfies` keeps the map
 * exhaustive without a framework type.
 */
export const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  DIVISION_BY_ZERO: 422,
  NEGATIVE_SQRT: 422,
  RESULT_NOT_FINITE: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 502,
} as const satisfies Record<ErrorCode, number>;

/**
 * The one error envelope, at every status. The code must be a known one;
 * unrecognised keys at either level are dropped, not rejected.
 */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.enum(Object.values(ERROR_CODES)),
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
