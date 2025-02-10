import { createCtx } from '@reatom/core'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import { reatomArray } from './reatomArray'

const test = suite('reatomArray')

test(`reatomArray. init`, () => {
  const ctx = createCtx()

  assert.equal(ctx.get(reatomArray([1, 2, 3])), [1, 2, 3])
})

test(`reatomArray. toReversed`, () => {
  const ctx = createCtx()

  assert.equal(reatomArray([1, 2, 3]).toReversed(ctx), [3, 2, 1])
})

test(`reatomArray. toSorted`, () => {
  const ctx = createCtx()

  assert.equal(reatomArray([3, 1, 2]).toSorted(ctx), [1, 2, 3])
})

test(`reatomArray. toSorted with compareFn`, () => {
  const ctx = createCtx()

  assert.equal(
    reatomArray([3, 1, 2]).toSorted(ctx, (a, b) => b - a),
    [3, 2, 1],
  )
})

test(`reatomArray. toSpliced`, () => {
  const ctx = createCtx()

  assert.equal(reatomArray([3, 1, 2]).toSpliced(ctx, 1, 2, 44), [3, 44])
})

test(`reatomArray. with`, () => {
  const ctx = createCtx()

  assert.equal(reatomArray([3, 1, 2]).with(ctx, 1, 15), [3, 15, 2])
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

test.run()
