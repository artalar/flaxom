import { createCtx } from '@reatom/core'
import { describe, it, expect } from 'vitest'
import { reatomEnum } from './reatomEnum'

describe('reatomEnum', () => {
  it('static enum property', async () => {
    const enumAtom = reatomEnum(['a', 'b'])
    expect(enumAtom.enum).toEqual({ a: 'a', b: 'b' })
  })

  it('camelCase', async () => {
    const sortFilterAtom = reatomEnum(['fullName', 'created', 'updated', 'pushed'])
    const ctx = createCtx()

    sortFilterAtom.setUpdated(ctx)
    expect(ctx.get(sortFilterAtom)).toBe('updated')
  })

  it('snake_case', async () => {
    const cases = ['full_name', 'created', 'updated', 'pushed'] as const
    const sortFilterAtom = reatomEnum(cases, { format: 'snake_case' })
    const ctx = createCtx()

    expect(cases).toEqual(Object.keys(sortFilterAtom.enum))
    expect(cases).toEqual(Object.values(sortFilterAtom.enum))
    expect(ctx.get(sortFilterAtom)).toBe('full_name')

    sortFilterAtom.set_updated(ctx)
    expect(ctx.get(sortFilterAtom)).toBe('updated')
  })

  it('reset', () => {
    const enumAtom = reatomEnum(['a', 'b'], { initState: 'b' })
    const ctx = createCtx()

    expect(ctx.get(enumAtom)).toBe('b')
    enumAtom(ctx, () => 'a')
    expect(ctx.get(enumAtom)).toBe('a')

    enumAtom.reset(ctx)
    expect(ctx.get(enumAtom)).toBe('b')
  })
})
