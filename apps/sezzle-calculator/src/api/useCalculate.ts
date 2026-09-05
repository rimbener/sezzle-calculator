import type { CalculateClient } from './client'
import { createCalculateClient, resolveGatewayUrl } from './client'

/** The hook FE-7 asks for: one client from the resolved gateway URL, returned for `Calculator`'s `onRequest` seam. */
export const useCalculate = (): CalculateClient =>
  createCalculateClient({ gatewayUrl: resolveGatewayUrl(import.meta.env) })
