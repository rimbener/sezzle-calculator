import {
  calculateRequestSchema,
  ERROR_CODES,
  INVALID_JSON_MESSAGE,
  SERVICE_TIMEOUT_MESSAGE,
  SERVICE_UNREACHABLE_MESSAGE,
  STATUS_BY_CODE,
  type CalculateResponse,
  type ErrorCode,
  type ErrorResponse,
} from "@repo/contracts";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { CalcClient } from "./calc-client.ts";

export type AppDependencies = {
  /** The calc-service client every valid request is handed to. */
  calcClient: CalcClient;
  /** The single browser origin CORS grants. */
  corsOrigin: string;
};

/** The one public route. */
export const CALCULATE_ROUTE = "/api/v1/calculate";

/**
 * Sends the error envelope. The status defaults to the code's; only the
 * timeout path overrides it (504).
 */
const fail = (
  c: Context,
  code: ErrorCode,
  message: string,
  status: ContentfulStatusCode = STATUS_BY_CODE[code],
) => {
  const body: ErrorResponse = { error: { code, message } };
  return c.json(body, status);
};

/** A downstream that did not answer within the deadline. */
const GATEWAY_TIMEOUT = 504;

/** The body parsed, or `undefined` when it is not JSON. */
const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

/**
 * `POST /api/v1/calculate`: parse, call the client, serialise. The client is
 * injected so tests need no port and no downstream.
 */
export const createApp = ({ calcClient, corsOrigin }: AppDependencies) => {
  const app = new Hono();

  // One origin (`CORS_ORIGIN`). Others get no CORS headers; a request with
  // no Origin header (curl) passes untouched.
  app.use(
    CALCULATE_ROUTE,
    cors({
      origin: corsOrigin,
      allowMethods: ["POST", "OPTIONS"],
      allowHeaders: ["content-type"],
    }),
  );

  // The client never rejects; if anything else throws, the caller still gets
  // the envelope, not the error text.
  app.onError((_error, c) =>
    fail(c, ERROR_CODES.SERVICE_UNAVAILABLE, SERVICE_UNREACHABLE_MESSAGE),
  );

  app.post(CALCULATE_ROUTE, async (c) => {
    const json = parseJson(await c.req.text());
    if (json === undefined) {
      return fail(c, ERROR_CODES.VALIDATION_ERROR, INVALID_JSON_MESSAGE);
    }
    const parsed = calculateRequestSchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "";
      return fail(c, ERROR_CODES.VALIDATION_ERROR, message);
    }
    const outcome = await calcClient(parsed.data);
    switch (outcome.kind) {
      case "result": {
        const body: CalculateResponse = { result: outcome.result };
        return c.json(body, 200);
      }
      case "domain-error":
        return fail(c, outcome.code, outcome.message);
      case "unavailable":
        return outcome.reason === "timeout"
          ? fail(
              c,
              ERROR_CODES.SERVICE_UNAVAILABLE,
              SERVICE_TIMEOUT_MESSAGE,
              GATEWAY_TIMEOUT,
            )
          : fail(
              c,
              ERROR_CODES.SERVICE_UNAVAILABLE,
              SERVICE_UNREACHABLE_MESSAGE,
            );
    }
  });

  return app;
};
