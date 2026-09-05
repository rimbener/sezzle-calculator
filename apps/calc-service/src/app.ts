import {
  calculateRequestSchema,
  ERROR_CODES,
  ERROR_MESSAGES,
  INVALID_JSON_MESSAGE,
  STATUS_BY_CODE,
  type CalculateRequest,
  type CalculateResponse,
  type ErrorCode,
  type ErrorResponse,
} from "@repo/contracts";
import { Hono, type Context } from "hono";

import { calculate as domainCalculate } from "./calculate.ts";
import { CalculationError } from "./calculation-error.ts";

/** Sends the contract's error envelope at the code's default status. */
const fail = (c: Context, code: ErrorCode, message: string) => {
  const body: ErrorResponse = { error: { code, message } };
  return c.json(body, STATUS_BY_CODE[code]);
};

/** The body parsed, or `undefined` when it is not JSON. */
const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export type AppDependencies = {
  calculate: (request: CalculateRequest) => number;
};

/**
 * `POST /calculate`: parse with the contract's schema, call `calculate`, serialise.
 * `calculate` is injectable so a test can force the 500 path.
 */
export const createApp = (
  { calculate }: AppDependencies = { calculate: domainCalculate },
) => {
  const app = new Hono();

  app.onError((error, c) => {
    if (error instanceof CalculationError) {
      return fail(c, error.code, error.message);
    }
    return fail(c, ERROR_CODES.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  });

  app.post("/calculate", async (c) => {
    const json = parseJson(await c.req.text());
    if (json === undefined) {
      return fail(c, ERROR_CODES.VALIDATION_ERROR, INVALID_JSON_MESSAGE);
    }
    const parsed = calculateRequestSchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "";
      return fail(c, ERROR_CODES.VALIDATION_ERROR, message);
    }
    const body: CalculateResponse = { result: calculate(parsed.data) };
    return c.json(body, 200);
  });

  return app;
};

/** Kept apart from the server entry so tests use `app.fetch` without binding a port. */
export const app = createApp();
