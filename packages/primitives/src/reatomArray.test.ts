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
    expect(
    reatomArray([3, 1, 2]).toSorted(ctx, (a, b) => b - a)).toEqual([3, 2, 1],)
  })

  it('toSpliced', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).toSpliced(ctx, 1, 2, 44)).toEqual([3, 44])
  })

  it('with', () => {
    const ctx = createCtx()
    expect(reatomArray([3, 1, 2]).with(ctx, 1, 15)).toEqual([3, 15, 2])
  })

  test(`reatomArray. push`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    assert.equal(arrayAtom.push(ctx, 4), 4)
    assert.equal(ctx.get(arrayAtom), [3, 1, 2, 4])
  })

  test(`reatomArray. pop`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    assert.equal(arrayAtom.pop(ctx), 2)
    assert.equal(ctx.get(arrayAtom), [3, 1])
  })

  test(`reatomArray. shift`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    assert.equal(arrayAtom.shift(ctx), 3)
    assert.equal(ctx.get(arrayAtom), [1, 2])
  })

  test(`reatomArray. unshift`, () => {
    const ctx = createCtx()
    const arrayAtom = reatomArray([3, 1, 2])

    assert.equal(arrayAtom.unshift(ctx, 4, 5), 5)
    assert.equal(ctx.get(arrayAtom), [4, 5, 3, 1, 2])
  })
})
