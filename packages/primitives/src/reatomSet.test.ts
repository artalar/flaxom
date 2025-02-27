import 'core-js/proposals/set-methods-v2'
import { test, expect } from 'vitest'
import { createCtx } from '@reatom/core'
import { reatomSet } from './reatomSet'

test(`reatomSet. init`, () => {
  const ctx = createCtx()

  expect(ctx.get(reatomSet(new Set([1, 2, 3])))).toEqual(new Set([1, 2, 3]))
})

test(`reatomSet. add`, () => {
  const ctx = createCtx()

  expect(reatomSet(new Set([1, 2, 3])).add(ctx, 4)).toEqual(
    new Set([1, 2, 3, 4]),
  )
})

test(`reatomSet. delete`, () => {
  const ctx = createCtx()

  expect(reatomSet(new Set([1, 2, 3])).delete(ctx, 3)).toEqual(new Set([1, 2]))
})

test(`reatomSet. toggle`, () => {
  const ctx = createCtx()
  const a = reatomSet(new Set([1, 2, 3]))

  expect(a.toggle(ctx, 3)).toEqual(new Set([1, 2]))
  expect(a.toggle(ctx, 3)).toEqual(new Set([1, 2, 3]))
})

test(`reatomSet. clear`, () => {
  const ctx = createCtx()

  expect(reatomSet(new Set([1, 2, 3])).clear(ctx)).toEqual(new Set())
})

test(`reatomSet. reset`, () => {
  const ctx = createCtx()
  const a = reatomSet(new Set([1, 2, 3]))

  expect(a.add(ctx, 4)).toEqual(new Set([1, 2, 3, 4]))
  expect(a.reset(ctx)).toEqual(new Set([1, 2, 3]))
})

test(`reatomSet. intersection`, () => {
  const ctx = createCtx()

  expect(
    reatomSet(new Set([1, 2, 3])).intersection(ctx, new Set([2, 3, 4])),
  ).toEqual(new Set([2, 3]))
})

test(`reatomSet. union`, () => {
  const ctx = createCtx()

  expect(reatomSet(new Set([1, 2, 3])).union(ctx, new Set([2, 3, 4]))).toEqual(
    new Set([1, 2, 3, 4]),
  )
})

test(`reatomSet. difference`, () => {
  const ctx = createCtx()

  expect(
    reatomSet(new Set([1, 2, 3])).difference(ctx, new Set([2, 3, 4])),
  ).toEqual(new Set([1]))
})

test(`reatomSet. symmetricDifference`, () => {
  const ctx = createCtx()

  expect(
    reatomSet(new Set([1, 2, 3])).symmetricDifference(ctx, new Set([2, 3, 4])),
  ).toEqual(new Set([1, 4]))
})

test(`reatomSet. isSubsetOf`, () => {
  const ctx = createCtx()

  expect(
    reatomSet(new Set([1, 2, 3])).isSubsetOf(ctx, new Set([2, 3, 4])),
  ).toBe(false)
  expect(
    reatomSet(new Set([1, 2, 3])).isSubsetOf(ctx, new Set([1, 2, 3])),
  ).toBe(true)
})

test(`reatomSet. isSupersetOf`, () => {
  const ctx = createCtx()

  expect(
    reatomSet(new Set([1, 2, 3])).isSupersetOf(ctx, new Set([2, 3, 4])),
  ).toBe(false)
  expect(
    reatomSet(new Set([1, 2, 3])).isSupersetOf(ctx, new Set([1, 2, 3])),
  ).toBe(true)
})

test(`reatomSet. isDisjointFrom`, () => {
  const ctx = createCtx()

  expect(
    reatomSet(new Set([1, 2, 3])).isDisjointFrom(ctx, new Set([4, 5, 6])),
  ).toBe(true)
  expect(
    reatomSet(new Set([1, 2, 3])).isDisjointFrom(ctx, new Set([3, 4, 5])),
  ).toBe(false)
})

test(`reatomSet. size`, () => {
  const ctx = createCtx()

  expect(reatomSet(new Set()).size(ctx)).toEqual(0)
  expect(reatomSet(new Set([1, 2, 3])).size(ctx)).toEqual(3)
})

test(`reatomSet.sizeAtom`, () => {
  const ctx = createCtx()
  const a = reatomSet(new Set([1, 2, 3]))

  expect(ctx.get(a.sizeAtom)).toEqual(3)
  a.add(ctx, 4)
  expect(ctx.get(a.sizeAtom)).toEqual(4)
  a.delete(ctx, 1)
  expect(ctx.get(a.sizeAtom)).toEqual(3)
  a.clear(ctx)
  expect(ctx.get(a.sizeAtom)).toEqual(0)
})
