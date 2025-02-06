import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { Action, action, atom, Ctx, CtxSpy, Fn } from '@reatom/core'
import { noop, sleep } from '@reatom/utils'
import { createTestCtx, mockFn } from '@reatom/testing'
import { onConnect } from '@reatom/hooks'
import { mapPayloadAwaited } from '@reatom/lens'

import {
  concurrent,
  disposable,
  reaction,
  spawn,
  take,
  takeNested,
  withAbortableSchedule,
  // effects should be tested only on top of builded sources
} from '../build'

test('disposable async branch', async () => {
  const act = action((ctx, v: number) => ctx.schedule(() => Promise.resolve(v)))
  const actRes = act.pipe(mapPayloadAwaited((ctx, v) => v))
  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(actRes)

  track.calls.length = 0
  act(ctx, 1)
  act(ctx, 2)
  assert.is(track.calls.length, 0)
  await sleep()
  assert.is(track.calls.length, 2)

  track.calls.length = 0
  const disposableCtx = disposable(ctx)
  act(disposableCtx, 1)
  act(disposableCtx, 2)
  disposableCtx.dispose()
  await sleep()
  assert.is(track.calls.length, 0)
})

test('take', async () => {
  const act = action((ctx, v: number) => ctx.schedule(() => Promise.resolve(4)))
  const at = atom(0)
  const ctx = createTestCtx()

  setTimeout(act, 0, ctx, 4)
  assert.is(await take(ctx, act), 4)

  setTimeout(at, 0, ctx, 4)
  assert.is(await take(ctx, at), 4)
})

test('await transaction', async () => {
  let resolve1: Fn
  const promise1 = new Promise<void>((r) => (resolve1 = r))
  let resolve2: Fn
  const promise2 = new Promise<void>((r) => (resolve2 = r))
  let resolve3: Fn
  const promise3 = new Promise<void>((r) => (resolve3 = r))

  const effect1 = action((ctx) =>
    ctx.schedule(async (ctx) => {
      effect2(ctx)
      await promise1
    }),
  )
  const effect2 = action((ctx) => ctx.schedule(() => promise2))
  const effect3 = action((ctx) => ctx.schedule(() => promise3))

  const ctx = createTestCtx()

  let nestedResolved = false
  let effect3Resolved = false
  takeNested(ctx, effect1).then(() => {
    nestedResolved = true
  })
  effect3(ctx).then(() => {
    effect3Resolved = true
  })

  resolve1!()
  await sleep()
  assert.is(nestedResolved, false)
  assert.is(effect3Resolved, false)

  resolve2!()
  await sleep()
  assert.is(nestedResolved, true)
  assert.is(effect3Resolved, false)

  resolve3!()
  await sleep()
  assert.is(effect3Resolved, true)
})

test('withAbortableSchedule', async () => {
  const asyncAction = <I extends any[], O>(cb: Fn<[Ctx, ...I], O>, name: string): Action<I, O> =>
    action((ctx, ...a) => cb(withAbortableSchedule(ctx), ...a), name)

  const track = mockFn()
  const doSome = asyncAction((ctx, ms: number) => {
    ctx
      .schedule(() => sleep(ms))
      .then((v) => {
        v //?
        track(v)
      })
      .catch(noop)
  }, 'doSome')
  const someAtom = atom(null, 'someAtom')
  const ctx = createTestCtx()

  onConnect(someAtom, (ctx) => {
    doSome(ctx, 1)
  })

  const un = ctx.subscribe(someAtom, () => {})
  await sleep(10)
  assert.is(track.calls.length, 1)

  un()

  ctx.subscribe(someAtom, () => {})()
  await sleep(10)
  assert.is(track.calls.length, 1)
})

test('take filter', async () => {
  const act = action((ctx, v: number) => ctx.schedule(() => Promise.resolve(v)))
  const track = mockFn()
  const ctx = createTestCtx()

  take(ctx, act, (ctx, v, skip) => {
    return v < 4 ? skip : v.toString()
  }).then(track)
  act(ctx, 1)
  await null
  act(ctx, 2)
  act(ctx, 3)
  await null
  act(ctx, 4)
  await sleep()
  assert.is(track.calls.length, 1)
  assert.is(track.lastInput(), '4')
})

test('concurrent', async () => {
  const countAtom = atom(0)
  const results = [] as any[]
  countAtom.onChange(
    concurrent(async (ctx, count) => {
      try {
        await ctx.schedule(noop)
        results.push(count)
      } catch (error: any) {
        results.push(error?.name)
      }
    }),
  )
  const ctx = createTestCtx()

  countAtom(ctx, 1)
  countAtom(ctx, 2)
  await sleep()
  assert.equal(results, ['AbortError', 2])

  const anAtom1 = atom(null)
  onConnect(anAtom1, (ctx) => countAtom(ctx, 3))
  ctx.subscribeTrack(anAtom1).unsubscribe()
  await sleep()
  assert.equal(results, ['AbortError', 2, 'AbortError'])

  const anAtom2 = atom(null)
  onConnect(anAtom2, async (ctx) => {
    await null
    countAtom(ctx, 4)
  })
  ctx.subscribeTrack(anAtom2).unsubscribe()
  await sleep()
  // there was `ReferenceError: Cannot access 'controller' before initialization` previously
  assert.equal(results, ['AbortError', 2, 'AbortError', 'AbortError'])
})

test('spawn', async () => {
  const countAtom = atom(0)
  const results = [] as any[]
  countAtom.onChange(
    concurrent((ctx, count) =>
      spawn(ctx, async (ctx) => {
        try {
          await ctx.schedule(noop)
          results.push(count)
        } catch (error) {
          results.push(error)
        }
      }),
    ),
  )
  const ctx = createTestCtx()

  countAtom(ctx, 1)
  countAtom(ctx, 2)

  await sleep()
  assert.equal(results, [1, 2])
})

test('reaction base usage', async () => {
  const a = atom(0)
  const someReaction = reaction(async (ctx) => {
    const value = ctx.spy(a)
    await ctx.schedule(() => sleep())
    return track(value)
  })
  const track = mockFn((value: number) => value)
  const ctx = createTestCtx()

  const reactionAtom = someReaction(ctx)
  await sleep()
  assert.is(track.calls.length, 1)
  assert.is(track.lastInput(), 0)

  a(ctx, 1)
  a(ctx, 2)
  a(ctx, 3)
  await sleep()
  assert.is(track.calls.length, 2)
  assert.is(track.lastInput(), 3)

  a(ctx, 4)
  reactionAtom.unsubscribe()
  await sleep()
  assert.is(track.calls.length, 2)

  let changed = false
  reactionAtom.onChange((ctx, value) => {
    changed = true
  })
  a(ctx, 5)
  assert.is(changed, false)
})

test('reaction parameters usage', async () => {
  const a = atom('a')
  const someReaction = reaction(async (ctx, param: string) => {
    const value = ctx.spy(a)
    await ctx.schedule(() => sleep())
    return track(param + value)
  })
  const track = mockFn((value: string) => value)
  const ctx = createTestCtx()

  const reactionAtom = someReaction(ctx, '1')
  await sleep()
  assert.is(track.calls.length, 1)
  assert.is(track.lastInput(), '1a')

  a(ctx, 'b')
  someReaction(ctx, '2')
  a(ctx, 'c')
  await sleep()
  assert.is(track.calls.length, 3)
  assert.equal(track.inputs(), ['1a', '1c', '2c'])

  reactionAtom.unsubscribe()
  a(ctx, 'd')
  await sleep()
  assert.is(track.calls.length, 4)
  assert.equal(track.inputs(), ['1a', '1c', '2c', '2d'])
})

test('throttle example', async () => {
  const ctx = createTestCtx()
  const n = atom(0)
  const update = action(
    concurrent(async (ctx, payload: number) => {
      n(ctx, payload)
      await ctx.schedule(() => sleep())
    }, 'first-in-win'),
  )

  const track = ctx.subscribeTrack(n)
  track.calls.length = 0

  update(ctx, 1)
  assert.is(track.calls.length, 1)
  assert.is(track.lastInput(), 1)
  update(ctx, 2)
  update(ctx, 3)
  await sleep()
  assert.is(track.calls.length, 1)
  assert.is(track.lastInput(), 1)

  update(ctx, 4)
  assert.is(track.calls.length, 2)
  assert.is(track.lastInput(), 4)
  update(ctx, 5)
  update(ctx, 6)
  await sleep()
  assert.is(track.calls.length, 2)
  assert.is(track.lastInput(), 4)
})

test('concurrent recursion', async () => {
  const ctx = createTestCtx()

  const n = atom(0)
  const doSome = action(
    concurrent(async (ctx) => {
      await ctx.schedule(() => {})
      if (ctx.get(n) < 5) n(ctx, (s) => s + 1)
    }),
  )
  n.onChange(doSome)

  doSome(ctx).catch(noop)

  await sleep()

  assert.is(ctx.get(n), 5)
})

test('reaction recursion', async () => {
  const ctx = createTestCtx()

  let target = 5
  const n = atom(0)
  const watchSome = reaction(
    concurrent(async (ctx: CtxSpy) => {
      const state = ctx.spy(n)

      await ctx.schedule(() => sleep())

      if (state < target) n(ctx, (s) => s + 1)
    }),
  )

  const someReaction = watchSome(ctx)
  await sleep(10)
  assert.is(ctx.get(n), 5)

  target = 10
  n(ctx, 6)
  await ctx.get(someReaction)
  assert.is(ctx.get(n), 7)

  someReaction.unsubscribe()
  await sleep(10)
  assert.is(ctx.get(n), 7)
})

test.run()
