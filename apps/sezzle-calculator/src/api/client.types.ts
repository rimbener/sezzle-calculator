import type { CalculateRequest, ErrorCode } from '@repo/contracts'
import type { CalculationOutcome } from '../calculator/state'

/** The codes the gateway answers 422 with — calc-service's math rejections, relayed unchanged. */
export type DomainErrorCode = Extract<ErrorCode, 'DIVISION_BY_ZERO' | 'NEGATIVE_SQRT' | 'RESULT_NOT_FINITE'>

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
