import { test, expect } from 'vitest'
import { createTestCtx } from '@reatom/testing'

import { reatomAsync, withAbort, withCache } from './'
import {
  AsyncStatusesAbortedFulfill,
  AsyncStatusesAbortedPending,
  AsyncStatusesAnotherPending,
  AsyncStatusesFirstPending,
  AsyncStatusesFulfilled,
  AsyncStatusesNeverPending,
  AsyncStatusesRejected,
  asyncStatusesInitState,
  withStatusesAtom,
} from './withStatusesAtom'
import { noop, sleep } from '@reatom/utils'
import { reatomResource } from '../build'

const neverPending: AsyncStatusesNeverPending = {
  isPending: false,
  isFulfilled: false,
  isRejected: false,
  isSettled: false,

  isFirstPending: false,
  // isAnotherPending: false,
  isEverPending: false,
  // isNeverPending: true,
  isEverSettled: false,
  // isNeverSettled: true,
}

const firstPending: AsyncStatusesFirstPending = {
  isPending: true,
  isFulfilled: false,
  isRejected: false,
  isSettled: false,

  isFirstPending: true,
  // isAnotherPending: false,
  isEverPending: true,
  // isNeverPending: false,
  isEverSettled: false,
  // isNeverSettled: true,
}

const fulfilled: AsyncStatusesFulfilled = {
  isPending: false,
  isFulfilled: true,
  isRejected: false,
  isSettled: true,

  isFirstPending: false,
  // isAnotherPending: false,
  isEverPending: true,
  // isNeverPending: false,
  isEverSettled: true,
  // isNeverSettled: false,
}

const rejected: AsyncStatusesRejected = {
  isPending: false,
  isFulfilled: false,
  isRejected: true,
  isSettled: true,

  isFirstPending: false,
  // isAnotherPending: false,
  isEverPending: true,
  // isNeverPending: false,
  isEverSettled: true,
  // isNeverSettled: false,
}

const anotherPending: AsyncStatusesAnotherPending = {
  isPending: true,
  isFulfilled: false,
  isRejected: false,
  isSettled: false,

  isFirstPending: false,
  // isAnotherPending: true,
  isEverPending: true,
  // isNeverPending: false,
  isEverSettled: true,
  // isNeverSettled: false,
}

test('withStatusesAtom', async () => {
  const fetchData = reatomAsync(async (ctx, shouldTrow = false) => {
    if (shouldTrow) throw new Error('withStatusesAtom test error')
  }).pipe(withStatusesAtom())
  const ctx = createTestCtx()

  expect(ctx.get(fetchData.statusesAtom)).toEqual(neverPending)

  const promise = fetchData(ctx)

  expect(ctx.get(fetchData.statusesAtom)).toEqual(firstPending)

  await promise

  expect(ctx.get(fetchData.statusesAtom)).toEqual(fulfilled)

  const promise2 = fetchData(ctx, true)

  expect(ctx.get(fetchData.statusesAtom)).toEqual(anotherPending)

  await promise2.catch(() => {})

  expect(ctx.get(fetchData.statusesAtom)).toEqual(rejected)
  ;`👍` //?
})

test('withCache and withStatusesAtom', async () => {
  const fetchData = reatomAsync(async (ctx, shouldTrow = false) => {
    if (shouldTrow) throw new Error('withStatusesAtom test error')
  }).pipe(withStatusesAtom(), withCache())
  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(fetchData.statusesAtom)

  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toEqual(neverPending)

  const promise = fetchData(ctx)

  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toEqual(firstPending)

  await promise

  expect(track.calls.length).toBe(3)
  expect(track.lastInput()).toEqual(fulfilled)

  const promise2 = fetchData(ctx, true)

  expect(track.calls.length).toBe(4)
  expect(track.lastInput()).toEqual(anotherPending)
  fetchData(ctx, true).catch(() => {})
  expect(track.calls.length).toBe(4)
  expect(track.lastInput()).toEqual(anotherPending)

  await promise2.catch(() => {})

  expect(track.lastInput()).toEqual(rejected)
  ;`👍` //?
})

test('withStatusesAtom parallel requests', async () => {
  const fetchData = reatomAsync(() => sleep(10)).pipe(withStatusesAtom())
  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(fetchData.statusesAtom)

  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toEqual(neverPending)

  const p1 = fetchData(ctx)

  expect(track.lastInput()).toEqual(firstPending)

  const p2 = fetchData(ctx)

  expect(track.lastInput()).toEqual({ ...firstPending, isFirstPending: false })

  await p1

  expect(track.lastInput()).toEqual(anotherPending)

  await p2

  expect(track.lastInput()).toEqual(fulfilled)
  ;`👍` //?
})

test('reset during pending', async () => {
  const fetchData = reatomAsync(async () => {}).pipe(withStatusesAtom())
  const ctx = createTestCtx()

  expect(ctx.get(fetchData.statusesAtom)).toBe(asyncStatusesInitState)

  fetchData(ctx)
  expect(ctx.get(fetchData.statusesAtom).isPending).toBe(true)
  fetchData.statusesAtom.reset(ctx)
  expect(ctx.get(fetchData.statusesAtom).isPending).toBe(false)
  expect(ctx.get(fetchData.statusesAtom).isEverPending).toBe(false)
  await sleep()
  expect(ctx.get(fetchData.statusesAtom).isEverPending).toBe(false)
  ;`👍` //?
})

test('do not reject on abort', async () => {
  const fetchData = reatomAsync(async () => sleep()).pipe(withAbort(), withStatusesAtom())
  const ctx = createTestCtx()

  expect(ctx.get(fetchData.statusesAtom)).toBe(asyncStatusesInitState)

  fetchData(ctx)
  fetchData(ctx)
  await null
  expect(ctx.get(fetchData.statusesAtom)).toEqual({
    isPending: true,
    isFulfilled: false,
    isRejected: false,
    isSettled: false,

    isFirstPending: false,
    isEverPending: true,
    isEverSettled: false,
  } satisfies AsyncStatusesAbortedPending)
  ;`👍` //?
})

test('isEverSettled after abort', async () => {
  const fetchData = reatomAsync(async () => sleep()).pipe(withAbort(), withStatusesAtom())
  const ctx = createTestCtx()

  expect(ctx.get(fetchData.statusesAtom)).toBe(asyncStatusesInitState)
  await fetchData(ctx)
  expect(ctx.get(fetchData.statusesAtom).isFulfilled).toBe(true)
  expect(ctx.get(fetchData.statusesAtom)).toEqual({
    isPending: false,
    isFulfilled: true,
    isRejected: false,
    isSettled: true,

    isFirstPending: false,
    isEverPending: true,
    isEverSettled: true,
  } satisfies AsyncStatusesFulfilled)

  fetchData(ctx).catch(noop)
  fetchData(ctx).catch(noop)
  await null
  expect(ctx.get(fetchData.statusesAtom)).toEqual({
    isPending: true,
    isFulfilled: false,
    isRejected: false,
    isSettled: false,

    isFirstPending: false,
    isEverPending: true,
    isEverSettled: true,
  } satisfies AsyncStatusesAbortedPending)
})

test('do not reject on resource abort', async () => {
  const fetchData = reatomResource(async (ctx) => {}).pipe(withStatusesAtom())
  const ctx = createTestCtx()

  ctx.subscribe(fetchData, noop)()
  ctx.subscribe(fetchData, noop)
  await null
  expect(ctx.get(fetchData.statusesAtom)).toEqual({
    isPending: true,
    isFulfilled: false,
    isRejected: false,
    isSettled: false,

    isFirstPending: false,
    isEverPending: true,
    isEverSettled: false,
  } satisfies AsyncStatusesAbortedPending)
  ;`👍` //?
})

test('restore isFulfilled after abort', async () => {
  const fetchData = reatomAsync(async (ctx) => {}).pipe(withAbort(), withStatusesAtom())
  const ctx = createTestCtx()

  await fetchData(ctx)
  expect(ctx.get(fetchData.statusesAtom)).toEqual({
    isPending: false,
    isFulfilled: true,
    isRejected: false,
    isSettled: true,

    isFirstPending: false,
    isEverPending: true,
    isEverSettled: true,
  } satisfies AsyncStatusesFulfilled)

  fetchData(ctx)
  fetchData.abort(ctx)
  await null
  expect(ctx.get(fetchData.statusesAtom)).toEqual({
    isPending: false,
    isFulfilled: true,
    isRejected: false,
    isSettled: true,

    isFirstPending: false,
    isEverPending: true,
    isEverSettled: true,
  } satisfies AsyncStatusesAbortedFulfill)
  ;`👍` //?
})
