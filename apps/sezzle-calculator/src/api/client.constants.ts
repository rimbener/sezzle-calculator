/** The env var holding the gateway's base URL; Vite exposes `VITE_`-prefixed variables to client code. */
export const GATEWAY_URL_VARIABLE = 'VITE_GATEWAY_URL'

/** The dev gateway: the api-gateway's own default port. */
export const DEFAULT_GATEWAY_URL = 'http://localhost:3000'

/** `env[name]`, or the dev default when the variable is unset. */
export const resolveGatewayUrl = (env: Readonly<Record<string, string | undefined>>): string =>
  env[GATEWAY_URL_VARIABLE] ?? DEFAULT_GATEWAY_URL

/** The end-user wording for a 502/504 outage (FE-4's quote) — never the gateway's raw wording. */
export const OUTAGE_MESSAGE = 'Calculations are temporarily unavailable — try again.'

/** `fetch` itself threw — the gateway is unreachable (UC-8's own quote). */
export const NETWORK_MESSAGE = 'Can\'t reach the calculation service — try again.'

/** For a reply matching none of the documented shapes. */
export const UNEXPECTED_MESSAGE = 'Something went wrong — try again.'
