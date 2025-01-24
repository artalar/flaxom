import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { createEnumAtom } from './createEnumAtom'

test(`enum object`, async () => {
  const enumAtom = createEnumAtom(['a', 'b'])

  assert.equal(enumAtom.enum, { a: 'a', b: 'b' })
  ;`👍` //?
})

test(`camelCase`, async () => {
  const sortFilterAtom = createEnumAtom(['fullName', 'created', 'updated', 'pushed'])

  sortFilterAtom.setUpdated.dispatch()

  assert.is(sortFilterAtom.getState(), 'updated')
  ;`👍` //?
})

test(`snake_case`, async () => {
  const sortFilterAtom = createEnumAtom(['full_name', 'created', 'updated', 'pushed'], { format: 'snake_case' })

  sortFilterAtom.enum

  assert.is(sortFilterAtom.getState(), 'full_name')

  sortFilterAtom.set_updated.dispatch()

  assert.is(sortFilterAtom.getState(), 'updated')
  ;`👍` //?
})

test.run()
