import { describe, it, expect, vi } from 'vitest'
import { createTestCtx, mockFn } from '@reatom/testing'
import { ParseAtoms, parseAtoms } from '@reatom/lens'
import { z } from 'zod'
import { reatomZod } from './'

describe('reatomZod', () => {
  it('base API', async () => {
    const model = reatomZod(z.object({ n: z.number(), s: z.string(), readonly: z.string().readonly() }), {
      sync: () => {
        track(parseAtoms(ctx, model))
      },
      initState: { n: 42, readonly: 'foo' },
    })
    const track = mockFn<[ParseAtoms<typeof model>], any>()
    const ctx = createTestCtx()

    expect(model.readonly).toBe('foo')
    expect(ctx.get(model.n)).toBe(42)

    model.s(ctx, 'bar')
    expect(track.lastInput()).toEqual({ n: 42, s: 'bar', readonly: 'foo' })
  })
})
