import { createCtx } from '@reatom/core'
import { describe, test, expect } from 'vitest'
import { reatomArray } from './reatomArray'

describe('reatomArray', () => {
  test('init', () => {
    const ctx = createCtx()
    expect(ctx.get(reatomArray([1, 2, 3]))).toEqual([1, 2, 3])
  })

  test('toReversed', () => {
    const ctx = createCtx()
    expect(reatomArray([1, 2, 3]).toReversed(ctx)).toEqual([3, 2, 1])
  })

  test('toSorted', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).toSorted(ctx)).toEqual([1, 2, 3])
  })

  test('toSorted with compareFn', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).toSorted(ctx, (a, b) => b - a)).toEqual([
      3, 2, 1,
    ])
  })

  test('toSpliced', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).toSpliced(ctx, 1, 2, 44)).toEqual([3, 44])
  })

  test('with', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).with(ctx, 1, 15)).toEqual([3, 15, 2])
  })

  test(`push`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    expect(arrayAtom.push(ctx, 4)).toEqual(4)
    expect(ctx.get(arrayAtom)).toEqual([3, 1, 2, 4])
  })

  test(`pop`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    expect(arrayAtom.pop(ctx)).toEqual(2)
    expect(ctx.get(arrayAtom)).toEqual([3, 1])
  })

  test(`shift`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    expect(arrayAtom.shift(ctx)).toEqual(3)
    expect(ctx.get(arrayAtom)).toEqual([1, 2])
  })

  test(`unshift`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    expect(arrayAtom.unshift(ctx, 4, 5)).toEqual(5)
    expect(ctx.get(arrayAtom)).toEqual([4, 5, 3, 1, 2])
  })
})
