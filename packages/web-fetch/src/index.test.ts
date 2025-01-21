import { expect, test } from 'vitest'
import { createTestCtx, mockFn } from '@reatom/testing'
import { ReatomFetchConfig, createReatomFetch, reatomFetch } from './index'

const transport = mockFn((url: string, init: RequestInit) => {
  return new Response('{}', { headers: { 'content-type': 'application/json' } })
})

const API = 'https://api.acme.com'

test('configuration', async () => {
  const ctx = createTestCtx()

  const reatomFetch = createReatomFetch({ transport })

  async function configure(input: ReatomFetchConfig<any> | (() => ReatomFetchConfig<any>)) {
    const fetcher = reatomFetch(input)
    await fetcher(ctx)
    expect(transport.lastInput(0)).toBe(`${API}/`)
  }

  await configure({ url: API })
  await configure(API)
  await configure(() => ({ url: API }))
  await configure(() => API)
})

test('merges URLs', async () => {
  const ctx = createTestCtx()

  async function mergeUrls(urlBase: string, url: string, result: string) {
    const fetcher = reatomFetch({
      transport,
      url,
      urlBase,
    })
    await fetcher(ctx)
    expect(transport.lastInput(0)).toBe(result)
  }

  await mergeUrls(API, '', `${API}/`)
  await mergeUrls(API, '/user', `${API}/user`)
  await mergeUrls(`${API}/v2`, '/user', `${API}/v2/user`)
})

test('merges headers', async () => {
  const ctx = createTestCtx()

  async function mergeHeaders(headersBase: HeadersInit, headers: HeadersInit, result: HeadersInit) {
    const fetcher = reatomFetch({
      transport,
      url: API,
      headers,
      headersBase,
    })
    await fetcher(ctx)
    expect(Object.fromEntries([...((transport.lastInput(1) as RequestInit).headers as Headers).entries()])).toEqual(
      result,
    )
  }

  await mergeHeaders({ accept: 'text/plain' }, {}, { accept: 'text/plain' })
  await mergeHeaders({}, { accept: 'text/plain' }, { accept: 'text/plain' })
  await mergeHeaders(
    { 'x-foo': '1', accept: 'text/plain' },
    { 'x-bar': '2', accept: 'application/json' },
    {
      'x-foo': '1',
      'x-bar': '2',
      accept: 'application/json',
    },
  )
})

test('content parsing', async () => {
  const ctx = createTestCtx()

  const fetcher = reatomFetch({
    transport: (url, init) => {
      return new Response(JSON.stringify({ got: JSON.parse(init.body as string) }), {
        headers: { 'content-type': 'application/json' },
      })
    },
    url: API,
    body: 'Hello world!',
  })

  const result = await fetcher(ctx)

  expect(result).toEqual({ got: 'Hello world!' })
})
