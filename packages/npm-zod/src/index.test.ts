import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import { createTestCtx, mockFn } from '@reatom/testing'
import { ParseAtoms, parseAtoms } from '@reatom/lens'

import { z } from 'zod'

import { reatomZod } from './'

const test = suite('reatomZod')

test('base API', async () => {
  const model = reatomZod(
    z.object({ n: z.number(), s: z.string(), readonly: z.string().readonly() }),
    {
      sync: () => {
        track(parseAtoms(ctx, model))
      },
      initState: { n: 42, readonly: 'foo' },
    },
  )
  const track = mockFn<[ParseAtoms<typeof model>], any>()
  const ctx = createTestCtx()

  assert.is(model.readonly, 'foo')
  assert.is(ctx.get(model.n), 42)

  model.s(ctx, 'bar')
  assert.equal(track.lastInput(), { n: 42, s: 'bar', readonly: 'foo' })
})

test.run()
