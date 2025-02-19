import { describe, test, expect } from 'vitest'
import { action, atom } from '@reatom/core'
import { createTestCtx } from '@reatom/testing'
import { noop, random } from '@reatom/utils'
import { withComputed } from '@reatom/primitives'
import { createMemStorage, reatomPersist } from './'

const withSomePersist = reatomPersist(createMemStorage({ name: 'test' }))

describe('base', () => {
  test('should persist and update state correctly', async () => {
    const a1 = atom(0).pipe(withSomePersist('a1'))
    const a2 = atom(0).pipe(withSomePersist('a2'))

    const ctx = createTestCtx()
    withSomePersist.storageAtom(
      ctx,
      createMemStorage({
        name: 'test',
        snapshot: {
          a1: 1,
          a2: 2,
        },
      }),
    )

    expect(ctx.get(a1)).toBe(1)
    expect(ctx.get(a2)).toBe(2)

    a1(ctx, 11)
    expect(ctx.get(a1)).toBe(11)
    expect(ctx.get(a2)).toBe(2)
    expect(ctx.get(withSomePersist.storageAtom).get(ctx, 'a1')?.data).toBe(11)

    ctx.get((): void => {
      a1(ctx, 12)
      a1(ctx, (state) => (state ? state : state))
    })
    expect(ctx.get(a1)).toBe(12)
    expect(ctx.get(withSomePersist.storageAtom).get(ctx, 'a1')?.data).toBe(12)
  })
})

describe('async', () => {
  test('should handle async updates', async () => {
    let trigger = noop
    const number1Atom = atom(0).pipe(withSomePersist({ key: 'test' }))
    const number2Atom = atom(0).pipe(withSomePersist({ key: 'test' }))

    const ctx = createTestCtx()
    withSomePersist.storageAtom(ctx, (storage) => ({
      ...storage,
      async set(ctx, key, rec) {
        await new Promise((resolve) => (trigger = resolve))
        storage.set(ctx, key, rec)
      },
    }))
    const track = ctx.subscribeTrack(number2Atom)
    track.calls.length = 0

    expect(ctx.get(number1Atom)).toBe(0)
    expect(ctx.get(number2Atom)).toBe(0)

    number1Atom(ctx, 11)
    expect(ctx.get(number1Atom)).toBe(11)
    expect(ctx.get(number2Atom)).toBe(0)
    expect(track.calls.length).toBe(0)
    await null
    expect(ctx.get(number2Atom)).toBe(0)
    expect(track.calls.length).toBe(0)

    trigger()
    await null

    expect(track.calls.length).toBe(1)
    expect(track.lastInput()).toBe(11)
  })
})

describe('should not skip double update', () => {
  test('should persist and update state correctly', async () => {
    const a1 = atom(0).pipe(withSomePersist('a1'))
    const a2 = atom(0).pipe(withSomePersist('a2'))

    const ctx = createTestCtx()
    withSomePersist.storageAtom(
      ctx,
      createMemStorage({
        name: 'test',
        snapshot: {
          a1: 1,
          a2: 2,
        },
      }),
    )

    expect(ctx.get(a1)).toBe(1)
    expect(ctx.get(a2)).toBe(2)

    a1(ctx, 11)
    expect(ctx.get(a1)).toBe(11)
    expect(ctx.get(a2)).toBe(2)
  })
})

describe('should memoize a computer', () => {
  test('should compute and memoize correctly', () => {
    const ctx = createTestCtx()
    const storage = withSomePersist.storageAtom(
      ctx,
      createMemStorage({
        name: 'test',
        snapshot: {
          a: 1,
        },
      }),
    )

    const noop = atom({})
    const a = atom(0).pipe(
      withComputed((ctx, state) => {
        ctx.spy(noop)
        computedCalls++
        return state
      }),
      withSomePersist('a'),
    )
    let computedCalls = 0

    expect(ctx.get(a)).toBe(1)
    expect(computedCalls).toBe(1)

    storage.set(ctx, 'a', {
      data: 2,
      fromState: false,
      id: random(),
      timestamp: Date.now(),
      to: Date.now() + 5 * 1000,
      version: 0,
    })
    expect(ctx.get(a)).toBe(2)
    expect(computedCalls).toBe(1)

    noop(ctx, {})
    ctx.get(a)
    expect(computedCalls).toBe(2)
  })
})

describe('should not accept an action', () => {
  test('should throw an error', () => {
    expect(() => action().pipe(withSomePersist('test'))).toThrow()
  })
})
