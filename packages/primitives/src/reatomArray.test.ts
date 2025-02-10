import { createCtx } from '@reatom/core'
import { describe, it, expect } from 'vitest'
import { reatomArray } from './reatomArray'

describe('reatomArray', () => {
  it('init', () => {
    const ctx = createCtx()
    expect(ctx.get(reatomArray([1, 2, 3]))).toEqual([1, 2, 3])
  })

  it('toReversed', () => {
    const ctx = createCtx()
    expect(reatomArray([1, 2, 3]).toReversed(ctx)).toEqual([3, 2, 1])
  })

  it('toSorted', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).toSorted(ctx)).toEqual([1, 2, 3])
  })

  it('toSorted with compareFn', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).toSorted(ctx, (a, b) => b - a)).toEqual([3, 2, 1])
  })

  it('toSpliced', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).toSpliced(ctx, 1, 2, 44)).toEqual([3, 44])
  })

  it('with', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).with(ctx, 1, 15)).toEqual([3, 15, 2])
  })

  it(`push`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    expect(arrayAtom.push(ctx, 4)).toEqual(4)
    expect(ctx.get(arrayAtom)).toEqual([3, 1, 2, 4])
  })

  it(`pop`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    expect(arrayAtom.pop(ctx)).toEqual(2)
    expect(ctx.get(arrayAtom)).toEqual([3, 1])
  })

  it(`shift`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    expect(arrayAtom.shift(ctx)).toEqual(3)
    expect(ctx.get(arrayAtom)).toEqual([1, 2])
  })

  it(`unshift`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    expect(arrayAtom.unshift(ctx, 4, 5)).toEqual(5)
    expect(ctx.get(arrayAtom)).toEqual([4, 5, 3, 1, 2])
  })
})
