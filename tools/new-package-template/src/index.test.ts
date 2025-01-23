import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { createTestCtx } from '@reatom/testing'

// TODO (agarkov): change to vitest
test('stub', () => {
  const ctx = createTestCtx()

  assert.ok(false, 'No tests!')
})

test.run()
