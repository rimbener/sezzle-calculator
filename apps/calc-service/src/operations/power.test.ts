import { describe, expect, it } from "vitest";

import { power } from "./power.ts";

describe("power (AC-6)", () => {
  it("raises to a positive integer exponent", () => {
    expect(power(2, 10)).toBe(1024);
  });

  it("raises to a negative exponent", () => {
    expect(power(2, -2)).toBe(0.25);
  });
});
