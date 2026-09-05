import { describe, expect, expectTypeOf, it } from "vitest";

import type { CalculateResponse } from "./calculate.ts";
import { ERROR_CODES, type ErrorCode, type ErrorResponse } from "./errors.ts";
import {
  ERROR_MESSAGES,
  INVALID_JSON_MESSAGE,
  OPERATION_REQUIRED_MESSAGE,
} from "./messages.ts";

describe("error contract (AC-3)", () => {
  it("defines exactly the five error codes", () => {
    expect(ERROR_CODES).toEqual({
      VALIDATION_ERROR: "VALIDATION_ERROR",
      DIVISION_BY_ZERO: "DIVISION_BY_ZERO",
      NEGATIVE_SQRT: "NEGATIVE_SQRT",
      RESULT_NOT_FINITE: "RESULT_NOT_FINITE",
      INTERNAL_ERROR: "INTERNAL_ERROR",
    });
    expectTypeOf<ErrorCode>().toEqualTypeOf<
      | "VALIDATION_ERROR"
      | "DIVISION_BY_ZERO"
      | "NEGATIVE_SQRT"
      | "RESULT_NOT_FINITE"
      | "INTERNAL_ERROR"
    >();
  });

  it("fixes one message per non-validation code", () => {
    expect(ERROR_MESSAGES).toEqual({
      DIVISION_BY_ZERO: "cannot divide by zero",
      NEGATIVE_SQRT: "cannot take the square root of a negative number",
      RESULT_NOT_FINITE: "result is not a finite number",
      INTERNAL_ERROR: "internal error",
    });
  });

  it("fixes the two validation messages that quote no operation", () => {
    expect(INVALID_JSON_MESSAGE).toBe("request body must be valid JSON");
    expect(OPERATION_REQUIRED_MESSAGE).toBe(
      "operation must be one of: add, subtract, multiply, divide, power, sqrt, percentage",
    );
  });

  it("shapes the success and error envelopes", () => {
    expectTypeOf<CalculateResponse>().toEqualTypeOf<{ result: number }>();
    expectTypeOf<ErrorResponse>().toEqualTypeOf<{
      error: { code: ErrorCode; message: string };
    }>();
  });
});
