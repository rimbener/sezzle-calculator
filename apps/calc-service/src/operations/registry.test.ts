import { OPERATIONS } from "@repo/contracts";
import { describe, expect, it } from "vitest";

import { add } from "./add.ts";
import { divide } from "./divide.ts";
import { multiply } from "./multiply.ts";
import { percentage } from "./percentage.ts";
import { power } from "./power.ts";
import { OPERATION_REGISTRY } from "./registry.ts";
import { sqrt } from "./sqrt.ts";
import { subtract } from "./subtract.ts";

describe("operation registry (AC-9)", () => {
  it("has exactly one entry per operation the contract names", () => {
    expect(Object.keys(OPERATION_REGISTRY).sort()).toEqual(
      [...OPERATIONS].sort(),
    );
  });

  it("reaches each pure function by looking its name up", () => {
    expect(OPERATION_REGISTRY).toEqual({
      add,
      subtract,
      multiply,
      divide,
      power,
      sqrt,
      percentage,
    });
  });
});
