import { it, expect } from 'vitest'
import { take, takeNested } from '@reatom/effects'
import { createTestCtx } from '@reatom/testing'
import { atom } from '@reatom/core'
import { mapToAsync, withDataAtom } from './index'

it(`mapToAsync interface`, () => {
  const argumentAtom = atom(0, 'argumentAtom')
  const asyncAction = argumentAtom.pipe(mapToAsync(async (ctx, arg) => arg))

  expect(asyncAction).toBeTypeOf('function')
  expect(asyncAction.__reatom.name).toBe('argumentAtom.mapToAsync')
  expect(asyncAction.unstable_unhook).toBeTypeOf('function')
})

it(`is called whenever argument is changed`, async () => {
  const argumentAtom = atom('initial', 'argumentAtom')
  const asyncAction = argumentAtom.pipe(
    mapToAsync(async (ctx, arg) => arg),
    withDataAtom('default'),
  )
  const ctx = createTestCtx()

  expect(ctx.get(asyncAction.dataAtom)).toBe('default')

  const hijackedCall = take(ctx, asyncAction)

  argumentAtom(ctx, 'updated')

  expect(await hijackedCall).toBe('updated')
  expect(ctx.get(asyncAction.dataAtom)).toBe('updated')
})

it(`can be unhooked`, async () => {
  const argumentAtom = atom('initial', 'argumentAtom')
  const asyncAction = argumentAtom.pipe(
    mapToAsync(async (ctx, n) => n),
    withDataAtom('default'),
  )

  asyncAction.unstable_unhook()

  const ctx = createTestCtx()

  await takeNested(ctx, argumentAtom, 'updated')
  expect(ctx.get(asyncAction.dataAtom)).toBe('default')
})
