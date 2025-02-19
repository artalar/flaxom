import { test, expect } from 'vitest'
import { createTestCtx } from '@reatom/testing'

test('stub', () => {
  const ctx = createTestCtx()

  expect(false).toEqual('No tests!')
})
