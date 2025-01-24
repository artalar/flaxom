import { createCtx } from '@reatom/core'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import { reatomEnum } from './reatomEnum'

const test = suite('reatomEnum')

test(`reatomEnum. static enum property`, async () => {
  const enumAtom = reatomEnum(['a', 'b'])

  assert.equal(enumAtom.enum, { a: 'a', b: 'b' })
  ;`👍` //?
})

test(`reatomEnum. camelCase`, async () => {
  const sortFilterAtom = reatomEnum(['fullName', 'created', 'updated', 'pushed'])
  const ctx = createCtx()

  sortFilterAtom.setUpdated(ctx)

  assert.is(ctx.get(sortFilterAtom), 'updated')
  ;`👍` //?
})

test(`reatomEnum. snake_case`, async () => {
  const cases = ['full_name', 'created', 'updated', 'pushed'] as const
  const sortFilterAtom = reatomEnum(cases, { format: 'snake_case' })
  const ctx = createCtx()

  sortFilterAtom.enum

  assert.equal(cases, Object.keys(sortFilterAtom.enum))
  assert.equal(cases, Object.values(sortFilterAtom.enum))

  assert.is(ctx.get(sortFilterAtom), 'full_name')

  sortFilterAtom.set_updated(ctx)

  assert.is(ctx.get(sortFilterAtom), 'updated')
  ;`👍` //?
})

test(`reatomEnum. reset`, () => {
  const enumAtom = reatomEnum(['a', 'b'], { initState: 'b' })
  const ctx = createCtx()

  assert.is(ctx.get(enumAtom), 'b')

  enumAtom(ctx, () => 'a')
  assert.is(ctx.get(enumAtom), 'a')

  enumAtom.reset(ctx)
  assert.is(ctx.get(enumAtom), 'b')
  ;`👍` //?
})

test.run()
