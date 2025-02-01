import { it, expect } from 'vitest'
import { Action, action, atom, Ctx, Fn } from '@reatom/core'
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

it('disposable async branch', async () => {
  const act = action((ctx, v: number) => ctx.schedule(() => Promise.resolve(v)))
  const actRes = act.pipe(mapPayloadAwaited((ctx, v) => v))
  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(actRes)

  track.calls.length = 0
  act(ctx, 1)
  act(ctx, 2)
  expect(track.calls.length).toBe(0)
  await sleep()
  expect(track.calls.length).toBe(2)

  track.calls.length = 0
  const disposableCtx = disposable(ctx)
  act(disposableCtx, 1)
  act(disposableCtx, 2)
  disposableCtx.dispose()
  await sleep()
  expect(track.calls.length).toBe(0)
})

it('take', async () => {
  const act = action((ctx, v: number) => ctx.schedule(() => Promise.resolve(4)))
  const at = atom(0)
  const ctx = createTestCtx()

  setTimeout(act, 0, ctx, 4)
  expect(await take(ctx, act)).toBe(4)

  setTimeout(at, 0, ctx, 4)
  expect(await take(ctx, at)).toBe(4)
})

it('await transaction', async () => {
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
  expect(nestedResolved).toBe(false)
  expect(effect3Resolved).toBe(false)

  resolve2!()
  await sleep()
  expect(nestedResolved).toBe(true)
  expect(effect3Resolved).toBe(false)

  resolve3!()
  await sleep()
  expect(effect3Resolved).toBe(true)
})

it('withAbortableSchedule', async () => {
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
  expect(track.calls.length).toBe(1)

  un()

  ctx.subscribe(someAtom, () => {})()
  await sleep(10)
  expect(track.calls.length).toBe(1)
})
it('take filter', async () => {
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
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe('4')
})

it('concurrent', async () => {
  const countAtom = atom(0)
  const results: any[] = []
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
  expect(results).toEqual(['AbortError', 2])

  const anAtom1 = atom(null)
  onConnect(anAtom1, (ctx) => countAtom(ctx, 3))
  ctx.subscribeTrack(anAtom1).unsubscribe()
  await sleep()
  expect(results).toEqual(['AbortError', 2, 'AbortError'])

  const anAtom2 = atom(null)
  onConnect(anAtom2, async (ctx) => {
    await null
    countAtom(ctx, 4)
  })
  ctx.subscribeTrack(anAtom2).unsubscribe()
  await sleep()
  expect(results).toEqual(['AbortError', 2, 'AbortError', 'AbortError'])
})

it('spawn', async () => {
  const countAtom = atom(0)
  const results: any[] = []
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
  expect(results).toEqual([1, 2])
})

it('reaction base usage', async () => {
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
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe(0)

  a(ctx, 1)
  a(ctx, 2)
  a(ctx, 3)
  await sleep()
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toBe(3)

  a(ctx, 4)
  reactionAtom.unsubscribe()
  await sleep()
  expect(track.calls.length).toBe(2)

  let changed = false
  reactionAtom.onChange((ctx, value) => {
    changed = true
  })
  a(ctx, 5)
  expect(changed).toBe(false)
})

it('reaction parameters usage', async () => {
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
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe('1a')

  a(ctx, 'b')
  someReaction(ctx, '2')
  a(ctx, 'c')
  await sleep()
  expect(track.calls.length).toBe(3)
  expect(track.inputs()).toEqual(['1a', '1c', '2c'])

  reactionAtom.unsubscribe()
  a(ctx, 'd')
  await sleep()
  expect(track.calls.length).toBe(4)
  expect(track.inputs()).toEqual(['1a', '1c', '2c', '2d'])
})

it('throttle example', async () => {
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
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe(1)
  update(ctx, 2)
  update(ctx, 3)
  await sleep()
  expect(track.calls.length).toBe(1)
  expect(track.lastInput()).toBe(1)

  update(ctx, 4)
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toBe(4)
  update(ctx, 5)
  update(ctx, 6)
  await sleep()
  expect(track.calls.length).toBe(2)
  expect(track.lastInput()).toBe(4)
})
