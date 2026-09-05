import { describe, expect, it } from "vitest";

import { subtract } from "./subtract.ts";

describe("subtract (AC-6)", () => {
  it("subtracts the second operand from the first", () => {
    expect(subtract(2, 3)).toBe(-1);
  });
});
