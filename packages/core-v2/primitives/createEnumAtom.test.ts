import { createEnumAtom } from './createEnumAtom'
import { it, expect } from 'vitest'

it(`enum object`, async () => {
  const enumAtom = createEnumAtom(['a', 'b'])

  expect(enumAtom.enum).toEqual({ a: 'a', b: 'b' })
})

it(`camelCase`, async () => {
  const sortFilterAtom = createEnumAtom(['fullName', 'created', 'updated', 'pushed'])

  sortFilterAtom.setUpdated.dispatch()

  expect(sortFilterAtom.getState()).toEqual('updated')
})

it(`snake_case`, async () => {
  const sortFilterAtom = createEnumAtom(['full_name', 'created', 'updated', 'pushed'], { format: 'snake_case' })

  sortFilterAtom.enum

  expect(sortFilterAtom.getState()).toEqual('full_name')

  sortFilterAtom.set_updated.dispatch()

  expect(sortFilterAtom.getState()).toEqual('updated')
})
