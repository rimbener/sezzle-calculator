import { ERROR_CODES, ERROR_MESSAGES } from "@repo/contracts";
import { describe, expect, it } from "vitest";

import { calculate } from "./calculate.ts";
import { CalculationError } from "./calculation-error.ts";

describe("calculate — success through the registry (AC-6, AC-9)", () => {
  it.each([
    ["add", [2, 3], 5],
    ["subtract", [2, 3], -1],
    ["multiply", [-2, 3.5], -7],
    ["divide", [7, 2], 3.5],
    ["power", [2, 10], 1024],
    ["power", [2, -2], 0.25],
    ["sqrt", [144], 12],
    ["sqrt", [0], 0],
    ["percentage", [15, 200], 30],
  ] as const)("%s(%j) = %d", (operation, operands, result) => {
    expect(calculate({ operation, operands: [...operands] })).toBe(result);
  });
});

describe("calculate — non-finite results (AC-8)", () => {
  it.each([
    ["overflow to Infinity in power", "power", [10, 10000]],
    ["overflow to Infinity in add", "add", [1e308, 1e308]],
    ["NaN from a negative base with a fractional exponent", "power", [-8, 0.5]],
  ] as const)(
    "fails as RESULT_NOT_FINITE on %s",
    (_label, operation, operands) => {
      let thrown: unknown;
      try {
        calculate({ operation, operands: [...operands] });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(CalculationError);
      expect(thrown).toMatchObject({
        code: ERROR_CODES.RESULT_NOT_FINITE,
        message: ERROR_MESSAGES.RESULT_NOT_FINITE,
      });
    },
  );
});

describe("calculate — domain failures pass through unchanged (AC-7)", () => {
  it.each([
    ["divide", [7, 0], ERROR_CODES.DIVISION_BY_ZERO],
    ["sqrt", [-4], ERROR_CODES.NEGATIVE_SQRT],
  ] as const)("%s(%j) fails as %s", (operation, operands, code) => {
    let thrown: unknown;
    try {
      calculate({ operation, operands: [...operands] });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(CalculationError);
    expect(thrown).toMatchObject({ code, message: ERROR_MESSAGES[code] });
  });
});
