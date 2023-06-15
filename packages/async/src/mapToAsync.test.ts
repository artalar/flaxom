import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { take, takeNested } from '@reatom/effects'
import { createTestCtx } from '@reatom/testing'
import { atom } from '@reatom/core'
import { mapToAsync, withDataAtom } from './index'
import { sleep } from '@reatom/utils'

export const test = suite('mapToAsync')

test(`mapToAsync interface`, () => {
  const argumentAtom = atom(0, 'argumentAtom')
  const asyncAction = argumentAtom.pipe(mapToAsync(async (ctx, arg) => arg))

  assert.type(asyncAction, 'function')
  assert.is(asyncAction.__reatom.name, 'argumentAtom.mapToAsync')
  assert.type(asyncAction.unstable_unhook, 'function')
})

test(`is called whenever argument is changed`, async () => {
  const argumentAtom = atom(0, 'argumentAtom')
  const asyncAction = argumentAtom.pipe(
    mapToAsync(async (ctx, arg) => arg),
    withDataAtom(0),
  )
  const ctx = createTestCtx()

  assert.is(ctx.get(asyncAction.dataAtom), 0)

  const hijackedCall = take(ctx, asyncAction)

  argumentAtom(ctx, 123)

  assert.is(await hijackedCall, 123)
  assert.is(ctx.get(asyncAction.dataAtom), 123)
  ;`👍` //?
})

test(`can be unhooked`, async () => {
  const argumentAtom = atom(0, 'argumentAtom')
  const asyncAction = argumentAtom.pipe(
    mapToAsync(async (ctx, n) => n),
    withDataAtom(0),
  )

  asyncAction.unstable_unhook()

  const ctx = createTestCtx()

  await takeNested(ctx, argumentAtom, 123)
  assert.is(ctx.get(asyncAction.dataAtom), 0)
  ;`👍` //?
})

test.run()
