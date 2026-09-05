import { describe, expect, it } from "vitest";

import { subtract } from "./subtract.ts";

describe("subtract (AC-6)", () => {
  it("subtracts the second operand from the first", () => {
    expect(subtract(2, 3)).toBe(-1);
  });
  it("subtracts the second operand from the first with a negative operand", () => {
    expect(subtract(2, -3)).toBe(5);
  });
  it("subtracts the second operand from the first with a decimal", () => {
    expect(subtract(2, 3.4)).toBe(-1.4);
  });
  it("subtracts the second operand from the first with both operands and a decimal", () => {
    expect(subtract(-2, -3.4)).toBe(1.4);
  });
});
