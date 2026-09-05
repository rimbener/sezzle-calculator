import { describe, expect, it } from "vitest";

import { add } from "./add.ts";

describe("add (AC-6)", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
  
  it("adds two numbers with a negative operand", () => {
    expect(add(2, -3)).toBe(-1);
  });
});
