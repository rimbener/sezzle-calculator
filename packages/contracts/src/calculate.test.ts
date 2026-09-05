import { describe, expect, it } from "vitest";

import {
  calculateRequestSchema,
  calculateResponseSchema,
} from "./calculate.ts";

describe("calculateRequestSchema — well-formed requests (AC-1)", () => {
  it.each([
    ["add", [2, 3]],
    ["subtract", [2, 3]],
    ["multiply", [-2, 3.5]],
    ["divide", [7, 2]],
    ["power", [2, -2]],
    ["sqrt", [144]],
    ["percentage", [15, 200]],
  ])("accepts %s with its own operand count", (operation, operands) => {
    const parsed = calculateRequestSchema.safeParse({ operation, operands });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ operation, operands });
  });

  it.each([
    ["zero", ["add", [0, 0]]],
    ["negatives", ["multiply", [-2, -3]]],
    ["decimals", ["divide", [0.1, 0.2]]],
    ["a zero radicand", ["sqrt", [0]]],
    ["a negative radicand", ["sqrt", [-4]]],
  ])("accepts %s as operands", (_label, [operation, operands]) => {
    const parsed = calculateRequestSchema.safeParse({ operation, operands });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({ operation, operands });
  });
});

/** Every message of a rejected parse — tests assert the exact sentence and that it is the only one. */
const rejectionMessages = (input: unknown): string[] => {
  const parsed = calculateRequestSchema.safeParse(input);
  if (parsed.success) throw new Error("expected the request to be rejected");
  return parsed.error.issues.map((issue) => issue.message);
};

describe("calculateRequestSchema — malformed operation (AC-2)", () => {
  it.each(["foo", "ADD", "", "sqrt "])(
    "quotes an operation string naming none of the seven verbatim: %j",
    (operation) => {
      expect(rejectionMessages({ operation, operands: [1, 2] })).toEqual([
        `unknown operation '${operation}'`,
      ]);
    },
  );
});

describe("calculateRequestSchema — operation absent, null or not a string (AC-2)", () => {
  const listing =
    "operation must be one of: add, subtract, multiply, divide, power, sqrt, percentage";

  it.each([
    ["absent", { operands: [1, 2] }],
    ["null", { operation: null, operands: [1, 2] }],
    ["a number", { operation: 5, operands: [1, 2] }],
    ["an array", { operation: ["add"], operands: [1, 2] }],
    ["an object", { operation: { name: "add" }, operands: [1, 2] }],
  ])("names the seven operations when operation is %s", (_label, input) => {
    expect(rejectionMessages(input)).toEqual([listing]);
  });

  it.each([
    ["null", null],
    ["a string", "add"],
    ["an array", ["add", 1, 2]],
  ])(
    "names the seven operations when the body itself is %s",
    (_label, input) => {
      expect(rejectionMessages(input)).toEqual([listing]);
    },
  );
});

describe("calculateRequestSchema — malformed operands (AC-2)", () => {
  const twoOperands = "operation 'add' requires exactly 2 finite operands";

  it.each([
    ["too few", [1]],
    ["too many", [1, 2, 3]],
    ["none", []],
    ["a non-numeric operand", [1, "2"]],
    ["a null operand", [1, null]],
    ["NaN", [1, Number.NaN]],
    ["Infinity", [1, Number.POSITIVE_INFINITY]],
    ["-Infinity", [Number.NEGATIVE_INFINITY, 1]],
    ["a non-array", "1,2"],
    ["an object", { 0: 1, 1: 2 }],
  ])("states the real arity when operands are %s", (_label, operands) => {
    expect(rejectionMessages({ operation: "add", operands })).toEqual([
      twoOperands,
    ]);
  });

  it("states the real arity when operands is absent", () => {
    expect(rejectionMessages({ operation: "add" })).toEqual([twoOperands]);
  });

  it.each(["subtract", "multiply", "divide", "power", "percentage"])(
    "names the operation it is checking: %s",
    (operation) => {
      expect(rejectionMessages({ operation, operands: [1] })).toEqual([
        `operation '${operation}' requires exactly 2 finite operands`,
      ]);
    },
  );

  it.each([
    ["two operands", [4, 9]],
    ["none", []],
    ["NaN", [Number.NaN]],
    ["absent", undefined],
  ])(
    "uses the singular noun for sqrt when operands are %s",
    (_label, operands) => {
      expect(rejectionMessages({ operation: "sqrt", operands })).toEqual([
        "operation 'sqrt' requires exactly 1 finite operand",
      ]);
    },
  );
});

describe("calculateRequestSchema — operation is validated before operands (AC-2)", () => {
  it("gives a request wrong in both ways the unknown-operation message", () => {
    expect(rejectionMessages({ operation: "foo", operands: [1] })).toEqual([
      "unknown operation 'foo'",
    ]);
  });

  it("gives a request with no operation and no operands the listing message", () => {
    expect(rejectionMessages({})).toEqual([
      "operation must be one of: add, subtract, multiply, divide, power, sqrt, percentage",
    ]);
  });
});

describe("calculateResponseSchema — parsing a downstream reply (p2 AC-2)", () => {
  it.each([5, 0, -7, 3.5, 1e308])("accepts { result: %d }", (result) => {
    const parsed = calculateResponseSchema.safeParse({ result });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toStrictEqual({ result });
  });

  it("drops an unrecognised key instead of rejecting the body", () => {
    const parsed = calculateResponseSchema.safeParse({ result: 5, junk: 1 });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toStrictEqual({ result: 5 });
  });

  it.each([
    ["NaN", { result: Number.NaN }],
    ["Infinity", { result: Number.POSITIVE_INFINITY }],
    ["-Infinity", { result: Number.NEGATIVE_INFINITY }],
    ["a missing result", {}],
    ["a string result", { result: "5" }],
    ["a null result", { result: null }],
    ["a null body", null],
    ["a number body", 5],
    ["a string body", "5"],
    ["an array body", [5]],
    [
      "an error envelope",
      { error: { code: "DIVISION_BY_ZERO", message: "x" } },
    ],
  ])("rejects %s", (_label, body) => {
    expect(calculateResponseSchema.safeParse(body).success).toBe(false);
  });
});
