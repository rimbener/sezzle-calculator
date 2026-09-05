import { describe, expect, it, vi } from "vitest";

import { createApp } from "./app.ts";
import {
  createCalcClient,
  type CalcClient,
  type FetchLike,
} from "./calc-client.ts";

const ORIGIN = "http://localhost:5173";
const URL = "http://gateway/api/v1/calculate";

/** A client whose every call yields the same result. */
const resulting = (result: number) =>
  vi.fn<CalcClient>(async () => ({ kind: "result", result }));

const appWith = (calcClient: CalcClient, corsOrigin = ORIGIN) =>
  createApp({ calcClient, corsOrigin });

/** Drives an app through `app.fetch` — no port is bound. */
const post = (
  app: ReturnType<typeof createApp>,
  body: BodyInit | null,
  headers?: HeadersInit,
) =>
  app.fetch(
    new Request(URL, {
      method: "POST",
      headers: headers ?? { "content-type": "application/json" },
      body,
    }),
  );

const postJson = (app: ReturnType<typeof createApp>, body: unknown) =>
  post(app, JSON.stringify(body));

describe("POST /api/v1/calculate — success (AC-11)", () => {
  it.each([
    ["add", [2, 3]],
    ["subtract", [2, 3]],
    ["multiply", [-2, 3.5]],
    ["divide", [7, 2]],
    ["power", [2, 10]],
    ["sqrt", [144]],
    ["percentage", [15, 200]],
  ])(
    "%s(%j) → 200 with exactly the client's result, the validated request handed to the client",
    async (operation, operands) => {
      const calcClient = resulting(42);

      const response = await postJson(appWith(calcClient), {
        operation,
        operands,
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toStrictEqual({ result: 42 });
      expect(calcClient).toHaveBeenCalledTimes(1);
      expect(calcClient).toHaveBeenCalledWith({ operation, operands });
    },
  );
});

/** A client whose every call reports calc-service unavailable for `reason`. */
const unavailable = (reason: "unreachable" | "timeout") =>
  vi.fn<CalcClient>(async () => ({ kind: "unavailable", reason }));

const OPERATIONS = [
  ["add", [2, 3]],
  ["subtract", [2, 3]],
  ["multiply", [-2, 3.5]],
  ["divide", [7, 2]],
  ["power", [2, 10]],
  ["sqrt", [144]],
  ["percentage", [15, 200]],
] as const;

describe("the gateway computes nothing (AC-12)", () => {
  it("relays an implausible number for add(2, 3) exactly as the downstream returned it", async () => {
    const response = await postJson(appWith(resulting(7)), {
      operation: "add",
      operands: [2, 3],
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ result: 7 });
  });

  it.each(OPERATIONS)(
    "yields no result for %s(%j) while the downstream is failing",
    async (operation, operands) => {
      const response = await postJson(appWith(unavailable("unreachable")), {
        operation,
        operands,
      });

      expect(response.status).toBe(502);
      expect(await response.json()).toStrictEqual({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "calculation service is unreachable",
        },
      });
    },
  );
});

describe("calc-service unavailable (AC-15)", () => {
  it("→ 502 SERVICE_UNAVAILABLE 'calculation service is unreachable' when the client reports unreachable", async () => {
    const response = await postJson(appWith(unavailable("unreachable")), {
      operation: "add",
      operands: [2, 3],
    });

    expect(response.status).toBe(502);
    expect(await response.json()).toStrictEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "calculation service is unreachable",
      },
    });
  });

  it("→ 504 SERVICE_UNAVAILABLE 'calculation service did not respond in time' when the client reports a timeout", async () => {
    const response = await postJson(appWith(unavailable("timeout")), {
      operation: "add",
      operands: [2, 3],
    });

    expect(response.status).toBe(504);
    expect(await response.json()).toStrictEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "calculation service did not respond in time",
      },
    });
  });
});

describe("a downstream domain failure (AC-14)", () => {
  it.each([
    ["DIVISION_BY_ZERO", "cannot divide by zero"],
    ["NEGATIVE_SQRT", "cannot take the square root of a negative number"],
    ["RESULT_NOT_FINITE", "result is not a finite number"],
  ] as const)(
    "→ 422 %s with the downstream's own message, unchanged",
    async (code, message) => {
      const calcClient = vi.fn<CalcClient>(async () => ({
        kind: "domain-error",
        code,
        message,
      }));

      const response = await postJson(appWith(calcClient), {
        operation: "divide",
        operands: [7, 0],
      });

      expect(response.status).toBe(422);
      expect(await response.json()).toStrictEqual({ error: { code, message } });
    },
  );

  it("relays the downstream's message verbatim even when it is not the contract's sentence", async () => {
    const calcClient = vi.fn<CalcClient>(async () => ({
      kind: "domain-error",
      code: "DIVISION_BY_ZERO",
      message: "nope",
    }));

    const response = await postJson(appWith(calcClient), {
      operation: "divide",
      operands: [7, 0],
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toStrictEqual({
      error: { code: "DIVISION_BY_ZERO", message: "nope" },
    });
  });
});

const LISTING =
  "operation must be one of: add, subtract, multiply, divide, power, sqrt, percentage";

describe("malformed requests (AC-13)", () => {
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
  ])(
    "%s → 400 VALIDATION_ERROR with the contract's sentence, and no downstream call, even with calc-service unreachable",
    async (_label, body, message) => {
      const calcClient = unavailable("unreachable");

      const response = await postJson(appWith(calcClient), body);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: { code: "VALIDATION_ERROR", message },
      });
      expect(calcClient).not.toHaveBeenCalled();
    },
  );
});

describe("a body that is not JSON (AC-13)", () => {
  it.each([
    ["a truncated object", '{"operation": "add", "operands": [1, 2'],
    ["plain text", "add 1 2"],
    ["an empty body", ""],
    ["a bare NaN literal", '{"operation": "add", "operands": [NaN, 2]}'],
  ])(
    "%s → 400 VALIDATION_ERROR 'request body must be valid JSON', no downstream call",
    async (_label, raw) => {
      const calcClient = unavailable("unreachable");

      const response = await post(appWith(calcClient), raw);

      expect(response.status).toBe(400);
      expect(await response.json()).toStrictEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "request body must be valid JSON",
        },
      });
      expect(calcClient).not.toHaveBeenCalled();
    },
  );

  it("stays up: answers a well-formed request right after a malformed one", async () => {
    const app = appWith(resulting(5));

    expect((await post(app, "{not json")).status).toBe(400);
    expect(
      (await postJson(app, { operation: "foo", operands: [] })).status,
    ).toBe(400);

    const response = await postJson(app, {
      operation: "add",
      operands: [2, 3],
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ result: 5 });
  });
});

describe("one envelope, no internal detail (AC-15, AC-16)", () => {
  const secret =
    "TypeError: fetch failed at /srv/api-gateway/src/calc-client.ts:118 (ECONNRESET 10.0.0.7:3001)";

  it("→ 502 SERVICE_UNAVAILABLE and nothing else when the client itself rejects", async () => {
    const calcClient = vi.fn<CalcClient>(async () => {
      throw new Error(secret);
    });

    const response = await postJson(appWith(calcClient), {
      operation: "add",
      operands: [2, 3],
    });

    expect(response.status).toBe(502);
    const text = await response.text();
    expect(JSON.parse(text)).toStrictEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "calculation service is unreachable",
      },
    });
    expect(text).not.toContain("fetch");
    expect(text).not.toContain("/srv");
    expect(text).not.toContain("ECONNRESET");
  });
});

describe("recovery after an outage (AC-21)", () => {
  it("answers 200 on the first request after two that every attempt was refused, with nothing rebuilt or reset", async () => {
    // The real client, deadline and retry in the path; only the socket is faked.
    let down = true;
    const fetch = vi.fn<FetchLike>(async () => {
      if (down) throw new TypeError("fetch failed");
      return new Response(JSON.stringify({ result: 5 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const app = appWith(
      createCalcClient({
        calcServiceUrl: "http://calc:3001",
        timeoutMs: 3000,
        fetch,
      }),
    );
    const request = { operation: "add", operands: [2, 3] };

    const first = await postJson(app, request);
    const second = await postJson(app, request);
    expect(first.status).toBe(502);
    expect(second.status).toBe(502);
    expect(fetch).toHaveBeenCalledTimes(4); // two requests, each refused twice

    down = false;
    const third = await postJson(app, request);

    expect(third.status).toBe(200);
    expect(await third.json()).toStrictEqual({ result: 5 });
    expect(fetch).toHaveBeenCalledTimes(5);
  });
});

describe("CORS (AC-17)", () => {
  const preflight = (app: ReturnType<typeof createApp>, origin: string) =>
    app.fetch(
      new Request(URL, {
        method: "OPTIONS",
        headers: {
          origin,
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      }),
    );

  it("allows a preflight for POST from the configured origin, granting that origin and a JSON content type", async () => {
    const response = await preflight(appWith(resulting(5)), ORIGIN);

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(response.headers.get("access-control-allow-methods")).toContain(
      "POST",
    );
    expect(
      response.headers.get("access-control-allow-headers")?.toLowerCase(),
    ).toContain("content-type");
  });

  it("grants another origin nothing", async () => {
    const response = await preflight(
      appWith(resulting(5)),
      "http://evil.example",
    );

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("marks the actual POST from the configured origin as allowed", async () => {
    const response = await postJson(appWith(resulting(5)), {
      operation: "add",
      operands: [2, 3],
    });
    const withOrigin = await post(
      appWith(resulting(5)),
      JSON.stringify({ operation: "add", operands: [2, 3] }),
      { "content-type": "application/json", origin: ORIGIN },
    );

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(withOrigin.status).toBe(200);
    expect(withOrigin.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });

  it("succeeds with no Origin header at all — curl", async () => {
    const response = await postJson(appWith(resulting(5)), {
      operation: "add",
      operands: [2, 3],
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ result: 5 });
  });

  it("moves the granted origin with the configured one", async () => {
    const moved = appWith(resulting(5), "https://calc.example");

    expect(
      (await preflight(moved, "https://calc.example")).headers.get(
        "access-control-allow-origin",
      ),
    ).toBe("https://calc.example");
    expect(
      (await preflight(moved, ORIGIN)).headers.get(
        "access-control-allow-origin",
      ),
    ).toBeNull();
  });
});
