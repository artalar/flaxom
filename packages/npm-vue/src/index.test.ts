import { it, expect } from 'vitest'
import { createTestCtx, mockFn } from '@reatom/testing'
import { effectScope } from 'vue'
import { reatomRef, useAction } from './'
import { action, atom } from '@reatom/core'
import { onConnect, onDisconnect } from '@reatom/hooks'

it('reatomRef', async () => {
  const ctx = createTestCtx()
  const state = atom(0)

  let connected = false
  onConnect(state, () => (connected = true))
  onDisconnect(state, () => (connected = false))

  expect(connected).toBe(false)

  const scope = effectScope()
  scope.run(() => {
    const stateRef = reatomRef(state, ctx)
    expect(connected).toBe(true)
    expect(stateRef.value).toBe(0)
    expect(connected).toBe(true)
    expect((stateRef.value = 1)).toBe(1)
    expect(stateRef.value).toBe(1)
    expect(ctx.get(state)).toBe(1)
    state(ctx, 2)
    expect(stateRef.value).toBe(2)
  })

  expect(connected).toBe(true)
  scope.stop()
  expect(connected).toBe(false)
})

it('useAction', async () => {
  const ctx = createTestCtx()

  const globalActionFn = mockFn()
  const globalAction = action(globalActionFn, 'globalAction')

  const globalActionBound = useAction(globalAction, {
    name: 'globalAction',
    ctx,
  })
  globalActionBound()

  expect(globalActionFn.calls.length).toBe(1)
  expect(globalActionFn.calls[0]!.i.length).toBe(1)
})
