import {
  ERROR_MESSAGES,
  SERVICE_TIMEOUT_MESSAGE,
  SERVICE_UNREACHABLE_MESSAGE,
  type CalculateRequest,
} from '@repo/contracts'
import { describe, expect, it, vi } from 'vitest'
import { createCalculateClient } from './client'
import { OUTAGE_MESSAGE, NETWORK_MESSAGE, UNEXPECTED_MESSAGE, DEFAULT_GATEWAY_URL, resolveGatewayUrl, GATEWAY_URL_VARIABLE } from './client.constants'
import type { FetchLike } from './client.types'

const REQUEST: CalculateRequest = { operation: 'add', operands: [1, 2] }

/** A gateway reply: `status` with `body` serialised as JSON. */
const reply = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

/** A gateway that answers every call the same way. */
const answering = (status: number, body: unknown) => vi.fn<FetchLike>(async () => reply(status, body))

const client = (fetch: FetchLike, gatewayUrl = 'http://gateway:3000') =>
  createCalculateClient({ gatewayUrl, fetch })

describe('the request (AC-1)', () => {
  it('sends one POST to <gateway URL>/api/v1/calculate with a JSON content type and the request body, and yields a 200 result unchanged', async () => {
    const fetch = answering(200, { result: 3 })

    await expect(client(fetch)(REQUEST)).resolves.toStrictEqual({ result: 3 })

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0] as Parameters<FetchLike>
    expect(url).toBe('http://gateway:3000/api/v1/calculate')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('content-type')).toBe('application/json')
    expect(JSON.parse(init.body as string)).toStrictEqual({ operation: 'add', operands: [1, 2] })
  })
})

describe('a recognisable answer (AC-2)', () => {
  it.each(['DIVISION_BY_ZERO', 'NEGATIVE_SQRT', 'RESULT_NOT_FINITE'] as const)(
    'relays code and message unchanged for a 422 whose envelope carries %s',
    async (code) => {
      const message = ERROR_MESSAGES[code]

      await expect(
        client(answering(422, { error: { code, message } }))(REQUEST),
      ).resolves.toStrictEqual({ error: { code, message } })
    },
  )
})

describe('a backend outage (AC-3)', () => {
  it.each([
    [502, SERVICE_UNREACHABLE_MESSAGE],
    [504, SERVICE_TIMEOUT_MESSAGE],
  ])('rewrites a %i carrying SERVICE_UNAVAILABLE into the outage message, whatever the gateway said', async (status, gatewayMessage) => {
    await expect(
      client(answering(status, { error: { code: 'SERVICE_UNAVAILABLE', message: gatewayMessage } }))(REQUEST),
    ).resolves.toStrictEqual({ error: { code: 'SERVICE_UNAVAILABLE', message: OUTAGE_MESSAGE } })
  })
})

describe('a network failure (AC-4)', () => {
  it('resolves, never rejects, with the network-failure message when the gateway cannot be reached', async () => {
    const fetch = vi.fn<FetchLike>().mockRejectedValue(new TypeError('fetch failed'))

    await expect(
      client(fetch)(REQUEST),
    ).resolves.toStrictEqual({ error: { code: 'SERVICE_UNAVAILABLE', message: NETWORK_MESSAGE } })
  })
})

describe('every other answer is unexpected (AC-5)', () => {
  const UNEXPECTED = { error: { code: 'INTERNAL_ERROR', message: UNEXPECTED_MESSAGE } }
  const envelope = (code: string) => ({ error: { code, message: 'x' } })

  it.each([
    ['a stray 400 carrying VALIDATION_ERROR', 400, envelope('VALIDATION_ERROR')],
    ['a 500 carrying INTERNAL_ERROR', 500, envelope('INTERNAL_ERROR')],
    ['a 503 carrying SERVICE_UNAVAILABLE', 503, envelope('SERVICE_UNAVAILABLE')],
    ['a 200 whose result is a string', 200, { result: '3' }],
    ['a 200 with no result field', 200, {}],
    ['a 200 carrying an error envelope', 200, envelope('DIVISION_BY_ZERO')],
    ['a 422 whose code is known but not a domain one', 422, envelope('SERVICE_UNAVAILABLE')],
    ['a 502 whose code is not SERVICE_UNAVAILABLE', 502, envelope('VALIDATION_ERROR')],
    ['a 504 whose envelope has an unknown code', 504, envelope('NOT_A_CODE')],
  ])('reports %s as unexpected', async (_case, status, body) => {
    await expect(
      client(answering(status, body))(REQUEST),
    ).resolves.toStrictEqual(UNEXPECTED)
  })

  it.each([200, 422, 502])('reports a %i whose body is not JSON as unexpected', async (status) => {
    const fetch: FetchLike = async () => new Response('<html>oops</html>', { status })

    await expect(client(fetch)(REQUEST)).resolves.toStrictEqual(UNEXPECTED)
  })
})

describe('the gateway URL (AC-6)', () => {
  it('resolves the default dev gateway when the env var is unset', () => {
    expect(DEFAULT_GATEWAY_URL).toBe('http://localhost:3000')
    expect(resolveGatewayUrl({})).toBe(DEFAULT_GATEWAY_URL)
    expect(resolveGatewayUrl({ UNRELATED: 'x' })).toBe(DEFAULT_GATEWAY_URL)
  })

  it('resolves the env var over the default', () => {
    expect(resolveGatewayUrl({ [GATEWAY_URL_VARIABLE]: 'https://gw.example' })).toBe('https://gw.example')
  })

  it('sends the client to the URL the resolved variable names, with no code change', async () => {
    const fetch = answering(200, { result: 1 })
    const gatewayUrl = resolveGatewayUrl({ [GATEWAY_URL_VARIABLE]: 'https://gw.example' })

    await client(fetch, gatewayUrl)(REQUEST)

    expect(fetch.mock.calls[0]?.[0]).toBe('https://gw.example/api/v1/calculate')
  })
})
