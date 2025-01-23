import { it, expect } from 'vitest'
import { createTestCtx } from '@reatom/testing'

it('stub', () => {
  const ctx = createTestCtx()

  expect(false).toEqual('No tests!')
})
