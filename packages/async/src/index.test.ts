import { test, expect } from 'vitest'
import { action, atom } from '@reatom/core'
import { mapPayloadAwaited } from '@reatom/lens'
import { take, concurrent } from '@reatom/effects'
import { onConnect } from '@reatom/hooks'
import { createTestCtx, mockFn } from '@reatom/testing'
import { noop, random, sleep } from '@reatom/utils'

import { reatomAsync, withAbort, withDataAtom, withRetry, withErrorAtom } from './'

test(`base API`, async () => {
  const fetchData = reatomAsync(async (ctx, v: number) => {
    return v
  }).pipe(withDataAtom(0, (ctx, v) => v))
  const ctx = createTestCtx()

  expect(ctx.get(fetchData.dataAtom)).toBe(0)

  setTimeout(fetchData, 0, ctx, 123)
  expect(await take(ctx, fetchData)).toBe(123)
  expect(ctx.get(fetchData.dataAtom)).toBe(123)
})

test('withRetry', async () => {
  const fetchData = reatomAsync(async (ctx, v: number) => {
    if (1) throw new Error('TEST')
  }).pipe(
    withRetry({
      onReject(ctx, error: any, retries) {
        if (error?.message === 'TEST' && retries < 2) return 0
      },
    }),
  )

  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(fetchData)

  expect(track.calls.length).toBe(1)

  fetchData(ctx, 123).catch(noop)

  expect(track.calls.length).toBe(2)

  await sleep()

  expect(track.calls.length).toBe(4)
})

test('withRetry fallbackParams', async () => {
  const ctx = createTestCtx()

  const result = await reatomAsync(async () => {})
    .pipe(withRetry())
    .retry(ctx)
    .catch((error) => error)

  expect(result).toBeInstanceOf(Error)
  expect(result.message).toBe('Reatom error: no cached params')

  expect(() =>
    reatomAsync(async () => {})
      .pipe(withRetry({ fallbackParams: [] }))
      .retry(ctx),
  ).not.throws()

  const fallback = await reatomAsync(async (ctx, v: number) => v)
    .pipe(withRetry({ fallbackParams: [123] }))
    .retry(ctx)

  expect(fallback).toBe(123)
})

test('withRetry delay', async () => {
  const onRejectTrack = mockFn()
  const fetchData = reatomAsync(async (ctx) => {
    await sleep(5)
    if (1) throw new Error('TEST')
  }).pipe(
    withRetry({
      onReject(ctx, error: any, retries) {
        onRejectTrack()
        if (error?.message === 'TEST' && retries < 1) return 6
      },
    }),
  )

  const ctx = createTestCtx()

  const effectTrack = ctx.subscribeTrack(fetchData)
  effectTrack.calls.length = 0

  fetchData(ctx).catch(noop)
  expect(effectTrack.calls.length).toBe(1)

  await sleep(30)

  expect(onRejectTrack.calls.length).toBe(2)
  expect(effectTrack.calls.length).toBe(2)
  expect(ctx.get(fetchData.retriesAtom)).toBe(0)
})

test('withAbort', async () => {
  const a1 = reatomAsync(async (ctx, v: number) => {
    await sleep()
    return v
  }).pipe(withAbort())

  const ctx = createTestCtx()

  const valueTrack = ctx.subscribeTrack(a1.pipe(mapPayloadAwaited((ctx, v) => v)))
  const errorTrack = ctx.subscribeTrack(a1.onReject)
  const abortTrack = ctx.subscribeTrack(a1.onAbort)

  valueTrack.calls.length = 0
  errorTrack.calls.length = 0
  abortTrack.calls.length = 0

  const promise1 = a1(ctx, 1)
  expect(abortTrack.calls.length).toBe(0)
  const promise2 = a1(ctx, 2)
  expect(abortTrack.calls.length).toBe(1)

  await Promise.any([promise1, promise2])

  expect(valueTrack.calls.length).toBe(1)
  expect(valueTrack.lastInput().at(-1)?.payload).toBe(2)
  expect(errorTrack.calls.length).toBe(0)
  expect(abortTrack.calls.length).toBe(1)
})

test('withAbort user abort', async () => {
  let shouldAbort = false
  let shouldThrow = false
  const error = random()
  const result = random()
  const a1 = reatomAsync(async (ctx) => {
    if (shouldAbort) {
      ctx.controller.abort()
      ctx.controller.signal.throwIfAborted()
    }
    if (shouldThrow) {
      throw error
    }
    return result
  }).pipe(withAbort())

  const ctx = createTestCtx()

  const valueSubscriber = ctx.subscribeTrack(a1.pipe(mapPayloadAwaited((ctx, v) => v)))
  valueSubscriber.calls.length = 0
  const errorSubscriber = ctx.subscribeTrack(a1.onReject)
  errorSubscriber.calls.length = 0

  await a1(ctx)

  expect(valueSubscriber.lastInput().at(-1)?.payload).toBe(result)

  shouldAbort = true
  const isError = await a1(ctx).then(
    () => false,
    () => true,
  )
  expect(isError).toBe(true)
  expect(valueSubscriber.calls.length).toBe(1)
  expect(errorSubscriber.calls.length).toBe(0)

  shouldAbort = false
  shouldThrow = true
  await a1(ctx).catch(noop)
  expect(valueSubscriber.calls.length).toBe(1)
  expect(errorSubscriber.calls.length).toBe(1)
  expect(errorSubscriber.lastInput().at(-1)?.payload).toBe(error)
})

test('withAbort and real fetch', async () => {
  const handleError = mockFn((e) => {
    throw e
  })
  const fetchData = reatomAsync((ctx) => fetch('https://www.google.ru/404', ctx.controller).catch(handleError)).pipe(
    withAbort(),
  )

  const ctx = createTestCtx()

  const cb = ctx.subscribeTrack(fetchData.pipe(mapPayloadAwaited((ctx, resp) => resp.status)))

  expect(cb.calls.length).toBe(1)
  expect(handleError.calls.length).toBe(0)

  fetchData(ctx).catch(noop)
  await sleep()
  fetchData(ctx).catch(noop)
  await sleep()
  fetchData(ctx).catch(noop)

  await take(ctx, fetchData.onFulfill)

  expect(cb.calls.length).toBe(2)
  expect(cb.lastInput().at(-1)?.payload).toBe(404)
  expect(handleError.calls.length).toBe(2)
  expect(handleError.calls.every(({ o }: any) => o.name === 'AbortError')).toBeTruthy()
})

test('withAbort strategy first-in-win', async () => {
  const anAsync = reatomAsync(async (ctx, v: number) => {
    await ctx.schedule(() => sleep())
    return v
  }).pipe(withAbort({ strategy: 'first-in-win' }))

  const ctx = createTestCtx()

  const valueTrack = ctx.subscribeTrack(anAsync.pipe(mapPayloadAwaited((ctx, v) => v)))
  const errorTrack = ctx.subscribeTrack(anAsync.onReject)
  const abortTrack = ctx.subscribeTrack(anAsync.onAbort)

  valueTrack.calls.length = 0
  errorTrack.calls.length = 0
  abortTrack.calls.length = 0

  const promise1 = anAsync(ctx, 1)
  expect(abortTrack.calls.length).toBe(0)
  expect(ctx.get(anAsync.pendingAtom)).toBe(1)
  const promise2 = anAsync(ctx, 2)
  expect(abortTrack.calls.length).toBe(1)
  // wait the promise fail handling
  await null
  expect(ctx.get(anAsync.pendingAtom)).toBe(1)

  await Promise.any([promise1, promise2])

  expect(valueTrack.calls.length).toBe(1)
  expect(valueTrack.lastInput().at(-1)?.payload).toBe(1)
  expect(errorTrack.calls.length).toBe(0)
  expect(abortTrack.calls.length).toBe(1)
})

test('hooks', async () => {
  let onEffect = 0
  let onFulfill = 0
  let onReject = 0
  let onSettle = 0
  const effect = reatomAsync(
    async (ctx, v: number) => {
      if (v) return v
      throw v
    },
    {
      onEffect: () => onEffect++,
      onFulfill: () => onFulfill++,
      onReject: () => onReject++,
      onSettle: () => onSettle++,
    },
  )
  const ctx = createTestCtx()

  expect([onEffect, onFulfill, onReject, onSettle]).toEqual([0, 0, 0, 0])

  const promise1 = effect(ctx, 1)
  expect([onEffect, onFulfill, onReject, onSettle]).toEqual([1, 0, 0, 0])

  await promise1
  expect([onEffect, onFulfill, onReject, onSettle]).toEqual([1, 1, 0, 1])

  const promise2 = effect(ctx, 0)
  expect([onEffect, onFulfill, onReject, onSettle]).toEqual([2, 1, 0, 1])
  await promise2.catch(noop)
  expect([onEffect, onFulfill, onReject, onSettle]).toEqual([2, 1, 1, 2])
})

test('onConnect', async () => {
  const fetchData = reatomAsync(async (ctx, payload: number) => payload).pipe(withDataAtom(0))
  const ctx = createTestCtx()
  onConnect(fetchData.dataAtom, (ctx) => fetchData(ctx, 123))
  const track = ctx.subscribeTrack(fetchData.dataAtom)

  await sleep()
  expect(track.lastInput()).toBe(123)
})

test('withErrorAtom resetTrigger', async () => {
  const effect = reatomAsync(async () => {
    if (1) throw 42
    return 42
  }).pipe(withDataAtom(), withErrorAtom(undefined, { resetTrigger: 'dataAtom' }))
  const ctx = createTestCtx()

  await effect(ctx).catch(noop)

  expect(ctx.get(effect.errorAtom)?.message).toBe('42')

  effect.dataAtom(ctx, 42)
  expect(ctx.get(effect.errorAtom)).toBe(undefined)
})

test('withErrorAtom should be computed first', async () => {
  let error
  const effect = reatomAsync(async () => {
    if (1) throw 42
    return 42
  }).pipe(
    withRetry({
      onReject(ctx) {
        error = ctx.get(effect.errorAtom)
      },
    }),
    withErrorAtom((ctx, e) => e),
  )
  const ctx = createTestCtx()

  await effect(ctx).catch(noop)
  expect(error).toBe(42)
})

test('withErrorAtom initState', async () => {
  let error
  const effect = reatomAsync(async () => {
    if (1) throw 42
    return 42
  }).pipe(withErrorAtom((ctx, e: any) => new Error(e), { initState: 'test' }))
  const ctx = createTestCtx()

  expect(ctx.get(effect.errorAtom)).toBe('test')

  await effect(ctx).catch(noop)
  expect(ctx.get(effect.errorAtom)).instanceOf

  effect.errorAtom.reset(ctx)
  expect(ctx.get(effect.errorAtom)).toBe('test')
})

test('nested abort', async () => {
  let result = false
  let thrown = false
  const do1 = reatomAsync(async (ctx) => {
    await sleep()
    ctx.controller.signal.throwIfAborted()
    result = true
  }).pipe(withAbort())
  const do2 = reatomAsync(do1)
  const do3 = reatomAsync(action(do2)).pipe(withAbort())
  const ctx = createTestCtx()

  do3(ctx).catch(() => {
    thrown = true
  })
  expect(result).toBe(false)
  await sleep()
  expect(result).toBe(true)
  expect(thrown).toBe(false)

  result = false
  do3(ctx).catch(() => {
    thrown = true
  })
  do3.abort(ctx)
  expect(result).toBe(false)
  await sleep()
  expect(result).toBe(false)
  expect(thrown).toBe(true)
})

test('onConnect and take', async () => {
  const act = action()
  const res = atom(false)
  const effect = reatomAsync(async (ctx) => {
    // extra action to check that the controller could be read even between NO async primitives
    await action((ctx) => take(ctx, act))(ctx)
    res(ctx, true)
  })
  onConnect(res, effect)

  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(res)
  act(ctx)
  await sleep()
  expect(ctx.get(res)).toBe(true)

  res(ctx, false)
  track.unsubscribe()

  ctx.subscribeTrack(res).unsubscribe()
  act(ctx)
  await sleep()
  expect(ctx.get(res)).toBe(false)
})

test('handle error correctly', async () => {
  const doSome = reatomAsync(() => {
    throw new Error('test error')
  })
  const doSomeAsync = reatomAsync(async () => {
    throw new Error('test error')
  })
  const ctx = createTestCtx()

  expect(await doSome(ctx).catch((e: Error) => e.message)).toBe('test error')
  expect(await doSomeAsync(ctx).catch((e: Error) => e.message)).toBe('test error')
})

test('withRetry abort', async () => {
  const effect = reatomAsync(async () => {
    if (1) throw new Error('test error')
  }).pipe(
    withRetry({
      onReject: (ctx, error, retries) => {
        return 1
      },
    }),
  )
  onConnect(effect, (ctx) => effect(ctx).catch(noop))
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(effect)
  expect(ctx.get(effect.pendingAtom)).toBe(1)
  expect(ctx.get(effect.retriesAtom)).toBe(0)
  await sleep(10)
  expect(ctx.get(effect.pendingAtom)).toBe(0)
  expect(ctx.get(effect.retriesAtom) > 2).toBeTruthy()

  track.unsubscribe()
  await sleep(10)
  expect(ctx.get(effect.pendingAtom) + ctx.get(effect.retriesAtom)).toBe(0)
})

test('withAbort + withRetry', async () => {
  const effect = reatomAsync(async () => {
    if (1) throw new Error('test error')
  }).pipe(
    withAbort(),
    withRetry({
      onReject: (ctx, error, retries) => {
        return 1
      },
    }),
  )
  onConnect(effect, (ctx) => effect(ctx).catch(noop))
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(effect)
  await sleep(10)

  setTimeout(() => track.unsubscribe())
  expect(track.calls.length > 2).toBeTruthy()
})

test('effects concurrent without unhandled rejection', async () => {
  const ctx = createTestCtx()

  const track = mockFn()

  const nAtom = atom(0)
  nAtom.onChange(
    concurrent(async (ctx, n) => {
      try {
        await ctx.schedule(() => sleep())
        track(n)
      } catch {}
    }),
  )
  const doSome = reatomAsync(async (ctx, n: number) => {
    // await ctx.schedule(() => sleep()) // this fixed the issue
    nAtom(ctx, n)
  })

  doSome(ctx, 1).catch(noop)
  // await // this fixed the issue
  doSome(ctx, 2).catch(noop)

  const promise = doSome(ctx, 3).catch(noop)

  expect(track.calls.length).toBe(0)

  await promise
  await sleep()

  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe(3)
})
