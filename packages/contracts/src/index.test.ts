import { describe, expect, it } from "vitest";

import * as contracts from "./index.ts";

describe("@repo/contracts barrel (AC-3)", () => {
  it("exports the whole contract from one entry point", () => {
    expect(Object.keys(contracts).sort()).toEqual(
      [
        "OPERATIONS",
        "OPERAND_COUNT",
        "calculateRequestSchema",
        "calculateResponseSchema",
        "errorResponseSchema",
        "ERROR_CODES",
        "ERROR_MESSAGES",
        "STATUS_BY_CODE",
        "INVALID_JSON_MESSAGE",
        "SERVICE_UNREACHABLE_MESSAGE",
        "SERVICE_TIMEOUT_MESSAGE",
        "OPERATION_REQUIRED_MESSAGE",
        "unknownOperationMessage",
        "operandsMessage",
      ].sort(),
    );
  });
});
