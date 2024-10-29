import { action, atom, CtxSpy } from '@reatom/core'
import { createTestCtx, mockFn } from '@reatom/testing'
import { sleep } from '@reatom/utils'
import { test, expect } from 'vitest'

import { withInit, controlConnection, isConnected, onConnect, isInit } from './'

test('withInit', () => {
  const a = atom(0).pipe(withInit(() => 123))
  const ctx = createTestCtx()
  expect(ctx.get(a)).toBe(123)
  ;`👍` //?
})

test('controlledConnection', () => {
  const aAtom = atom(0)
  const track = mockFn((ctx: CtxSpy) => ctx.spy(aAtom))
  const bAtom = atom(track)
  const bAtomControlled = bAtom.pipe(controlConnection())
  const ctx = createTestCtx()

  ctx.subscribe(bAtomControlled, () => {})
  expect(track.calls.length).toBe(1)
  expect(isConnected(ctx, bAtom)).toBe(true)

  aAtom(ctx, (s) => (s += 1))
  expect(track.calls.length).toBe(2)
  expect(isConnected(ctx, bAtom)).toBe(true)

  bAtomControlled.toggleConnection(ctx)
  aAtom(ctx, (s) => (s += 1))
  expect(track.calls.length).toBe(2)
  expect(isConnected(ctx, bAtom)).toBe(false)
  ;`👍` //?
})

test('onConnect ctx.isConnect', async () => {
  const a = atom(0)
  const ctx = createTestCtx()
  const delay = 5
  let i = 0

  onConnect(a, async (ctx) => {
    while (ctx.isConnected()) {
      i++
      await sleep(delay)
    }
  })

  const track = ctx.subscribeTrack(a)
  expect(i).toBe(1)

  await sleep(delay)
  expect(i).toBe(2)

  track.unsubscribe()
  await sleep(delay)
  expect(i).toBe(2)
  ;`👍` //?
})

test('onConnect ctx.controller', async () => {
  const a = atom(0)
  const ctx = createTestCtx()
  let delay = 0
  let aborted: boolean
  let connected: boolean

  onConnect(a, async (ctx) => {
    await sleep(delay)
    aborted = ctx.controller.signal.aborted
    connected = ctx.isConnected()
  })

  const track = ctx.subscribeTrack(a)
  track.unsubscribe()
  delay = 5
  ctx.subscribeTrack(a)
  await sleep()

  expect(aborted!).toBe(true)
  expect(connected!).toBe(true)
  ;`👍` //?
})

test('isInit', () => {
  const ctx = createTestCtx()

  const logs = new Array<boolean>()
  const computation = atom((ctx) => {
    logs.push(isInit(ctx))
    logs.push(isInit(ctx))
  }, 'computation')
  const work = action((ctx) => isInit(ctx))

  ctx.get(computation)
  expect(logs).toEqual([true, true])
  ctx.get(computation)
  console.log(logs)
  expect(logs).toEqual([true, true, false, false])

  expect(work(ctx)).toBe(true)
  expect(work(ctx)).toBe(false)
})
