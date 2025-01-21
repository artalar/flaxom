import { describe, test, expect, vi } from 'vitest'
import { createTestCtx, mockFn } from '@reatom/testing'
import { onConnect } from '@reatom/hooks'
import { atom } from '@reatom/core'
import { onEvent } from './'

describe('onEvent Tests', () => {
  test('onEvent', async () => {
    const a = atom(null)
    const ctx = createTestCtx()
    const cb = mockFn()

    {
      const controller = new AbortController()
      onConnect(a, (ctx) => onEvent(ctx, controller.signal, 'abort', cb))
      const un = ctx.subscribe(a, () => {})
      expect(cb.calls.length).toBe(0)
      controller.abort()
      expect(cb.lastInput()?.type).toBe('abort')
      un()
    }

    cb.calls.length = 0

    {
      const controller = new AbortController()
      onConnect(a, (ctx) => onEvent(ctx, controller.signal, 'abort', cb))
      const un = ctx.subscribe(a, () => {})
      un()
      expect(cb.calls.length).toBe(0)
      controller.abort()
      expect(cb.calls.length).toBe(0)
    }
  })
})
