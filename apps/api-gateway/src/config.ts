/**
 * The gateway's four settings, each read from one service-prefixed variable so
 * a single shell can start it beside calc-service (`CALC_SERVICE_PORT`) with no
 * collision. The names and defaults are exported so tests and the README read
 * one source. Nothing here touches `process.env`: `resolveConfig` is pure in `env`.
 */

export const PORT_VARIABLE = "GATEWAY_PORT";
export const CALC_SERVICE_URL_VARIABLE = "CALC_SERVICE_URL";
export const TIMEOUT_VARIABLE = "CALC_SERVICE_TIMEOUT_MS";
export const CORS_ORIGIN_VARIABLE = "CORS_ORIGIN";

export const DEFAULT_PORT = 3000;
export const DEFAULT_CALC_SERVICE_URL = "http://localhost:3001";
export const DEFAULT_TIMEOUT_MS = 3000;
export const DEFAULT_CORS_ORIGIN = "http://localhost:5173";

export type GatewayConfig = {
  /** The port the gateway binds. */
  port: number;
  /** calc-service's base URL; `/calculate` is joined onto it. */
  calcServiceUrl: string;
  /** The whole-call deadline for one downstream call, retry included. */
  timeoutMs: number;
  /** The single browser origin CORS grants. */
  corsOrigin: string;
};

/** `env[name]`, or `fallback` when the variable is absent. */
const text = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
  fallback: string,
): string => env[name] ?? fallback;

/** `env[name]` as a number, or `fallback` when the variable is absent. */
const integer = (
  env: Readonly<Record<string, string | undefined>>,
  name: string,
  fallback: number,
): number => {
  const value = env[name];
  return value === undefined ? fallback : Number(value);
};

/** The four settings from `env`, each falling back to its dev default. */
export const resolveConfig = (
  env: Readonly<Record<string, string | undefined>>,
): GatewayConfig => ({
  port: integer(env, PORT_VARIABLE, DEFAULT_PORT),
  calcServiceUrl: text(
    env,
    CALC_SERVICE_URL_VARIABLE,
    DEFAULT_CALC_SERVICE_URL,
  ),
  timeoutMs: integer(env, TIMEOUT_VARIABLE, DEFAULT_TIMEOUT_MS),
  corsOrigin: text(env, CORS_ORIGIN_VARIABLE, DEFAULT_CORS_ORIGIN),
});
