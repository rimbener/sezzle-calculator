import type { CalculateRequest } from '@repo/contracts'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CalculatorProps } from '../calculator/Calculator'
import { DEFAULT_GATEWAY_URL } from './client.constants'
import type { FetchLike } from './client.types'
import { useCalculate } from './useCalculate'

const REQUEST: CalculateRequest = { operation: 'add', operands: [1, 2] }

describe('useCalculate (AC-8)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns Calculator\'s onRequest shape, built from the client module: one POST to the resolved gateway, resolving its outcome', async () => {
    const fetch = vi.fn<FetchLike>(async () =>
      new Response(JSON.stringify({ result: 3 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetch)

    const { result } = renderHook(() => useCalculate())
    const onRequest: NonNullable<CalculatorProps['onRequest']> = result.current

    await expect(onRequest(REQUEST)).resolves.toStrictEqual({ result: 3 })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0] as Parameters<FetchLike>
    expect(url).toBe(`${DEFAULT_GATEWAY_URL}/api/v1/calculate`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toStrictEqual(REQUEST)
  })
})
