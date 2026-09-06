import {
  calculateResponseSchema,
  ERROR_CODES,
  errorResponseSchema,
  type ErrorCode,
} from '@repo/contracts'
import type { CalculationOutcome } from '../calculator/state'
import { NETWORK_MESSAGE, OUTAGE_MESSAGE, UNEXPECTED_MESSAGE } from './client.constants'
import type { CalculateClient, CreateCalculateClientOptions, DomainErrorCode } from './client.types'

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
