import { action, atom } from '@reatom/core'
import { describe, test, expect } from 'vitest'
import { createTestCtx } from './'

describe('createTestCtx', () => {
  test('should track actions and atoms correctly', async () => {
    const add = action<number>()
    const countAtom = atom((ctx, state = 0) => {
      ctx.spy(add, ({ payload }) => (state += payload))
      return state
    })
    const ctx = createTestCtx()
    const track = ctx.subscribeTrack(countAtom)

    expect(track.calls.length).toBe(1) // Initial call count
    expect(track.lastInput()).toBe(0) // Initial state should be 0

    add(ctx, 10)
    expect(track.calls.length).toBe(2) // Call count after adding 10
    expect(track.lastInput()).toBe(10) // Last input should be 10

    ctx.mockAction(add, (ctx, param) => 100)
    add(ctx, 10)
    expect(track.calls.length).toBe(3) // Call count after mocked action
    expect(track.lastInput()).toBe(110) // Last input should reflect mock behavior

    const unmock = ctx.mock(countAtom, 123)
    expect(track.calls.length).toBe(4) // Call count after mocking atom
    expect(track.lastInput()).toBe(123) // Last input should be mocked value
    add(ctx, 10)
    expect(track.calls.length).toBe(4) // Call count remains the same after mock
    expect(track.lastInput()).toBe(123) // Last input should still be mocked value

    unmock() // Restore original behavior
    add(ctx, 10)
    expect(track.calls.length).toBe(5) // Call count after unmocking
    expect(track.lastInput()).toBe(223) // Last input should reflect the updated state
  })
})
