import 'core-js/proposals/set-methods-v2'

import { createCtx } from '@reatom/core'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import { reatomSet } from './reatomSet'

const test = suite('reatomSet')

test(`reatomSet. init`, () => {
  const ctx = createCtx()

  assert.equal(ctx.get(reatomSet(new Set([1, 2, 3]))), new Set([1, 2, 3]))
})

test(`reatomSet. add`, () => {
  const ctx = createCtx()

  assert.equal(reatomSet(new Set([1, 2, 3])).add(ctx, 4), new Set([1, 2, 3, 4]))
})

test(`reatomSet. delete`, () => {
  const ctx = createCtx()

  assert.equal(reatomSet(new Set([1, 2, 3])).delete(ctx, 3), new Set([1, 2]))
})

test(`reatomSet. toggle`, () => {
  const ctx = createCtx()
  const a = reatomSet(new Set([1, 2, 3]))

  assert.equal(a.toggle(ctx, 3), new Set([1, 2]))
  assert.equal(a.toggle(ctx, 3), new Set([1, 2, 3]))
})

test(`reatomSet. clear`, () => {
  const ctx = createCtx()

  assert.equal(reatomSet(new Set([1, 2, 3])).clear(ctx), new Set())
})

test(`reatomSet. reset`, () => {
  const ctx = createCtx()
  const a = reatomSet(new Set([1, 2, 3]))

  assert.equal(a.add(ctx, 4), new Set([1, 2, 3, 4]))
  assert.equal(a.reset(ctx), new Set([1, 2, 3]))
})

test(`reatomSet. intersection`, () => {
  const ctx = createCtx()

  assert.equal(
    reatomSet(new Set([1, 2, 3])).intersection(ctx, new Set([2, 3, 4])),
    new Set([2, 3]),
  )
})

test(`reatomSet. union`, () => {
  const ctx = createCtx()

  assert.equal(
    reatomSet(new Set([1, 2, 3])).union(ctx, new Set([2, 3, 4])),
    new Set([1, 2, 3, 4]),
  )
})

test(`reatomSet. difference`, () => {
  const ctx = createCtx()

  assert.equal(
    reatomSet(new Set([1, 2, 3])).difference(ctx, new Set([2, 3, 4])),
    new Set([1]),
  )
})

test(`reatomSet. symmetricDifference`, () => {
  const ctx = createCtx()

  assert.equal(
    reatomSet(new Set([1, 2, 3])).symmetricDifference(ctx, new Set([2, 3, 4])),
    new Set([1, 4]),
  )
})

test(`reatomSet. isSubsetOf`, () => {
  const ctx = createCtx()

  assert.equal(
    reatomSet(new Set([1, 2, 3])).isSubsetOf(ctx, new Set([2, 3, 4])),
    false,
  )
  assert.equal(
    reatomSet(new Set([1, 2, 3])).isSubsetOf(ctx, new Set([1, 2, 3])),
    true,
  )
})

test(`reatomSet. isSupersetOf`, () => {
  const ctx = createCtx()

  assert.equal(
    reatomSet(new Set([1, 2, 3])).isSupersetOf(ctx, new Set([2, 3, 4])),
    false,
  )
  assert.equal(
    reatomSet(new Set([1, 2, 3])).isSupersetOf(ctx, new Set([1, 2, 3])),
    true,
  )
})

test(`reatomSet. isDisjointFrom`, () => {
  const ctx = createCtx()

  assert.equal(
    reatomSet(new Set([1, 2, 3])).isDisjointFrom(ctx, new Set([4, 5, 6])),
    true,
  )
  assert.equal(
    reatomSet(new Set([1, 2, 3])).isDisjointFrom(ctx, new Set([3, 4, 5])),
    false,
  )
})

test(`reatomSet. size`, () => {
  const ctx = createCtx()

  assert.equal(reatomSet(new Set()).size(ctx), 0)
  assert.equal(reatomSet(new Set([1, 2, 3])).size(ctx), 3)
})

test(`reatomSet.sizeAtom`, () => {
  const ctx = createCtx()
  const a = reatomSet(new Set([1, 2, 3]))

  assert.equal(ctx.get(a.sizeAtom), 3)
  a.add(ctx, 4)
  assert.equal(ctx.get(a.sizeAtom), 4)
  a.delete(ctx, 1)
  assert.equal(ctx.get(a.sizeAtom), 3)
  a.clear(ctx)
  assert.equal(ctx.get(a.sizeAtom), 0)
})

test(`reatomSet should accept set constructor as initState`, () => {
  const ctx = createCtx()
  const a = reatomSet(new Set([1, 2, 3]))
  assert.equal(ctx.get(a.sizeAtom), 3)

  const b = reatomSet()
  assert.equal(ctx.get(b.sizeAtom), 0)
})


test.run()
