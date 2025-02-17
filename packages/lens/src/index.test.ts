import { Action, Atom, AtomState, action, atom } from '@reatom/core'
import { sleep } from '@reatom/utils'
import { reatomNumber } from '@reatom/primitives'
import { createTestCtx, mockFn } from '@reatom/testing'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

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

  assert.is(ctx.get(a), 0)
  assert.is(ctx.get(aMap), 1)
  assert.equal(ctx.get(aMapInput), [])

  aMapInput(ctx, '1')
  assert.is(ctx.get(a), 1)
  assert.is(ctx.get(aMap), 2)
  assert.equal(aMapInputTrack.lastInput(), [{ params: ['1'], payload: 1 }])
  ;`👍` //?
})

test(`readonly and plain`, () => {
  const a = reatomNumber(0)
  const aReadonly = a.pipe(readonly, plain)
  const aPlain = a.pipe(readonly, plain)
  const ctx = createTestCtx()
  assert.is(a(ctx, 1), 1)
  assert.is(a.increment(ctx, 1), 2)
  // @ts-expect-error
  assert.throws(() => aReadonly(ctx, 1))
  // @ts-expect-error
  assert.throws(() => aPlain.increment(ctx, 1))
  ;`👍` //?
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

  assert.equal(ctx.get(a), [])
  assert.equal(ctx.get(aMaybeString), [])
  assert.is(ctx.get(aString), '0')
  assert.is(ctx.get(aNumber), 0)

  const promise = a(ctx, 4)

  assert.is(trackMaybeString.calls.length, 1)
  assert.is(trackString.calls.length, 1)
  assert.is(trackNumber.calls.length, 1)

  await promise

  assert.equal(trackMaybeString.lastInput(), [{ params: [4], payload: '4' }])
  assert.is(trackString.lastInput(), '4')
  assert.is(trackNumber.lastInput(), 4)
  ;`👍` //?
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

  assert.equal(cb.calls.length, 1)
  assert.equal(cb.lastInput(), [])

  await act(ctx)

  assert.equal(cb.calls.length, 2)
  assert.equal(cb.lastInput(), [1, 2])
  ;`👍` //?
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
  assert.is(track1.calls.length, 1)
  assert.is(track1.lastInput(), 1)
  assert.is(track2.calls.length, 1)
  assert.equal(track2.lastInput(), [1])

  a(ctx, 2)
  assert.is(track1.calls.length, 1)
  assert.equal(ctx.get(a2), [2])
  assert.is(track2.calls.length, 2)
  assert.equal(track2.lastInput(), [2])

  a(ctx, 2)
  assert.is(track1.calls.length, 1)
  assert.is(track2.calls.length, 2)
  assert.equal(track2.lastInput(), [2])

  a(ctx, 3)
  assert.is(track1.calls.length, 2)
  assert.is(track1.lastInput(), 3)
  assert.is(track2.calls.length, 3)
  assert.equal(track2.lastInput(), [3])
  ;`👍` //?
})

test('filter action', () => {
  const act = action<number>()
  const act1 = act.pipe(filter((ctx, v) => v !== 2))
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(act1)
  assert.is(track.calls.length, 1)
  assert.equal(track.lastInput(), [])

  act(ctx, 2)
  assert.is(track.calls.length, 1)

  act(ctx, 3)
  assert.is(track.calls.length, 2)
  assert.equal(track.lastInput()[0]?.payload, 3)
  ;`👍` //?
})

test('debounce atom', async () => {
  const a = atom(0)
  const b = a.pipe(debounce(0))
  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(b)

  a(ctx, 1)
  a(ctx, 2)
  a(ctx, 3)
  assert.is(track.calls.length, 1)
  assert.equal(track.lastInput(), 0)

  await sleep()
  assert.is(track.calls.length, 2)
  assert.is(track.lastInput(), 3)
  ;`👍` //?
})

test('debounce action', async () => {
  const a = action<number>()
  const b = a.pipe(debounce(0))
  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(b)

  a(ctx, 1)
  assert.is(track.calls.length, 1)
  assert.equal(track.lastInput(), [])

  await sleep()
  assert.is(track.calls.length, 2)
  assert.is(track.lastInput().at(0)?.payload, 1)

  a(ctx, 2)
  a(ctx, 3)
  assert.is(track.calls.length, 2)

  await sleep()
  assert.is(track.calls.length, 3)
  assert.is(track.lastInput().at(0)?.payload, 3)
  ;`👍` //?
})

test('sample atom', () => {
  const signal = action()
  const a = atom(0)
  const aSampled = a.pipe(sample(signal))
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(aSampled)
  assert.is(track.calls.length, 1)
  assert.equal(track.lastInput(), 0)

  a(ctx, 1)
  a(ctx, 2)
  assert.is(track.calls.length, 1)

  signal(ctx)
  assert.is(track.calls.length, 2)
  assert.equal(track.lastInput(), 2)
  ;`👍` //?
})

test('sample action', () => {
  const signal = atom(0)
  const a = action<number>()
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(a.pipe(sample(signal)))
  assert.is(track.calls.length, 1)
  assert.equal(track.lastInput(), [])

  a(ctx, 1)
  a(ctx, 2)
  assert.is(track.calls.length, 1)

  signal(ctx, 1)
  assert.is(track.calls.length, 2)
  assert.equal(track.lastInput(), [{ params: [2], payload: 2 }])
  ;`👍` //?
})

test('mapPayload atom', () => {
  const act = action((ctx, v: number) => v)
  const actAtom = act.pipe(mapPayload(0))
  const actMapAtom = act.pipe(mapPayload(0, (ctx, v) => v + 1))
  const ctx = createTestCtx()
  const atomTrack = ctx.subscribeTrack(actAtom)
  const actMapTrack = ctx.subscribeTrack(actMapAtom)

  assert.is(atomTrack.lastInput(), 0)
  assert.is(actMapTrack.lastInput(), 0)

  act(ctx, 1)
  assert.is(atomTrack.lastInput(), 1)
  assert.is(actMapTrack.lastInput(), 2)
  ;`👍` //?
})

test('mapPayloadAwaited atom', async () => {
  const act = action((ctx, v: number) => ctx.schedule(() => v))
  const actAtom = act.pipe(mapPayloadAwaited(0))
  const actMapAtom = act.pipe(mapPayloadAwaited(0, (ctx, v) => v + 1))
  const ctx = createTestCtx()
  const atomTrack = ctx.subscribeTrack(actAtom)
  const actMapTrack = ctx.subscribeTrack(actMapAtom)

  assert.is(atomTrack.lastInput(), 0)
  assert.is(actMapTrack.lastInput(), 0)

  await act(ctx, 1)
  assert.is(atomTrack.lastInput(), 1)
  assert.is(actMapTrack.lastInput(), 2)
  ;`👍` //?
})

test('effect', async () => {
  const a = atom(0)
  const b = a.pipe(mapState((ctx, state) => state))
  const c = b.pipe(effect((ctx, state) => state))
  const d = c.pipe(toAtom(0))
  const e = d.pipe(effect(async (ctx, state) => state))
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(e)
  assert.is(track.calls.length, 1)
  assert.equal(track.lastInput(), [])
  assert.is(ctx.get(d), 0)

  await sleep()
  assert.is(track.calls.length, 2)
  assert.equal(track.lastInput(), [{ params: [0], payload: 0 }])

  ctx.get(() => {
    a(ctx, 1)
    assert.is(ctx.get(b), 1)
    assert.is(ctx.get(c).length, 0)
    assert.is(ctx.get(d), 0)
  })

  assert.is(track.calls.length, 2)
  assert.is(ctx.get(d), 1)

  await sleep()
  assert.is(track.calls.length, 3)
  assert.equal(track.lastInput(), [{ params: [1], payload: 1 }])
  assert.is(ctx.get(d), 1)
  ;`👍` //?
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

  assert.is(track.calls.length, 0)

  a(ctx, 1)
  assert.is(track.calls.length, 1)
  track.lastInput() //?
  assert.equal(track.lastInput(), { a: 1, c: 0 })
  await sleep()
  assert.is(track.calls.length, 2)
  assert.equal(track.lastInput(), { a: 1, c: 1 })

  e(ctx, { a: 2, c: 2 })
  assert.is(track.calls.length, 3)
  assert.equal(track.lastInput(), { a: 2, c: 2 })
  ;`👍` //?
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
  assert.is(track.calls.length, 0)

  signal(ctx)
  assert.is(track.calls.length, 1)
  assert.equal(track.lastInput(), [1, 2, 3])

  signal(ctx)
  assert.is(track.calls.length, 1)

  a(ctx, 4)
  assert.is(track.calls.length, 1)

  signal(ctx)
  assert.is(track.calls.length, 2)
  assert.equal(track.lastInput(), [4])
  ;`👍` //?
})

test('throttle', async () => {
  const a = atom(0)
  const ctx = createTestCtx()

  const track = ctx.subscribeTrack(a.pipe(throttle(30)))
  assert.is(track.calls.length, 1)
  assert.equal(track.lastInput(), 0)

  while (track.calls.length === 1) {
    assert.is(a(ctx, (s) => ++s) <= 5, true)
    await sleep(10)
  }

  ;`👍` //?
})

test.run()
