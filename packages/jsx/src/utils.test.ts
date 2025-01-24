import { atom } from '@reatom/core'
import { createTestCtx } from '@reatom/testing'
import * as assert from 'uvu/assert'
import { cn } from './utils'

describe('parseClasses', () => {
  const ctx = createTestCtx()

  it('handles falsy correctly', () => {
    assert.is(ctx.get(cn(false)), '')
    assert.is(ctx.get(cn(true)), '')
    assert.is(ctx.get(cn(null)), '')
    assert.is(ctx.get(cn(undefined)), '')
    assert.is(ctx.get(cn({})), '')
    assert.is(ctx.get(cn([])), '')
    assert.is(ctx.get(cn(atom(undefined))), '')
    assert.is(ctx.get(cn(() => undefined)), '')
  })

  it('handles falsy object correctly', () => {
    assert.is(
      ctx.get(
        cn({
          a: '',
          b: 0,
          c: NaN,
          d: false,
          e: null,
          f: undefined,
          g: atom(undefined),
        }),
      ),
      '',
    )
  })

  it('handles falsy array correctly', () => {
    assert.is(ctx.get(cn(['', null, undefined, {}, [], atom(undefined), () => undefined])), '')
  })

  it('handles object correctly', () => {
    assert.is(
      ctx.get(
        cn({
          a: 'a',
          b: 1,
          c: true,
          d: {},
          e: [],
          f: atom(true),
          g: () => undefined,
        }),
      ),
      'a b c d e f g',
    )
  })

  it('handles deep array correctly', () => {
    assert.is(ctx.get(cn(['a', ['b', ['c']]])), 'a b c')
  })

  it('handles deep atom correctly', () => {
    assert.is(ctx.get(cn(atom(() => atom(() => atom('a'))))), 'a')
  })

  it('handles deep getter correctly', () => {
    assert.is(ctx.get(cn(() => () => () => 'a')), 'a')
  })

  it('handles complex correctly', () => {
    const isBAtom = atom(true)
    const stringAtom = atom('d')
    const classNameAtom = cn(() => atom(() => ['a', { b: isBAtom }, ['c'], stringAtom, () => 'e']))

    assert.is(ctx.get(classNameAtom), 'a b c d e')

    isBAtom(ctx, false)
    stringAtom(ctx, 'dd')

    assert.is(ctx.get(classNameAtom), 'a c dd e')
  })
})
