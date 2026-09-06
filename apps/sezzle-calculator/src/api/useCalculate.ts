import { useCallback } from 'react'
import { createCalculateClient } from './client'
import { resolveGatewayUrl } from './client.constants'
import type { CalculateClient } from './client.types'

/** FE-7: one client from the resolved gateway URL, for `Calculator`'s `onRequest` seam. */
export const useCalculate = (): CalculateClient =>
  useCallback(async request =>
    createCalculateClient({ gatewayUrl: resolveGatewayUrl(import.meta.env) })(request),
  [])
