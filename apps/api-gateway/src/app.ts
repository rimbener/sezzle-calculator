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
 * Sends the contract's error envelope, at the contract's default status for the
 * code unless the caller names another — the timeout path's 504 is the one
 * status the code alone does not decide.
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
 * `POST /api/v1/calculate`: parse with the contract's schema, call the client,
 * serialise its outcome. The client is injected so tests drive the app through
 * `app.fetch` with no port bound and no downstream running.
 */
export const createApp = ({ calcClient, corsOrigin }: AppDependencies) => {
  const app = new Hono();

  // One browser origin, moved by `CORS_ORIGIN`; any other is granted nothing,
  // and a request with no Origin header (curl) passes through untouched.
  app.use(
    CALCULATE_ROUTE,
    cors({
      origin: corsOrigin,
      allowMethods: ["POST", "OPTIONS"],
      allowHeaders: ["content-type"],
    }),
  );

  // The client reduces every downstream outcome to a value and never rejects;
  // should anything still throw, the caller sees the envelope, not the text.
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
