import { action, atom } from '@reatom/core'
import { it, expect } from 'vitest'
import { createTestCtx } from './'

it('createTestCtx', () => {
  const act = action((ctx) => ctx.schedule(() => 123))
  const ctx = createTestCtx()
  const listener = ctx.subscribeTrack(act)

  expect(listener.calls.length).toBe(1) // Initial call count
  ctx.mock(act, [{ params: [], payload: Promise.resolve(42) }])
  expect(listener.calls.length).toBe(2) // Call count after mock

  listener.calls.length = 0 // Reset call count
  await act(ctx)
  expect(listener.calls.length).toBe(1) // Call count after act execution

  listener.calls.length = 0 // Reset call count
  ctx.mock(act, [{ params: [], payload: Promise.resolve(43) }])
  expect(listener.calls.length).toBe(1) // Call count remains
  expect(await listener.lastInput()[0]?.payload).toBe(43) // Last input should return mocked payload
})

it('countAtom', () => {
  const countAtom = atom(0)
  const add = action((ctx, value: number) => {
    return countAtom(ctx, value)
  })
  const paramsAtom = atom((ctx) => ctx.spy(add).map(({ params }) => params[0]))
  const payloadAtom = atom((ctx) => ctx.spy(add).map(({ payload }) => payload))
  const ctx = createTestCtx()

  const countTrack = ctx.subscribeTrack(countAtom)
  const paramsTrack = ctx.subscribeTrack(paramsAtom)
  const payloadTrack = ctx.subscribeTrack(payloadAtom)

  add(ctx, 1)
  expect(countTrack.lastInput()).toBe(1) // Check initial input for count
  expect(paramsTrack.lastInput()).toEqual([1]) // Check initial params
  expect(payloadTrack.lastInput()).toEqual([1]) // Check initial payload

  const unmock = ctx.mockAction(add, (ctx, value) => {
    expect(value).toBe(10) // Check if value is 10 during mock
    return countAtom(ctx, 2) // Mocked return value
  })
  ctx.get(() => {
    add(ctx, 10) // Call mocked action
    add(ctx, 10) // Call mocked action again
  })
  expect(countTrack.lastInput()).toBe(2) // Check updated count after mock
  expect(paramsTrack.lastInput()).toEqual([10, 10]) // Check params from mocked calls
  expect(payloadTrack.lastInput()).toEqual([2, 2]) // Check payload from mocked calls

  unmock() // Restore original action behavior
  add(ctx, 10)
  expect(countTrack.lastInput()).toBe(10) // Check count after unmock
  expect(paramsTrack.lastInput()).toEqual([10]) // Check params after unmock
  expect(payloadTrack.lastInput()).toEqual([10]) // Check payload after unmock
})

it('mock computed atom', () => {
  const testAtom = atom<string>(() => {
    throw new Error('unreachable')
  }, 'testAtom')

  const ctx = createTestCtx()

  ctx.mock(testAtom, 'mocked')

  expect(ctx.get(testAtom)).toBe('mocked')
})
