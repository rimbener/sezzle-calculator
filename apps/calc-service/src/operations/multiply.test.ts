import { describe, expect, it } from "vitest";

import { multiply } from "./multiply.ts";

describe("multiply (AC-6)", () => {
  it("multiplies a negative by a decimal", () => {
    expect(multiply(-2, 3.5)).toBe(-7);
  });
});
