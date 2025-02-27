import { test, expect } from 'vitest'
import { createTestCtx, mockFn, createMockStorage } from '@reatom/testing'
import { noop, sleep } from '@reatom/utils'
import { Ctx, atom } from '@reatom/core'
import { createMemStorage, reatomPersist } from '@reatom/persist'
import { onConnect } from '@reatom/hooks'

import {
  reatomAsync,
  withAbort,
  withDataAtom,
  withCache,
  AsyncCtx,
  reatomResource,
} from './'

test('withCache', async () => {
  const fetchData = reatomAsync(
    async (ctx, { a, b }: { a: number; b: number }) => a,
  ).pipe(withDataAtom(0), withCache())
  const ctx = createTestCtx()

  await fetchData(ctx, { a: 400, b: 0 })

  const promise1 = fetchData(ctx, { a: 123, b: 0 })
  expect(ctx.get(fetchData.pendingAtom)).toBe(1)
  expect(ctx.get(fetchData.dataAtom)).toBe(400)

  expect(await promise1).toBe(123)
  expect(ctx.get(fetchData.pendingAtom)).toBe(0)
  expect(ctx.get(fetchData.dataAtom)).toBe(123)

  const promise2 = fetchData(ctx, { b: 0, a: 123 })
  expect(ctx.get(fetchData.pendingAtom)).toBe(0)
  expect(ctx.get(fetchData.dataAtom)).toBe(123)
  expect(await promise2).toBe(123)

  fetchData(ctx, { b: 0, a: 400 })
  expect(ctx.get(fetchData.pendingAtom)).toBe(0)
  expect(ctx.get(fetchData.dataAtom)).toBe(400)
  ;`👍` //?
})

test('withCache dataAtom mapper', async () => {
  let i = 0
  const fetchData = reatomAsync(async (ctx) => [++i]).pipe(
    withDataAtom(0, (ctx, [i]) => i),
    withCache(),
  )
  onConnect(fetchData.dataAtom, fetchData)

  const ctx = createTestCtx()

  await fetchData(ctx)
  expect(ctx.get(fetchData.dataAtom)).toBe(1)

  await fetchData(ctx)
  expect(ctx.get(fetchData.dataAtom)).toBe(2)
  ;`👍` //?
})

test('withCache swr true (default)', async () => {
  let i = 0
  const fetchData = reatomAsync((ctx) => Promise.resolve(++i)).pipe(
    withDataAtom(0),
    withCache(),
  )

  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(fetchData.dataAtom)
  track.calls.length = 0

  await fetchData(ctx)
  expect(track.calls.length).toBe(1)
  expect(ctx.get(fetchData.dataAtom)).toBe(1)

  await fetchData(ctx)
  expect(track.calls.length).toBe(2)
  expect(ctx.get(fetchData.dataAtom)).toBe(2)

  fetchData(ctx)
  expect(track.calls.length).toBe(2)
  expect(ctx.get(fetchData.dataAtom)).toBe(2)
  ;`👍` //?
})

test('withCache swr false', async () => {
  let i = 0
  const fetchData = reatomAsync(async (ctx, n) => {
    i++
    return n
  }).pipe(withDataAtom(0), withCache({ swr: false }))

  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(fetchData.dataAtom)
  track.calls.length = 0

  await fetchData(ctx, 1)
  expect(i).toBe(1)
  await fetchData(ctx, 1)
  expect(i).toBe(1)
  expect(track.calls.length).toBe(1)
  expect(ctx.get(fetchData.dataAtom)).toBe(1)

  await fetchData(ctx, 2)
  expect(i).toBe(2)
  expect(track.calls.length).toBe(2)
  expect(ctx.get(fetchData.dataAtom)).toBe(2)

  await fetchData(ctx, 1)
  expect(i).toBe(2)
  expect(track.calls.length).toBe(3)
  expect(ctx.get(fetchData.dataAtom)).toBe(1)
  ;`👍` //?
})

test('withCache parallel', async () => {
  let i = 0
  const effect = mockFn(() => new Promise((r) => setTimeout(r, 0, ++i)))
  const fetchData = reatomAsync(effect).pipe(withDataAtom(0), withCache())

  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(fetchData.dataAtom)
  track.calls.length = 0

  const p1 = Promise.all([fetchData(ctx), fetchData(ctx)])
  expect(effect.calls.length).toBe(1)
  expect(ctx.get(fetchData.pendingAtom)).toBe(1)
  expect(track.calls.length).toBe(0)
  expect(await p1).toEqual([1, 1])
  expect(track.inputs()).toEqual([1])

  const p2 = Promise.all([fetchData(ctx), fetchData(ctx)])
  expect(effect.calls.length).toBe(2)
  expect(await p2).toEqual([2, 2])
  expect(track.inputs()).toEqual([1, 2])
  ;`👍` //?
})

test('withCache withAbort vary params', async () => {
  const effect = mockFn(async (ctx: any, n: number) => {
    ctx.controller.signal.throwIfAborted()

    return n
  })
  const fetchData = reatomAsync(effect).pipe(
    withDataAtom(0),
    withCache(),
    withAbort(),
  )

  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(fetchData.dataAtom)
  track.calls.length = 0

  const p1 = Promise.allSettled([fetchData(ctx, 1), fetchData(ctx, 2)])
  expect(track.calls.length).toBe(0)
  expect(ctx.get(fetchData.dataAtom)).toBe(0)
  const res1 = await p1
  expect(res1[0].status).toBe('rejected')
  expect(res1[1]).toEqual({ status: 'fulfilled', value: 2 })
  expect(track.calls.length).toBe(1)
  expect(ctx.get(fetchData.dataAtom)).toBe(2)

  await fetchData(ctx, 1)
  expect(track.calls.length).toBe(2)
  expect(ctx.get(fetchData.dataAtom)).toBe(1)

  fetchData(ctx, 2)
  expect(track.calls.length).toBe(3)
  expect(ctx.get(fetchData.dataAtom)).toBe(2)
  ;`👍` //?
})

test('withCache withAbort same params', async () => {
  const effect = mockFn(async (ctx: AsyncCtx, n: number) => {
    ctx.controller.signal.throwIfAborted()
    return n
  })
  const fetchData = reatomAsync(effect).pipe(
    withDataAtom(0),
    withCache(/* default `{ignoreAbort: true}` */),
    withAbort(),
  )

  const ctx = createTestCtx()

  const p1 = Promise.allSettled([fetchData(ctx, 1), fetchData(ctx, 1)])
  expect(ctx.get(fetchData.dataAtom)).toBe(0)
  expect(effect.calls.length).toBe(1)
  const res1 = await p1
  expect(res1.map(({ status }) => status)).toEqual(['rejected', 'fulfilled'])
  expect(ctx.get(fetchData.dataAtom)).toBe(1)

  await fetchData(ctx, 1)
  expect(ctx.get(fetchData.dataAtom)).toBe(1)

  await fetchData(ctx, 2)
  expect(ctx.get(fetchData.dataAtom)).toBe(2)
  ;`👍` //?
})

test('withCache and action mocking', async () => {
  const effect = mockFn(async (ctx: any, n: number) => n)
  const fetchData = reatomAsync(effect).pipe(
    withDataAtom(0),
    withCache(),
    withAbort(),
  )
  const ctx = createTestCtx()

  ctx.mockAction(fetchData, async (ctx, n) => n * 10)

  fetchData(ctx, 1)
  expect(ctx.get(fetchData.pendingAtom)).toBe(1)
  await sleep()
  expect(ctx.get(fetchData.pendingAtom)).toBe(0)
  expect(ctx.get(fetchData.dataAtom)).toBe(10)

  fetchData(ctx, 1)
  expect(ctx.get(fetchData.pendingAtom)).toBe(0)
  expect(ctx.get(fetchData.dataAtom)).toBe(10)
  ;`👍` //?
})

test('withPersist', async () => {
  const mockStorage = createMockStorage()
  const withMock = reatomPersist(mockStorage)

  const effect = mockFn(async (ctx: Ctx, a: number, b: number) => a + b)
  const fetchData1 = reatomAsync(effect, 'fetchData').pipe(
    withDataAtom(0),
    withCache({ withPersist: withMock, swr: false }),
  )
  const fetchData2 = reatomAsync(effect, 'fetchData').pipe(
    withDataAtom(0),
    withCache({ withPersist: withMock, swr: false }),
  )

  const ctx = createTestCtx()

  const data2Track = ctx.subscribeTrack(fetchData2.dataAtom)
  data2Track.calls.length = 0

  await fetchData1(ctx, 1, 2)
  expect(data2Track.calls.length).toBe(0)

  const effectCalls = effect.calls.length
  await fetchData2(ctx, 1, 2)
  expect(effect.calls.length).toBe(effectCalls)
  expect(data2Track.lastInput()).toBe(3)
  ;`👍` //?
})

test('do not cache aborted promise', async () => {
  const effect = mockFn(async (ctx: AsyncCtx) => {
    await null
    ctx.controller.signal.throwIfAborted()
    return 1
  })
  const fetchData = reatomAsync(effect).pipe(
    withDataAtom(0),
    withCache({ ignoreAbort: false }),
  )
  onConnect(fetchData.dataAtom, fetchData)
  const ctx = createTestCtx()

  ctx.subscribe(fetchData.dataAtom, noop)()
  const un = ctx.subscribe(fetchData.dataAtom, noop)
  await sleep()
  expect(effect.calls.length).toBe(2)
  expect(ctx.get(fetchData.dataAtom)).toBe(1)

  un()
  ctx.subscribe(fetchData.dataAtom, noop)()
  ctx.subscribe(fetchData.dataAtom, noop)
  await sleep()
  expect(effect.calls.length).toBe(4)
  expect(ctx.get(fetchData.dataAtom)).toBe(1)
  ;`👍` //?
})

test('should be able to manage cache manually', async () => {
  const effect = mockFn(async (ctx: any, n: number) => n)
  const fetchData = reatomAsync(effect).pipe(
    withDataAtom(0),
    withCache({ swr: false }),
  )
  const ctx = createTestCtx()

  fetchData(ctx, 1)
  expect(effect.calls.length).toBe(1)
  expect(ctx.get(fetchData.dataAtom)).toBe(0)
  await sleep()
  expect(ctx.get(fetchData.dataAtom)).toBe(1)

  fetchData.cacheAtom.setWithParams(ctx, [2], 2)
  fetchData(ctx, 2)
  expect(effect.calls.length).toBe(1)
  expect(ctx.get(fetchData.dataAtom)).toBe(2)
  await sleep()
  expect(ctx.get(fetchData.dataAtom)).toBe(2)

  fetchData(ctx, 1)
  expect(effect.calls.length).toBe(1)

  fetchData.cacheAtom.deleteWithParams(ctx, [1])
  fetchData(ctx, 1)
  expect(effect.calls.length).toBe(2)
})

test('Infinity cache invalidation', async () => {
  const effect = mockFn(async (ctx: any, n: number) => n)
  const fetchData = reatomAsync(effect).pipe(
    withDataAtom(0),
    withCache({ swr: false, staleTime: Infinity }),
  )
  const ctx = createTestCtx()

  await fetchData(ctx, 1)
  await fetchData(ctx, 2)
  expect(effect.calls.length).toBe(2)

  await fetchData.cacheAtom.invalidate(ctx)
  expect(effect.calls.length).toBe(3)
})

test('shared cache', async () => {
  const ctx = createTestCtx()

  const myModelStorage = createMemStorage({ name: 'myModel' })
  const withMyModelPersist = reatomPersist(myModelStorage)
  const reatomMyModel = (init: number) => {
    const param = atom(init)
    const someResource = reatomResource(async (ctx) => {
      const value = ctx.spy(param)
      await ctx.schedule(() => sleep())
      return value
    }).pipe(
      withDataAtom(0),
      withCache({ swr: false, withPersist: () => withMyModelPersist('myModel') }),
    )

    return {
      param,
      data: someResource.dataAtom,
      cacheAtom: someResource.cacheAtom,
    }
  }

  const a = reatomMyModel(1)
  const b = reatomMyModel(2)

  ctx.subscribeTrack(a.data)
  ctx.subscribeTrack(b.data)

  await sleep()

  expect(ctx.get(a.data)).toBe(1)
  expect(ctx.get(b.data)).toBe(2)

  a.param(ctx, 2)
  expect(ctx.get(a.data)).toBe(2)
})
