import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createTestCtx, mockFn } from '@reatom/testing'

import { searchParamsAtom, setupUrlAtomSettings, updateFromSource, urlAtom, withSearchParamsPersist } from './'
import { atom } from '@reatom/core'

test('direct updateFromSource call should be ignored', async () => {
  const ctx = createTestCtx()

  const sync = mockFn()
  setupUrlAtomSettings(ctx, () => new URL('http://example.com'), sync)
  ctx.get(urlAtom)

  assert.is(sync.calls.length, 0)
  searchParamsAtom.set(ctx, 'test', '1')
  assert.is(sync.calls.length, 1)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/?test=1')

  const un = urlAtom.onChange(async (ctx) => {
    un()
    await null
    searchParamsAtom.set(ctx, 'test', '3')
  })

  const url = new URL(ctx.get(urlAtom))
  url.searchParams.set('test', '2')
  updateFromSource(ctx, url)
  assert.is(sync.calls.length, 1)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/?test=2')
  await null
  assert.is(sync.calls.length, 2)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/?test=3')
})

test('SearchParamsAtom.lens', () => {
  const ctx = createTestCtx()

  setupUrlAtomSettings(ctx, () => new URL('http://example.com'))
  const testAtom = searchParamsAtom.lens('test', (value = '1') => Number(value))

  testAtom(ctx, 2)
  assert.is(ctx.get(testAtom), 2)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/?test=2')

  testAtom(ctx, 3)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/?test=3')

  urlAtom.go(ctx, '/path')
  assert.is(ctx.get(urlAtom).href, 'http://example.com/path')
  assert.is(ctx.get(testAtom), 1)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/path')
})

test('SearchParamsAtom.lens path', () => {
  const ctx = createTestCtx()

  setupUrlAtomSettings(ctx, () => new URL('http://example.com'))

  const testAtom = searchParamsAtom.lens('test', {
    parse: (value = '1') => Number(value),
    path: '/results',
  })
  ctx.subscribeTrack(testAtom)

  urlAtom.go(ctx, '/results?test=2')
  assert.is(ctx.get(testAtom), 2)

  testAtom(ctx, 3)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/results?test=3')

  urlAtom.go(ctx, '/results/some')
  assert.is(ctx.get(testAtom), 1)

  testAtom(ctx, 2)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/results/some')

  urlAtom.go(ctx, '/results')
  assert.is(ctx.get(urlAtom).href, 'http://example.com/results')
})

test('SearchParamsAtom.lens subpath', () => {
  const ctx = createTestCtx()

  setupUrlAtomSettings(ctx, () => new URL('http://example.com'))

  const testAtom = atom(1).pipe(
    withSearchParamsPersist('test', {
      parse: (value = '1') => Number(value),
      path: '/results/*',
    }),
  )
  const track = ctx.subscribeTrack(testAtom)
  // this subscription is required to test some weird bug
  ctx.subscribeTrack(searchParamsAtom)

  urlAtom.go(ctx, '/results?test=2')
  assert.is(ctx.get(testAtom), 2)

  testAtom(ctx, 3)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/results?test=3')

  urlAtom.go(ctx, '/results/some')
  assert.is(ctx.get(urlAtom).href, 'http://example.com/results/some?test=3')

  urlAtom.go(ctx, '/some')
  assert.is(ctx.get(testAtom), 1)

  track.unsubscribe()

  urlAtom.go(ctx, '/results')
  assert.is(ctx.get(urlAtom).href, 'http://example.com/results')

  testAtom(ctx, 2)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/results?test=2')
  urlAtom.go(ctx, '/results/some')
  assert.is(ctx.get(urlAtom).href, 'http://example.com/results/some')
})

test('SearchParamsAtom remove query from url', () => {
  const ctx = createTestCtx()

  setupUrlAtomSettings(ctx, () => new URL('http://example.com'))

  const testAtom = atom<number | undefined>(undefined).pipe(
    withSearchParamsPersist('test', {
      parse: (value) => (value === undefined ? undefined : Number(value)),
      serialize: (value) => (value === undefined ? undefined : value.toString()),
    }),
  )

  ctx.subscribeTrack(testAtom)

  urlAtom.go(ctx, '/results?test=2')
  assert.is(ctx.get(testAtom), 2)

  testAtom(ctx, undefined)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/results')
})

test('inactive subpath should not affect mutated atoms', () => {
  const ctx = createTestCtx()

  setupUrlAtomSettings(ctx, () => new URL('http://example.com/some?test=10'))

  const testAtom = atom(1).pipe(
    withSearchParamsPersist('test', {
      parse: (value = '1') => Number(value),
      path: '/some',
    }),
  )

  ctx.subscribeTrack(testAtom)
  assert.is(ctx.get(testAtom), 10)

  urlAtom.go(ctx, '/other?test=2')
  assert.is(ctx.get(testAtom), 1)

  testAtom(ctx, 123)
  assert.is(ctx.get(testAtom), 123)
  assert.is(ctx.get(urlAtom).href, 'http://example.com/other?test=2')

  urlAtom.go(ctx, '/other?test=3')
  assert.is(ctx.get(testAtom), 123)
})

test.run()
