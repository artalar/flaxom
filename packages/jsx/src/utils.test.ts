import { atom } from '@reatom/core'
import { createTestCtx } from '@reatom/testing'
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('parseClasses', () => {
  const ctx = createTestCtx()

  it('handles falsy correctly', () => {
    expect(ctx.get(cn(false))).toBe('')
    expect(ctx.get(cn(true))).toBe('')
    expect(ctx.get(cn(null))).toBe('')
    expect(ctx.get(cn(undefined))).toBe('')
    expect(ctx.get(cn({}))).toBe('')
    expect(ctx.get(cn([]))).toBe('')
    expect(ctx.get(cn(atom(undefined)))).toBe('')
    expect(ctx.get(cn(() => undefined))).toBe('')
  })

  it('handles falsy object correctly', () => {
    expect(
      ctx.get(
        cn({
          a: '',
          b: 0,
          c: NaN,
          d: false,
          e: null,
          f: undefined,
          g: atom(undefined),
        }),
      ),
    ).toBe('')
  })

  it('handles falsy array correctly', () => {
    expect(
      ctx.get(
        cn(['', null, undefined, {}, [], atom(undefined), () => undefined]),
      ),
    ).toBe('')
  })

  it('handles object correctly', () => {
    expect(
      ctx.get(
        cn({
          a: 'a',
          b: 1,
          c: true,
          d: {},
          e: [],
          f: atom(true),
          g: () => undefined,
        }),
      ),
    ).toBe('a b c d e f g')
  })

  it('handles deep array correctly', () => {
    expect(ctx.get(cn(['a', ['b', ['c']]]))).toBe('a b c')
  })

  it('handles deep atom correctly', () => {
    expect(ctx.get(cn(atom(() => atom(() => atom('a')))))).toBe('a')
  })

  it('handles deep getter correctly', () => {
    expect(ctx.get(cn(() => () => () => 'a'))).toBe('a')
  })

  it('handles complex correctly', () => {
    const isBAtom = atom(true)
    const stringAtom = atom('d')
    const classNameAtom = cn(() =>
      atom(() => ['a', { b: isBAtom }, ['c'], stringAtom, () => 'e']),
    )

    expect(ctx.get(classNameAtom)).toBe('a b c d e')

    isBAtom(ctx, false)
    stringAtom(ctx, 'dd')

    expect(ctx.get(classNameAtom)).toBe('a c dd e')
  })
})
