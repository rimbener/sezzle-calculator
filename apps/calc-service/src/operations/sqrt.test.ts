import { ERROR_CODES, ERROR_MESSAGES } from "@repo/contracts";
import { describe, expect, it } from "vitest";

import { CalculationError } from "../calculation-error.ts";
import { sqrt } from "./sqrt.ts";

describe("sqrt (AC-6, AC-7)", () => {
  it("takes the square root of a perfect square", () => {
    expect(sqrt(144)).toBe(12);
  });

  it("takes the square root of zero", () => {
    expect(sqrt(0)).toBe(0);
  });

  it("fails as NEGATIVE_SQRT on a negative radicand, reaching no result", () => {
    let thrown: unknown;
    try {
      sqrt(-4);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(CalculationError);
    expect(thrown).toMatchObject({
      code: ERROR_CODES.NEGATIVE_SQRT,
      message: ERROR_MESSAGES.NEGATIVE_SQRT,
    });
  });
});
