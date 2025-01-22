import { it, expect } from 'vitest'
import { createTestCtx, mockFn } from '@reatom/testing'
import { searchParamsAtom, setupUrlAtomSettings, updateFromSource, urlAtom, withSearchParamsPersist } from './'
import { atom } from '@reatom/core'

it('direct updateFromSource call should be ignored', async () => {
  const ctx = createTestCtx()

  const sync = mockFn()
  setupUrlAtomSettings(ctx, () => new URL('http://example.com'), sync)
  ctx.get(urlAtom)

  expect(sync.calls.length).toBe(0)
  searchParamsAtom.set(ctx, 'test', '1')
  expect(sync.calls.length).toBe(1)
  expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=1')

  const un = urlAtom.onChange(async (ctx) => {
    un()
    await null
    searchParamsAtom.set(ctx, 'test', '3')
  })

  const url = new URL(ctx.get(urlAtom))
  url.searchParams.set('test', '2')
  updateFromSource(ctx, url)
  expect(sync.calls.length).toBe(1)
  expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=2')
  await null
  expect(sync.calls.length).toBe(2)
  expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=3')
})

it('SearchParamsAtom.lens', () => {
  const ctx = createTestCtx()

  setupUrlAtomSettings(ctx, () => new URL('http://example.com'))
  const testAtom = searchParamsAtom.lens('test', (value = '1') => Number(value))

  testAtom(ctx, 2)
  expect(ctx.get(testAtom)).toBe(2)
  expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=2')

  testAtom(ctx, 3)
  expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=3')

  urlAtom.go(ctx, '/path')
  expect(ctx.get(testAtom)).toBe(1)
  expect(ctx.get(urlAtom).href).toBe('http://example.com/path')
})

it('SearchParamsAtom.lens path', () => {
  const ctx = createTestCtx()

  setupUrlAtomSettings(ctx, () => new URL('http://example.com'))

  const testAtom = searchParamsAtom.lens('test', {
    parse: (value = '1') => Number(value),
    path: '/results',
  })
  ctx.subscribeTrack(testAtom)

  urlAtom.go(ctx, '/results?test=2')
  expect(ctx.get(testAtom)).toEqual(2)

  testAtom(ctx, 3)
  expect(ctx.get(urlAtom).href).toEqual('http://example.com/results?test=3')

  urlAtom.go(ctx, '/results/some')
  expect(ctx.get(testAtom)).toEqual(1)

  testAtom(ctx, 2)
  expect(ctx.get(urlAtom).href).toEqual('http://example.com/results/some')

  urlAtom.go(ctx, '/results')
  expect(ctx.get(urlAtom).href).toEqual('http://example.com/results')
})

it('SearchParamsAtom.lens subpath', () => {
  const ctx = createTestCtx()

  setupUrlAtomSettings(ctx, () => new URL('http://example.com'))

  const testAtom = atom(1).pipe(
    withSearchParamsPersist('test', {
      parse: (value = '1') => Number(value),
      path: '/results/*',
    }),
  )
  const track = ctx.subscribeTrack(testAtom)

  urlAtom.go(ctx, '/results?test=2')
  expect(ctx.get(testAtom)).toEqual(2)

  testAtom(ctx, 3)
  expect(ctx.get(urlAtom).href).toEqual('http://example.com/results?test=3')

  urlAtom.go(ctx, '/results/some')
  expect(ctx.get(urlAtom).href).toEqual('http://example.com/results/some?test=3')

  urlAtom.go(ctx, '/some')
  expect(ctx.get(testAtom)).toEqual(1)

  track.unsubscribe()

  urlAtom.go(ctx, '/results')
  expect(ctx.get(urlAtom).href).toEqual('http://example.com/results')

  testAtom(ctx, 2)
  expect(ctx.get(urlAtom).href).toEqual('http://example.com/results?test=2')

  urlAtom.go(ctx, '/results/some')
  expect(ctx.get(urlAtom).href).toEqual('http://example.com/results/some')
})
