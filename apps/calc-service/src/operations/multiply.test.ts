import { describe, expect, it } from "vitest";

import { multiply } from "./multiply.ts";

describe("multiply (AC-6)", () => {
  it("multiplies two numbers", () => {
    expect(multiply(2, 3)).toBe(6);
  });
  it ("multiplies two numbers with a negative operand", () => {
    expect(multiply(2, -3)).toBe(-6);
  });
  it("multiplies two numbers with a decimal", () => {
    expect(multiply(2, 3.4)).toBe(6.8);
  });
  it("multiplies a negative by a decimal", () => {
    expect(multiply(-2, 3.4)).toBe(-6.8);
  });
  it("multiplies a negative by a negative", () => {
    expect(multiply(-2, -3)).toBe(6);
  });
  it("multiplies a negative by a negative with a decimal", () => {
    expect(multiply(-2, -3.4)).toBe(6.8);
  });
  it("multiplies by", () => {
    expect(multiply(12, 1)).toBe(12);
  });
  it("multiplies by 0", () => {
    expect(multiply(12, 0)).toBe(0);
  });
});
