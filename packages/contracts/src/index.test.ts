import { describe, expect, it } from "vitest";

import * as contracts from "./index.ts";

describe("@repo/contracts barrel (AC-3)", () => {
  it("exports the whole contract from one entry point", () => {
    expect(Object.keys(contracts).sort()).toEqual(
      [
        "OPERATIONS",
        "OPERAND_COUNT",
        "calculateRequestSchema",
        "ERROR_CODES",
        "ERROR_MESSAGES",
        "INVALID_JSON_MESSAGE",
        "OPERATION_REQUIRED_MESSAGE",
        "unknownOperationMessage",
        "operandsMessage",
      ].sort(),
    );
  });
});
