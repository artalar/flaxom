import { createCtx } from '@reatom/core'
import { describe, it, expect } from 'vitest'

import { reatomString } from './reatomString'

describe('reatomString', () => {
  it('should reset to initial value', () => {
    const ctx = createCtx()
    const a = reatomString(`string`)

    expect(ctx.get(a)).toBe(`string`)

    a(ctx, (s) => `s`)

    expect(ctx.get(a)).toBe(`s`)
    a.reset(ctx)
    expect(ctx.get(a)).toBe(`string`)
  })
})
