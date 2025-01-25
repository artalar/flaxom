import { createEnumAtom } from './createEnumAtom'
import { test, expect } from 'vitest'

test(`enum object`, async () => {
  const enumAtom = createEnumAtom(['a', 'b'])

  expect(enumAtom.enum).toEqual({ a: 'a', b: 'b' })
})

test(`camelCase`, async () => {
  const sortFilterAtom = createEnumAtom(['fullName', 'created', 'updated', 'pushed'])

  sortFilterAtom.setUpdated.dispatch()

  expect(sortFilterAtom.getState()).toEqual('updated')
})

test(`snake_case`, async () => {
  const sortFilterAtom = createEnumAtom(['full_name', 'created', 'updated', 'pushed'], { format: 'snake_case' })

  sortFilterAtom.enum

  expect(sortFilterAtom.getState()).toEqual('full_name')

  sortFilterAtom.set_updated.dispatch()

  expect(sortFilterAtom.getState()).toEqual('updated')
})
