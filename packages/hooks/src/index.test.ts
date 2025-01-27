import { action, atom, CtxSpy } from '@reatom/core'
import { createTestCtx, mockFn } from '@reatom/testing'
import { sleep } from '@reatom/utils'
import { it, expect } from 'vitest'

import { withInit, controlConnection, isConnected, onConnect, isInit } from './'

it('withInit', () => {
  const a = atom(0).pipe(withInit(() => 123))
  const ctx = createTestCtx()
  expect(ctx.get(a)).toBe(123)
})

it('controlledConnection', () => {
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
})

it('onConnect ctx.isConnect', async () => {
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
})

it('onConnect ctx.controller', async () => {
  const a = atom(0)
  const ctx = createTestCtx()
  let aborted: null | boolean = null
  let connected: null | boolean = null
  let throwed: null | boolean = null

  onConnect(a, async (ctx) => {
    await sleep()
    aborted = ctx.controller.signal.aborted
    connected = ctx.isConnected()
    ctx
      .schedule(() => {
        throwed = false
      })
      .catch(() => {
        throwed = true
      })
  })

  const track = ctx.subscribeTrack(a)
  await sleep()
  expect(aborted).toBe(false)
  expect(connected).toBe(true)
  expect(throwed).toBe(false)

  track.unsubscribe()
  ctx.subscribeTrack(a).unsubscribe()
  await sleep()

  expect(aborted!).toBe(true)
  expect(connected!).toBe(false)
  expect(throwed).toBe(true)
})

it('isInit', () => {
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
  expect(logs).toEqual([true, true, false, false])

  expect(work(ctx)).toBe(true)
  expect(work(ctx)).toBe(false)
})
