import {
  calculateResponseSchema,
  ERROR_CODES,
  errorResponseSchema,
  type CalculateRequest,
  type ErrorCode,
} from '@repo/contracts'
import type { CalculationOutcome } from '../calculator/state'

/** The env var holding the gateway's base URL; Vite exposes `VITE_`-prefixed variables to client code. */
export const GATEWAY_URL_VARIABLE = 'VITE_GATEWAY_URL'

/** The dev gateway: the api-gateway's own default port. */
export const DEFAULT_GATEWAY_URL = 'http://localhost:3000'

/** `env[name]`, or the dev default when the variable is unset. */
export const resolveGatewayUrl = (env: Readonly<Record<string, string | undefined>>): string =>
  env[GATEWAY_URL_VARIABLE] ?? DEFAULT_GATEWAY_URL

/** The codes the gateway answers 422 with — calc-service's math rejections, relayed unchanged. */
export type DomainErrorCode = Extract<ErrorCode, 'DIVISION_BY_ZERO' | 'NEGATIVE_SQRT' | 'RESULT_NOT_FINITE'>

const DOMAIN_ERROR_CODES: ReadonlySet<ErrorCode> = new Set<DomainErrorCode>([
  ERROR_CODES.DIVISION_BY_ZERO,
  ERROR_CODES.NEGATIVE_SQRT,
  ERROR_CODES.RESULT_NOT_FINITE,
])

const isDomainErrorCode = (code: ErrorCode): code is DomainErrorCode =>
  DOMAIN_ERROR_CODES.has(code)

/** An envelope whose code is `SERVICE_UNAVAILABLE` — the gateway reporting calc-service down. */
const isServiceUnavailable = (body: unknown): boolean => {
  const parsed = errorResponseSchema.safeParse(body)
  return parsed.success
    && parsed.data.error.code === ERROR_CODES.SERVICE_UNAVAILABLE
}

/** The end-user wording for a 502/504 outage (FE-4's quote) — never the gateway's raw wording. */
export const OUTAGE_MESSAGE = 'Calculations are temporarily unavailable — try again.'

/** `fetch` itself threw — the gateway is unreachable (UC-8's own quote). */
export const NETWORK_MESSAGE = 'Can\'t reach the calculation service — try again.'

/** For a reply matching none of the documented shapes. */
export const UNEXPECTED_MESSAGE = 'Something went wrong — try again.'

/** The slice of `fetch` the client needs; tests pass a fake. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export type CreateCalculateClientOptions = {
  /** The gateway's base URL; `/api/v1/calculate` is joined onto it. */
  gatewayUrl: string
  /** Defaults to the global `fetch`. */
  fetch?: FetchLike
}

/** Never rejects — `Calculator`'s `onRequest` contract. */
export type CalculateClient = (request: CalculateRequest) => Promise<CalculationOutcome>

/** The reply body parsed, or `undefined` when it is not JSON. */
const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  }
  catch {
    return undefined
  }
}

/** Reduces one gateway reply to a `CalculationOutcome`; every reply classifies, nothing rejects (spec.md, "Error contract"). */
const classify = (status: number, body: unknown): CalculationOutcome => {
  if (status === 200) {
    const parsed = calculateResponseSchema.safeParse(body)
    if (parsed.success) return parsed.data
  }
  if (status === 422) {
    const parsed = errorResponseSchema.safeParse(body)
    if (parsed.success && isDomainErrorCode(parsed.data.error.code)) return parsed.data
  }
  if ((status === 502 || status === 504) && isServiceUnavailable(body)) {
    return { error: { code: ERROR_CODES.SERVICE_UNAVAILABLE, message: OUTAGE_MESSAGE } }
  }
  return { error: { code: ERROR_CODES.INTERNAL_ERROR, message: UNEXPECTED_MESSAGE } }
}

/** A client bound to one gateway URL and one `fetch`. */
export const createCalculateClient = ({ gatewayUrl, fetch = globalThis.fetch }: CreateCalculateClientOptions): CalculateClient => {
  const url = `${gatewayUrl}/api/v1/calculate`

  return async (request) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Rebuilt from the typed fields so extra caller keys never reach the gateway.
        body: JSON.stringify({ operation: request.operation, operands: request.operands }),
      })
      return classify(response.status, parseJson(await response.text()))
    }
    catch {
      return { error: { code: ERROR_CODES.SERVICE_UNAVAILABLE, message: NETWORK_MESSAGE } }
    }
  }
}
