import { describe, expect, it } from "vitest";

import {
  CALC_SERVICE_URL_VARIABLE,
  CORS_ORIGIN_VARIABLE,
  DEFAULT_CALC_SERVICE_URL,
  DEFAULT_CORS_ORIGIN,
  DEFAULT_PORT,
  DEFAULT_TIMEOUT_MS,
  PORT_VARIABLE,
  resolveConfig,
  TIMEOUT_VARIABLE,
} from "./config.ts";

describe("resolveConfig (AC-5)", () => {
  it("resolves the four dev defaults when none of the variables is set", () => {
    expect(resolveConfig({})).toEqual({
      port: 3000,
      calcServiceUrl: "http://localhost:3001",
      timeoutMs: 3000,
      corsOrigin: "http://localhost:5173",
    });
  });

  it("exports the defaults it resolves to and the spec's four variable names", () => {
    expect({
      [PORT_VARIABLE]: DEFAULT_PORT,
      [CALC_SERVICE_URL_VARIABLE]: DEFAULT_CALC_SERVICE_URL,
      [TIMEOUT_VARIABLE]: DEFAULT_TIMEOUT_MS,
      [CORS_ORIGIN_VARIABLE]: DEFAULT_CORS_ORIGIN,
    }).toEqual({
      GATEWAY_PORT: 3000,
      CALC_SERVICE_URL: "http://localhost:3001",
      CALC_SERVICE_TIMEOUT_MS: 3000,
      CORS_ORIGIN: "http://localhost:5173",
    });
  });

  it("reads each variable when it is set, with no code edit", () => {
    expect(
      resolveConfig({
        GATEWAY_PORT: "4000",
        CALC_SERVICE_URL: "http://calc.internal:9000",
        CALC_SERVICE_TIMEOUT_MS: "250",
        CORS_ORIGIN: "https://calculator.example",
      }),
    ).toEqual({
      port: 4000,
      calcServiceUrl: "http://calc.internal:9000",
      timeoutMs: 250,
      corsOrigin: "https://calculator.example",
    });
  });

  it("ignores every other variable, calc-service's port included, so one shell can start both services", () => {
    expect(
      resolveConfig({
        CALC_SERVICE_PORT: "3001",
        PORT: "9000",
        GATEWAY_PORT: "4000",
      }),
    ).toEqual({ ...resolveConfig({}), port: 4000 });
  });
});
