import { describe, expect, expectTypeOf, it } from "vitest";

import type { CalculateResponse } from "./calculate.ts";
import {
  ERROR_CODES,
  errorResponseSchema,
  STATUS_BY_CODE,
  type ErrorCode,
  type ErrorResponse,
} from "./errors.ts";
import {
  ERROR_MESSAGES,
  INVALID_JSON_MESSAGE,
  OPERATION_REQUIRED_MESSAGE,
  SERVICE_TIMEOUT_MESSAGE,
  SERVICE_UNREACHABLE_MESSAGE,
} from "./messages.ts";

describe("error contract (AC-3)", () => {
  it("defines exactly the six error codes", () => {
    expect(ERROR_CODES).toEqual({
      VALIDATION_ERROR: "VALIDATION_ERROR",
      DIVISION_BY_ZERO: "DIVISION_BY_ZERO",
      NEGATIVE_SQRT: "NEGATIVE_SQRT",
      RESULT_NOT_FINITE: "RESULT_NOT_FINITE",
      INTERNAL_ERROR: "INTERNAL_ERROR",
      SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    });
    expectTypeOf<ErrorCode>().toEqualTypeOf<
      | "VALIDATION_ERROR"
      | "DIVISION_BY_ZERO"
      | "NEGATIVE_SQRT"
      | "RESULT_NOT_FINITE"
      | "INTERNAL_ERROR"
      | "SERVICE_UNAVAILABLE"
    >();
  });

  it("fixes one message per code that has exactly one", () => {
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

  it("fixes the two SERVICE_UNAVAILABLE sentences (p2 AC-1)", () => {
    expect(SERVICE_UNREACHABLE_MESSAGE).toBe(
      "calculation service is unreachable",
    );
    expect(SERVICE_TIMEOUT_MESSAGE).toBe(
      "calculation service did not respond in time",
    );
  });

  it("shapes the success and error envelopes", () => {
    expectTypeOf<CalculateResponse>().toEqualTypeOf<{ result: number }>();
    expectTypeOf<ErrorResponse>().toEqualTypeOf<{
      error: { code: ErrorCode; message: string };
    }>();
  });
});

describe("errorResponseSchema — parsing a downstream envelope (p2 AC-2)", () => {
  it.each(Object.values(ERROR_CODES))(
    "accepts the envelope for every known code: %s",
    (code) => {
      const body = { error: { code, message: "some sentence" } };
      const parsed = errorResponseSchema.safeParse(body);

      expect(parsed.success).toBe(true);
      expect(parsed.data).toStrictEqual(body);
    },
  );

  it("drops an unrecognised key at either level instead of rejecting the body", () => {
    const parsed = errorResponseSchema.safeParse({
      error: {
        code: "DIVISION_BY_ZERO",
        message: "cannot divide by zero",
        hint: 1,
      },
      requestId: "abc",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toStrictEqual({
      error: { code: "DIVISION_BY_ZERO", message: "cannot divide by zero" },
    });
  });

  it.each([
    ["an unknown code", { error: { code: "TEAPOT", message: "x" } }],
    [
      "a lower-case code",
      { error: { code: "division_by_zero", message: "x" } },
    ],
    ["a missing code", { error: { message: "x" } }],
    ["a missing message", { error: { code: "DIVISION_BY_ZERO" } }],
    [
      "a non-string message",
      { error: { code: "DIVISION_BY_ZERO", message: 1 } },
    ],
    ["a null error", { error: null }],
    ["a string error", { error: "DIVISION_BY_ZERO" }],
    ["a missing error", {}],
    ["a null body", null],
    ["a string body", "DIVISION_BY_ZERO"],
    ["an array body", [{ code: "DIVISION_BY_ZERO", message: "x" }]],
    ["a result body", { result: 5 }],
  ])("rejects %s", (_label, body) => {
    expect(errorResponseSchema.safeParse(body).success).toBe(false);
  });
});

describe("STATUS_BY_CODE — each code's default status (p2 AC-3)", () => {
  it("gives every code the status the error contract lists", () => {
    expect(STATUS_BY_CODE).toEqual({
      VALIDATION_ERROR: 400,
      DIVISION_BY_ZERO: 422,
      NEGATIVE_SQRT: 422,
      RESULT_NOT_FINITE: 422,
      INTERNAL_ERROR: 500,
      SERVICE_UNAVAILABLE: 502,
    });
  });

  it("is exhaustive over the codes, with each status a literal type", () => {
    expectTypeOf(STATUS_BY_CODE).toHaveProperty("SERVICE_UNAVAILABLE");
    expectTypeOf<keyof typeof STATUS_BY_CODE>().toEqualTypeOf<ErrorCode>();
    expectTypeOf(STATUS_BY_CODE.VALIDATION_ERROR).toEqualTypeOf<400>();
    expectTypeOf(STATUS_BY_CODE.SERVICE_UNAVAILABLE).toEqualTypeOf<502>();
  });
});
