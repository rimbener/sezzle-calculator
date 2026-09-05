import { describe, expect, it } from "vitest";

import { app, createApp } from "./app.ts";

/** Drives the app through `app.fetch` — no port is bound. */
const post = (body: BodyInit | null, headers?: HeadersInit) =>
  app.fetch(
    new Request("http://calc-service/calculate", {
      method: "POST",
      headers: headers ?? { "content-type": "application/json" },
      body,
    }),
  );

const postJson = (body: unknown) => post(JSON.stringify(body));

describe("POST /calculate — success (AC-10, AC-14)", () => {
  it.each([
    ["add", [2, 3], 5],
    ["subtract", [2, 3], -1],
    ["multiply", [-2, 3.5], -7],
    ["divide", [7, 2], 3.5],
    ["power", [2, 10], 1024],
    ["power", [2, -2], 0.25],
    ["sqrt", [144], 12],
    ["sqrt", [0], 0],
    ["percentage", [15, 200], 30],
  ])(
    "%s(%j) → 200 { result: %d } and nothing else",
    async (operation, operands, result) => {
      const response = await postJson({ operation, operands });

      expect(response.status).toBe(200);
      expect(await response.json()).toStrictEqual({ result });
    },
  );
});

const LISTING =
  "operation must be one of: add, subtract, multiply, divide, power, sqrt, percentage";

describe("POST /calculate — malformed requests (AC-11, AC-14)", () => {
  it.each([
    [
      "an operation naming none of the seven",
      { operation: "foo", operands: [1, 2] },
      "unknown operation 'foo'",
    ],
    ["an absent operation", { operands: [1, 2] }, LISTING],
    ["a null operation", { operation: null, operands: [1, 2] }, LISTING],
    ["a non-string operation", { operation: 5, operands: [1, 2] }, LISTING],
    ["a body that is a string", "add", LISTING],
    ["a body that is null", null, LISTING],
    ["a body that is an array", ["add", 1, 2], LISTING],
    [
      "too few operands",
      { operation: "add", operands: [1] },
      "operation 'add' requires exactly 2 finite operands",
    ],
    [
      "too many operands",
      { operation: "sqrt", operands: [1, 2] },
      "operation 'sqrt' requires exactly 1 finite operand",
    ],
    [
      "missing operands",
      { operation: "divide" },
      "operation 'divide' requires exactly 2 finite operands",
    ],
    [
      "a non-numeric operand",
      { operation: "multiply", operands: ["2", 3] },
      "operation 'multiply' requires exactly 2 finite operands",
    ],
    [
      "a null operand (what NaN and Infinity serialise to)",
      { operation: "power", operands: [2, null] },
      "operation 'power' requires exactly 2 finite operands",
    ],
    [
      "an operation and operands both wrong",
      { operation: "foo", operands: [1] },
      "unknown operation 'foo'",
    ],
  ])(
    "%s → 400 VALIDATION_ERROR with the contract's sentence",
    async (_label, body, message) => {
      const response = await postJson(body);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: { code: "VALIDATION_ERROR", message },
      });
    },
  );
});

describe("POST /calculate — invalid JSON (AC-11, AC-14)", () => {
  it.each([
    ["a truncated object", '{"operation": "add", "operands": [1, 2'],
    ["plain text", "add 1 2"],
    ["an empty body", ""],
    ["a bare NaN literal", '{"operation": "add", "operands": [NaN, 2]}'],
  ])(
    "%s → 400 VALIDATION_ERROR 'request body must be valid JSON'",
    async (_label, raw) => {
      const response = await post(raw);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "request body must be valid JSON",
        },
      });
    },
  );

  it("stays up: answers a well-formed request right after a malformed one", async () => {
    expect((await post("{not json")).status).toBe(400);
    expect((await postJson({ operation: "foo", operands: [] })).status).toBe(
      400,
    );

    const response = await postJson({ operation: "add", operands: [2, 3] });
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ result: 5 });
  });
});

describe("POST /calculate — domain failures (AC-12, AC-14)", () => {
  it.each([
    ["divide", [7, 0], "DIVISION_BY_ZERO", "cannot divide by zero"],
    [
      "sqrt",
      [-4],
      "NEGATIVE_SQRT",
      "cannot take the square root of a negative number",
    ],
    [
      "power",
      [10, 10000],
      "RESULT_NOT_FINITE",
      "result is not a finite number",
    ],
    [
      "add",
      [1e308, 1e308],
      "RESULT_NOT_FINITE",
      "result is not a finite number",
    ],
    ["power", [-8, 0.5], "RESULT_NOT_FINITE", "result is not a finite number"],
  ])("%s(%j) → 422 %s", async (operation, operands, code, message) => {
    const response = await postJson({ operation, operands });

    expect(response.status).toBe(422);
    expect(await response.json()).toStrictEqual({ error: { code, message } });
  });
});

describe("POST /calculate — unexpected failures (AC-13, AC-14)", () => {
  const secret =
    "boom: registry exploded at /srv/calc-service/src/calculate.ts:17";
  const broken = createApp({
    calculate: () => {
      throw new Error(secret);
    },
  });

  it("→ 500 INTERNAL_ERROR 'internal error' and nothing else", async () => {
    const response = await broken.fetch(
      new Request("http://calc-service/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operation: "add", operands: [2, 3] }),
      }),
    );

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(JSON.parse(text)).toStrictEqual({
      error: { code: "INTERNAL_ERROR", message: "internal error" },
    });
    expect(text).not.toContain("boom");
    expect(text).not.toContain("/srv");
    expect(text).not.toContain("at ");
  });

  it("stays up: answers the next request after the failure", async () => {
    const failing = () =>
      broken.fetch(
        new Request("http://calc-service/calculate", {
          method: "POST",
          body: JSON.stringify({ operation: "add", operands: [2, 3] }),
        }),
      );
    expect((await failing()).status).toBe(500);
    expect((await failing()).status).toBe(500);

    const healthy = await postJson({ operation: "add", operands: [2, 3] });
    expect(healthy.status).toBe(200);
    expect(await healthy.json()).toStrictEqual({ result: 5 });
  });
});
