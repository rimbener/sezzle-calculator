import type { CalculateClient } from './client'
import { createCalculateClient, resolveGatewayUrl } from './client'

/** FE-7: one client from the resolved gateway URL, for `Calculator`'s `onRequest` seam. */
export const useCalculate = (): CalculateClient =>
  createCalculateClient({ gatewayUrl: resolveGatewayUrl(import.meta.env) })
