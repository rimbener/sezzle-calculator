import {
  calculateRequestSchema,
  ERROR_CODES,
  ERROR_MESSAGES,
  INVALID_JSON_MESSAGE,
  type CalculateRequest,
  type CalculateResponse,
  type ErrorCode,
  type ErrorResponse,
} from "@repo/contracts";
import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { calculate as domainCalculate } from "./calculate.ts";
import { CalculationError } from "./calculation-error.ts";

/** The one place an error code picks its status: a new code is one entry here. */
const STATUS_BY_CODE: Readonly<Record<ErrorCode, ContentfulStatusCode>> = {
  VALIDATION_ERROR: 400,
  DIVISION_BY_ZERO: 422,
  NEGATIVE_SQRT: 422,
  RESULT_NOT_FINITE: 422,
  INTERNAL_ERROR: 500,
};

/** Every error, at every status, leaves as the contract's envelope and nothing else. */
const fail = (c: Context, code: ErrorCode, message: string) => {
  const body: ErrorResponse = { error: { code, message } };
  return c.json(body, STATUS_BY_CODE[code]);
};

/** The body as JSON, or `undefined` when it is not JSON at all. */
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
 * The HTTP surface: `POST /calculate` parses the body with the contract's schema,
 * calls `calculate`, serialises the result. The domain is injectable so a test can
 * induce the unexpected failure that the 500 path exists for.
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

/** The service's app, exported separately from the server entry so tests drive it through `app.fetch` with no port bound. */
export const app = createApp();
