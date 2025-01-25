import { it, expect } from 'vitest'
import { atom, createCtx } from '@reatom/framework'

it('test ESM import', () => {
  const ctx = createCtx()
  const me = atom('check ✅', 'me')

  expect(ctx.get(me)).toBe('check ✅')
})
