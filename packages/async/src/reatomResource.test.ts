import { it, expect } from 'vitest'
import { createTestCtx, mockFn } from '@reatom/testing'
import { atom } from '@reatom/core'
import { noop, sleep } from '@reatom/utils'
import { isConnected, onConnect, onDisconnect } from '@reatom/hooks'
import { reatomAsync, withAbort, withCache, withDataAtom, withErrorAtom, withRetry } from '.'
import { reatomResource } from './reatomResource'
import { take } from '@reatom/effects'

it('base', async () => {
  const paramsAtom = atom(0, 'paramsAtom')
  const async1 = reatomResource(async (ctx) => {
    const argument = ctx.spy(paramsAtom)
    await ctx.schedule(() => sleep())
    return argument
  }, 'async1').promiseAtom
  const async2 = reatomResource(async (ctx) => {
    const n = await ctx.spy(async1)
    return n
  }, 'async2').promiseAtom
  const track = mockFn()
  const ctx = createTestCtx()

  ctx.subscribe(async2, (p) => p.then(track, noop))
  await sleep()
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe(0)

  paramsAtom(ctx, 1)
  paramsAtom(ctx, 2)
  paramsAtom(ctx, 3)
  await sleep()
  expect(track.lastInput()).toBe(3)
  expect(track.calls.length).toBe(2)
})

it('withCache', async () => {
  const sleepTrack = mockFn(sleep)
  const paramsAtom = atom(0, 'paramsAtom')
  const aAtom = reatomResource(async (ctx) => {
    const params = ctx.spy(paramsAtom)
    await ctx.schedule(() => sleepTrack())
    return params
  }, 'aAtom').pipe(withCache({ swr: false }))
  const bAtom = reatomResource(async (ctx) => {
    const n = await ctx.spy(aAtom.promiseAtom)
    return n
  }, 'bAtom')
  const track = mockFn()
  const ctx = createTestCtx()

  ctx.subscribe(bAtom.promiseAtom, (p) => p.then(track, noop))
  await sleep()
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe(0)

  paramsAtom(ctx, 1)
  paramsAtom(ctx, 2)
  paramsAtom(ctx, 3)
  await sleep()
  expect(track.lastInput()).toBe(3)
  expect(track.calls.length).toBe(2)
  expect(sleepTrack.calls.length).toBe(4)

  paramsAtom(ctx, 1)
  paramsAtom(ctx, 2)
  await sleep()
  expect(track.lastInput()).toBe(3)
  expect(track.calls.length).toBe(2)
  expect(sleepTrack.calls.length).toBe(4)

  paramsAtom(ctx, 1)
  paramsAtom(ctx, 2)
  await sleep()
  expect(track.lastInput()).toBe(3)
  expect(track.calls.length).toBe(2)
  expect(sleepTrack.calls.length).toBe(4)
})

it('controller', async () => {
  let collision = false
  const controllerTrack = mockFn()
  const paramsAtom = atom(0, 'paramsAtom')
  const someResource = reatomResource(async (ctx) => {
    const argument = ctx.spy(paramsAtom)
    ctx.controller.signal.addEventListener('abort', controllerTrack)
    await ctx.schedule(() => sleep())
    // the `schedule` should  not propagate the aborted signal
    collision ||= ctx.controller.signal.aborted
    return argument
  }, 'someResource')
  const ctx = createTestCtx()

  ctx.subscribeTrack(someResource.promiseAtom)
  await sleep()
  expect(controllerTrack.calls.length).toBe(0)
  expect(collision).toBeFalsy()

  paramsAtom(ctx, 1)
  expect(controllerTrack.calls.length).toBe(1)
  await sleep()
  expect(controllerTrack.calls.length).toBe(1)
  expect(collision).toBeFalsy()
  paramsAtom(ctx, 2)
  paramsAtom(ctx, 3)
  expect(controllerTrack.calls.length).toBe(3)
  await sleep()
  expect(controllerTrack.calls.length).toBe(3)
  expect(collision).toBeFalsy()
})

it('withDataAtom', async () => {
  const paramsAtom = atom(0, 'paramsAtom')
  const someResource = reatomResource(async (ctx) => {
    const params = ctx.spy(paramsAtom)
    await ctx.schedule(() => sleep())
    return params
  }, 'someResource').pipe(withDataAtom(0))
  const ctx = createTestCtx()

  expect(isConnected(ctx, paramsAtom)).toBeFalsy()
  const un = ctx.subscribe(someResource.dataAtom, noop)
  expect(isConnected(ctx, paramsAtom)).toBeTruthy()
  un()
  expect(isConnected(ctx, paramsAtom)).toBeFalsy()
})

it('withErrorAtom withRetry', async () => {
  let shouldThrow = true
  const paramsAtom = atom(1, 'paramsAtom')
  const someResource = reatomResource(async (ctx) => {
    const params = ctx.spy(paramsAtom)
    await sleep()
    if (shouldThrow) {
      throw new Error('test error')
    }
    await ctx.schedule(() => sleep())
    return params
  }, 'someResource').pipe(
    withDataAtom(0),
    withErrorAtom((ctx, e) => (e instanceof Error ? e : new Error(String(e))), {
      resetTrigger: 'onFulfill',
    }),
    withRetry({
      onReject(ctx, error, retries) {
        if (retries === 0) return 10
      },
    }),
  )
  const ctx = createTestCtx()

  const retriesTrack = ctx.subscribeTrack(someResource.retriesAtom)
  ctx.subscribeTrack(someResource.dataAtom)
  await ctx.get(someResource.promiseAtom).catch(noop)
  expect(ctx.get(someResource.pendingAtom)).toBe(0)
  expect(ctx.get(someResource.dataAtom)).toBe(0)
  expect(ctx.get(someResource.errorAtom)?.message).toBe('test error')
  expect(retriesTrack.inputs()).toEqual([0, 1])

  await take(ctx, someResource.pendingAtom)
  expect(ctx.get(someResource.pendingAtom)).toBe(1)
  expect(ctx.get(someResource.dataAtom)).toBe(0)
  expect(ctx.get(someResource.errorAtom)?.message).toBe('test error')
  expect(retriesTrack.inputs()).toEqual([0, 1])

  shouldThrow = false
  await take(ctx, someResource.pendingAtom)
  expect(ctx.get(someResource.pendingAtom)).toBe(0)
  expect(ctx.get(someResource.dataAtom)).toBe(1)
  expect(ctx.get(someResource.errorAtom)?.message).toBe(undefined)
  expect(retriesTrack.inputs()).toEqual([0, 1, 0])
})

it('abort should not stale', async () => {
  const paramsAtom = atom(123, 'paramsAtom')
  const someResource = reatomResource(async (ctx) => {
    const params = ctx.spy(paramsAtom)
    await ctx.schedule(() => sleep())
    return params
  }, 'someResource').pipe(withDataAtom(0))
  const ctx = createTestCtx()

  ctx.subscribe(someResource.dataAtom, noop)()
  ctx.subscribe(someResource.dataAtom, noop)

  await sleep()
  expect(ctx.get(someResource.dataAtom)).toBe(123)
})

it('direct retry', async () => {
  const paramsAtom = atom(123, 'paramsAtom')
  const someResource = reatomResource(async (ctx) => {
    ctx.spy(paramsAtom)
    await ctx.schedule(() => calls++)
  }, 'someResource')
  let calls = 0
  const ctx = createTestCtx()

  ctx.get(someResource.promiseAtom)
  ctx.get(someResource.promiseAtom)
  ctx.get(someResource.promiseAtom)
  expect(calls).toBe(1)

  someResource(ctx)
  expect(calls).toBe(2)
  ctx.get(someResource.promiseAtom)
  expect(calls).toBe(2)
})

it('withCache stale abort', async () => {
  const someResource = reatomResource(async (ctx) => {
    await ctx.schedule(() => sleep())
    return 1
  }, 'someResource').pipe(withDataAtom(0), withCache())
  const ctx = createTestCtx()

  ctx.subscribe(someResource.dataAtom, noop)()
  ctx.subscribe(someResource.dataAtom, noop)
  await sleep()
  expect(ctx.get(someResource.dataAtom)).toBe(1)
})

it('withCache stale invalidation', async () => {
  const ctx = createTestCtx()
  const someResource = reatomResource(async (ctx): Promise<number> => {
    return ctx.get(someResource.dataAtom) + 1
  }, 'someResource').pipe(withDataAtom(0), withCache({ staleTime: 1 }))

  ctx.subscribeTrack(someResource)
  await sleep(10)
  expect(ctx.get(someResource.dataAtom)).toBe(1)
  expect(ctx.get(someResource.cacheAtom).size).toBe(0)

  someResource.cacheAtom.invalidate(ctx)
  expect(ctx.get(someResource.pendingAtom)).toBe(1)
  await sleep()
  expect(ctx.get(someResource.pendingAtom)).toBe(0)
  expect(ctx.get(someResource.dataAtom)).toBe(2)
})

it('do not rerun without deps on read', async () => {
  let i = 0
  const someResource = reatomResource(async (ctx) => {
    ++i
    await ctx.schedule(() => sleep())
  }, 'someResource')
  const ctx = createTestCtx()

  ctx.get(someResource.promiseAtom)
  ctx.get(someResource.promiseAtom)
  expect(i).toBe(1)

  someResource(ctx)
  expect(i).toBe(2)
})

it('sync retry in onConnect', async () => {
  const getEventsSoon = reatomResource(async () => 1).pipe(
    withDataAtom(0, (ctx, payload, state) => payload + state),
    withRetry(),
  )
  onConnect(getEventsSoon.dataAtom, async (ctx) => {
    while (ctx.isConnected()) {
      await getEventsSoon.retry(ctx)
      await sleep()
    }
  })
  const ctx = createTestCtx()
  ctx.get(getEventsSoon.dataAtom)
  const track = ctx.subscribeTrack(getEventsSoon.dataAtom)

  await sleep()
  await sleep()
  track.unsubscribe()
  expect(ctx.get(getEventsSoon.dataAtom)).toBeGreaterThan(1)
})

it('do not drop the cache of an error', async () => {
  let calls = 0
  const shouldThrowAtom = atom(true, 'shouldThrowAtom')
  const someResource = reatomResource(async (ctx) => {
    calls++
    if (ctx.spy(shouldThrowAtom)) throw new Error('test error')
    return null
  }, 'someResource')
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(someResource.promiseAtom)
  expect(calls).toBe(1)

  await sleep()
  track.unsubscribe()
  ctx.get(someResource.promiseAtom)
  expect(calls).toBe(1)

  shouldThrowAtom(ctx, false)
  ctx.get(someResource.promiseAtom)
  expect(calls).toBe(2)
})

it('reset', async () => {
  const ctx = createTestCtx()
  let i = 0
  const someResource = reatomResource(async (ctx) => {
    ++i
    await ctx.schedule(() => sleep())
  }, 'someResource')
  onDisconnect(someResource, someResource.reset)

  expect(typeof someResource.reset).toBe('function')

  const track = ctx.subscribeTrack(someResource.pendingAtom)
  expect(i).toBe(1)
  await sleep()
  ctx.get(someResource.promiseAtom)
  expect(i).toBe(1)

  track.unsubscribe()
  expect(i).toBe(1)
  ctx.get(someResource.promiseAtom)
  expect(i).toBe(2)
})

it('ignore abort if a subscribers exists', async () => {
  const ctx = createTestCtx()
  const res = reatomResource(async (ctx): Promise<number> => {
    await ctx.schedule(() => sleep())
    return ctx.get(res.dataAtom) + 1
  }).pipe(withDataAtom(0))
  const call = reatomAsync(res).pipe(withAbort())

  const track = ctx.subscribeTrack(res.dataAtom)

  await sleep()
  expect(track.lastInput()).toBe(1)

  call(ctx)
  call.abort(ctx)
  await sleep()
  expect(track.lastInput()).toBe(2)
})
