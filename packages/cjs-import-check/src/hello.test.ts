import { it, expect } from 'vitest'
const { atom, createCtx } = require('@reatom/framework')

it('test CommonJS import', () => {
  const ctx = createCtx()
  const me = atom('check ✅', 'me')

  expect(ctx.get(me)).toBe('check ✅')
})
