import { createCtx } from '@reatom/core'
import { describe, test, expect } from 'vitest'
import { reatomRecord } from './reatomRecord'

describe('reatomRecord', () => {
  test('should manage record state correctly', () => {
    const ctx = createCtx()
    const person = reatomRecord({
      civis: true,
      paterfamilias: true,
      servus: false,
      vir: true,
      coniugium: false,
      senator: true,
    })

    person.merge(ctx, {
      civis: false,
      servus: true,
      senator: false,
    })

    expect(ctx.get(person)).toEqual({
      civis: false,
      paterfamilias: true,
      servus: true,
      vir: true,
      coniugium: false,
      senator: false,
    })

    person.reset(ctx, 'civis', 'servus')
    person.omit(ctx, 'coniugium')

    expect(ctx.get(person)).toEqual({
      civis: true,
      paterfamilias: true,
      servus: false,
      vir: true,
      // omitted:
      // coniugium: false,
      senator: false,
    })
  })
})
