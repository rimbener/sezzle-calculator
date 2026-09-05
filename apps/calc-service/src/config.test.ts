import { describe, expect, it } from "vitest";

import { resolvePort } from "./config.ts";

describe("resolvePort (AC-15)", () => {
  it("defaults to 3001 when CALC_SERVICE_PORT is absent from the environment", () => {
    expect(resolvePort({})).toBe(3001);
  });

  it("reads CALC_SERVICE_PORT when it is set", () => {
    expect(resolvePort({ CALC_SERVICE_PORT: "4100" })).toBe(4100);
  });

  it("ignores every other variable", () => {
    expect(resolvePort({ PORT: "9000", GATEWAY_PORT: "3000" })).toBe(3001);
  });
});
