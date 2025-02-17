import { test, expect } from 'vitest'
import { atom, createCtx } from '@reatom/framework'

test('test ESM import', () => {
  const ctx = createCtx()
  const me = atom('check ✅', 'me')

  expect(ctx.get(me)).toBe('check ✅')
})
