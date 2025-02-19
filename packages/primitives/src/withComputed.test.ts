import { atom, createCtx } from '@reatom/core'
import { describe, test, expect } from 'vitest'

import { withComputed } from './withComputed'

describe('withComputed', () => {
  test('should compute value based on dependencies', () => {
    const a = atom(0)
    const b = atom(0).pipe(withComputed((ctx) => ctx.spy(a)))
    const ctx = createCtx()

    expect(ctx.get(b)).toBe(0) // Initial value of b should be 0
    b(ctx, 1) // Set b to 1
    expect(ctx.get(b)).toBe(1) // b should now be 1
    a(ctx, 2) // Update a to 2
    expect(ctx.get(b)).toBe(2) // b should now reflect the updated value of a
  })
})
