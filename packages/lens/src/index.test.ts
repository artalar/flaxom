import { Action, Atom, AtomState, action, atom } from '@reatom/core'
import { sleep } from '@reatom/utils'
import { reatomNumber } from '@reatom/primitives'
import { createTestCtx, mockFn } from '@reatom/testing'
import { test, expect } from 'vitest'

import './match.test'
import './parseAtoms.test'
import './select.test'

import {
  combine,
  debounce,
  effect,
  filter,
  mapInput,
  mapPayload,
  mapPayloadAwaited,
  mapState,
  plain,
  readonly,
  sample,
  toAtom,
  onLensUpdate,
  withOnUpdate,
  throttle,
  toLens,
} from './'

test(`map and mapInput`, async () => {
  const a = reatomNumber(0)
  const aMap = a.pipe(mapState((ctx, v, u) => v + 1))
  const aMapInput = a.pipe(mapInput((ctx, v: string) => Number(v)))
  const ctx = createTestCtx()

  const aMapInputTrack = ctx.subscribeTrack(aMapInput, () => {})

  expect(ctx.get(a)).toBe(0)
  expect(ctx.get(aMap)).toBe(1)
  expect(ctx.get(aMapInput)).toEqual([])

  aMapInput(ctx, '1')
  expect(ctx.get(a)).toBe(1)
  expect(ctx.get(aMap)).toBe(2)
  expect(aMapInputTrack.lastInput()).toEqual([{ params: ['1'], payload: 1 }])
})

test(`readonly and plain`, () => {
  const a = reatomNumber(0)
  const aReadonly = a.pipe(readonly, plain)
  const aPlain = a.pipe(readonly, plain)
  const ctx = createTestCtx()
  expect(a(ctx, 1)).toBe(1)
  expect(a.increment(ctx, 1)).toBe(2)
  // @ts-expect-error
  expect(() => aReadonly(ctx, 1)).toThrow()
  // @ts-expect-error
  expect(() => aPlain.increment(ctx, 1)).toThrow()
})

test(`mapPayload, mapPayloadAwaited, toAtom`, async () => {
  const a = action(
    (ctx, v: number) => ctx.schedule(() => sleep(10).then(() => v)),
    'a',
  )
  const aMaybeString = a.pipe(mapPayloadAwaited((ctx, v) => v.toString()))
  const aString = aMaybeString.pipe(toAtom('0'))
  const aNumber = aMaybeString.pipe(
    mapPayload((ctx, v) => Number(v)),
    toAtom(0),
  )
  const ctx = createTestCtx()

  const trackMaybeString = ctx.subscribeTrack(aMaybeString)
  const trackString = ctx.subscribeTrack(aString)
  const trackNumber = ctx.subscribeTrack(aNumber)

  expect(ctx.get(a)).toEqual([])
  expect(ctx.get(aMaybeString)).toEqual([])
  expect(ctx.get(aString)).toBe('0')
  expect(ctx.get(aNumber)).toBe(0)

  const promise = a(ctx, 4)

  expect(trackMaybeString.calls.length).toBe(1)
  expect(trackString.calls.length).toBe(1)
  expect(trackNumber.calls.length).toBe(1)

  await promise

  expect(trackMaybeString.lastInput()).toEqual([{ params: [4], payload: '4' }])
  expect(trackString.lastInput()).toBe('4')
  expect(trackNumber.lastInput()).toBe(4)
})

test(`mapPayloadAwaited sync resolution`, async () => {
  const act = action((ctx) => ctx.schedule(async () => 0))
  const act1 = act.pipe(mapPayloadAwaited((ctx, v) => v + 1))
  const act2 = act.pipe(mapPayloadAwaited((ctx, v) => v + 2))
  const sumAtom = atom((ctx, state: Array<any> = []) => {
    state = [...state]
    ctx.spy(act1).forEach(({ payload }) => state.push(payload))
    ctx.spy(act2).forEach(({ payload }) => state.push(payload))

    return state
  })
  const ctx = createTestCtx()
  const cb = mockFn()

  ctx.subscribe(sumAtom, cb)

  expect(cb.calls.length).toBe(1)
  expect(cb.lastInput()).toEqual([])

  await act(ctx)

  expect(cb.calls.length).toBe(2)
  expect(cb.lastInput()).toEqual([1, 2])
})

test('filter atom', () => {
  const a = atom(1)
  const a1 = a.pipe(filter((ctx, v) => v !== 2))
  const a2 = a.pipe(
    mapState((ctx, v) => [v] as const),
    filter(),
  )
  const ctx = createTestCtx()

  const track1 = ctx.subscribeTrack(a1)
  const track2 = ctx.subscribeTrack(a2)
  expect(track1.calls.length).toBe(1)
  expect(track1.lastInput()).toBe(1)
  expect(track2.calls.length).toBe(1)
  expect(track2.lastInput()).toEqual([1])

  a(ctx, 2)
  expect(track1.calls.length).toBe(1)
  expect(ctx.get(a2)).toEqual([2])
  expect(track2.calls.length).toBe(2)
  expect(track2.lastInput()).toEqual([2])

  a(ctx, 2)
  expect(track1.calls.length).toBe(1)
  expect(track2.calls.length).toBe(2)
  expect(track2.lastInput()).toEqual([2])

  a(ctx, 3)
  expect(track1.calls.length).toBe(2)
  expect(track1.lastInput()).toBe(3)
  expect(track2.calls.length).toBe(3)
  expect(track2.lastInput()).toEqual([3])
})

test('filter action', () => {
  const act = action<number>()
  const act1 = act.pipe(filter((ctx, v) => v !== 2))
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(act1)
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toEqual([])

  act(ctx, 2)
  expect(track.calls.length).toBe(1)

  act(ctx, 3)
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()[0]?.payload).toBe(3)
})

test('debounce atom', async () => {
  const a = atom(0)
  const b = a.pipe(debounce(0))
  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(b)

  a(ctx, 1)
  a(ctx, 2)
  a(ctx, 3)
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe(0)

  await sleep()
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toBe(3)
})

test('debounce action', async () => {
  const a = action<number>()
  const b = a.pipe(debounce(0))
  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(b)

  a(ctx, 1)
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toEqual([])

  await sleep()
  expect(track.calls.length).toBe(2)
  expect(track.lastInput().at(0)?.payload).toBe(1)

  a(ctx, 2)
  a(ctx, 3)
  expect(track.calls.length).toBe(2)

  await sleep()
  expect(track.calls.length).toBe(3)
  expect(track.lastInput().at(0)?.payload).toBe(3)
})

test('sample atom', () => {
  const signal = action()
  const a = atom(0)
  const aSampled = a.pipe(sample(signal))
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(aSampled)
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe(0)

  a(ctx, 1)
  a(ctx, 2)
  expect(track.calls.length).toBe(1)

  signal(ctx)
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toBe(2)
})

test('sample action', () => {
  const signal = atom(0)
  const a = action<number>()
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(a.pipe(sample(signal)))
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toEqual([])

  a(ctx, 1)
  a(ctx, 2)
  expect(track.calls.length).toBe(1)

  signal(ctx, 1)
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toEqual([{ params: [2], payload: 2 }])
})

test('mapPayload atom', () => {
  const act = action((ctx, v: number) => v)
  const actAtom = act.pipe(mapPayload(0))
  const actMapAtom = act.pipe(mapPayload(0, (ctx, v) => v + 1))
  const ctx = createTestCtx()
  const atomTrack = ctx.subscribeTrack(actAtom)
  const actMapTrack = ctx.subscribeTrack(actMapAtom)

  expect(atomTrack.lastInput()).toBe(0)
  expect(actMapTrack.lastInput()).toBe(0)

  act(ctx, 1)
  expect(atomTrack.lastInput()).toBe(1)
  expect(actMapTrack.lastInput()).toBe(2)
})

test('mapPayloadAwaited atom', async () => {
  const act = action((ctx, v: number) => ctx.schedule(() => v))
  const actAtom = act.pipe(mapPayloadAwaited(0))
  const actMapAtom = act.pipe(mapPayloadAwaited(0, (ctx, v) => v + 1))
  const ctx = createTestCtx()
  const atomTrack = ctx.subscribeTrack(actAtom)
  const actMapTrack = ctx.subscribeTrack(actMapAtom)

  expect(atomTrack.lastInput()).toBe(0)
  expect(actMapTrack.lastInput()).toBe(0)

  await act(ctx, 1)
  expect(atomTrack.lastInput()).toBe(1)
  expect(actMapTrack.lastInput()).toBe(2)
})

test('effect', async () => {
  const a = atom(0)
  const b = a.pipe(mapState((ctx, state) => state))
  const c = b.pipe(effect((ctx, state) => state))
  const d = c.pipe(toAtom(0))
  const e = d.pipe(effect(async (ctx, state) => state))
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(e)
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toEqual([])
  expect(ctx.get(d)).toBe(0)

  await sleep()
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toEqual([{ params: [0], payload: 0 }])

  ctx.get(() => {
    a(ctx, 1)
    expect(ctx.get(b)).toBe(1)
    expect(ctx.get(c).length).toBe(0)
    expect(ctx.get(d)).toBe(0)
  })

  expect(track.calls.length).toBe(2)
  expect(ctx.get(d)).toBe(1)

  await sleep()
  expect(track.calls.length).toBe(3)
  expect(track.lastInput()).toEqual([{ params: [1], payload: 1 }])
  expect(ctx.get(d)).toBe(1)
})

test('onLensUpdate', async () => {
  const a = atom(0)
  const b = a.pipe(mapState((ctx, state) => state))
  const c = b.pipe(effect(async (ctx, state) => state))
  const d = combine({
    a,
    c: c.pipe(toAtom(0)),
  })
  const e = action<AtomState<typeof d>>()
  const track = mockFn()
  const ctx = createTestCtx()

  onLensUpdate(
    d.pipe(
      mapState((ctx, state) => {
        ctx.spy(e, ({ payload }) => (state = payload))
        return state
      }),
      toLens([e]),
    ),
    (ctx, value) => track(value),
  )

  expect(track.calls.length).toBe(0)

  a(ctx, 1)
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toEqual({ a: 1, c: 0 })
  await sleep()
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toEqual({ a: 1, c: 1 })

  e(ctx, { a: 2, c: 2 })
  expect(track.calls.length).toBe(3)
  expect(track.lastInput()).toEqual({ a: 2, c: 2 })
})

test('withOnUpdate and sampleBuffer example', () => {
  const sampleBuffer =
    <T>(signal: Atom) =>
    (anAction: Action<[T], T>) => {
      const bufferAtom = atom(
        new Array<T>(),
        `${anAction.__reatom.name}._sampleBuffer`,
      )
      return anAction.pipe(
        mapPayload((ctx, value) => bufferAtom(ctx, (v) => [...v, value])),
        sample(signal),
        withOnUpdate((ctx, v) => bufferAtom(ctx, [])),
      )
    }

  const signal = action()
  const a = action<number>()

  const ctx = createTestCtx()
  const track = mockFn()

  onLensUpdate(a.pipe(sampleBuffer(signal)), (ctx, v) => track(v))

  a(ctx, 1)
  a(ctx, 2)
  a(ctx, 3)
  expect(track.calls.length).toBe(0)

  signal(ctx)
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toEqual([1, 2, 3])

  signal(ctx)
  expect(track.calls.length).toBe(1)

  a(ctx, 4)
  expect(track.calls.length).toBe(1)

  signal(ctx)
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toEqual([4])
})

test('throttle', async () => {
  const a = atom(0)
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(a.pipe(throttle(30)))
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe(0)

  while (track.calls.length === 1) {
    expect(a(ctx, (s) => ++s) <= 5).toBe(true)
    await sleep(10)
  }
})
