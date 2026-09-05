import { describe, expect, it } from "vitest";

import { OPERAND_COUNT, OPERATIONS } from "./operations.ts";

describe("operations", () => {
  it("names the seven operations, in the order the API documents them", () => {
    expect(OPERATIONS).toEqual([
      "add",
      "subtract",
      "multiply",
      "divide",
      "power",
      "sqrt",
      "percentage",
    ]);
  });

  it("gives sqrt one operand and every other operation two", () => {
    expect(OPERAND_COUNT).toEqual({
      add: 2,
      subtract: 2,
      multiply: 2,
      divide: 2,
      power: 2,
      sqrt: 1,
      percentage: 2,
    });
  });
});
