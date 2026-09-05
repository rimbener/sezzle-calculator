import { describe, expect, it } from "vitest";

import { percentage } from "./percentage.ts";

describe("percentage (AC-6, XC-3)", () => {
  it("computes x% of y as (x / 100) * y", () => {
    expect(percentage(15, 200)).toBe(30);
  });
});
