import { ERROR_CODES, ERROR_MESSAGES } from "@repo/contracts";
import { describe, expect, it } from "vitest";

import { CalculationError } from "../calculation-error.ts";
import { divide } from "./divide.ts";

describe("divide (AC-6, AC-7)", () => {
  it("divides to a decimal result", () => {
    expect(divide(7, 2)).toBe(3.5);
  });

  it("fails as DIVISION_BY_ZERO on a zero divisor, reaching no result", () => {
    let thrown: unknown;
    try {
      divide(7, 0);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(CalculationError);
    expect(thrown).toMatchObject({
      code: ERROR_CODES.DIVISION_BY_ZERO,
      message: ERROR_MESSAGES.DIVISION_BY_ZERO,
    });
  });
});
