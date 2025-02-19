import { createTestCtx } from '@reatom/testing'
import { describe, test, expect } from 'vitest'
import { match } from './match'
import { Ctx, CtxSpy, atom } from '@reatom/core'

describe('match', () => {
  test('is method', () => {
    const ctx = createTestCtx()

    const expressions = [
      'a',
      () => 'a',
      atom('a'),
      (ctx: CtxSpy) => ctx.spy(atom('a')),
    ]
    const statements = [
      true,
      (ctx: Ctx, value: any) => value === 'a',
      (ctx: Ctx) => ctx.get(atom(true)),
    ]

    for (const expression of expressions) {
      for (const statement of statements) {
        expect(ctx.get(match(expression))).toBeUndefined()
        expect(ctx.get(match(expression).is('b', statement))).toBeUndefined()
        expect(ctx.get(match(expression).is('a', statement))).toBe(true)
        expect(
          ctx.get(match(expression).is('a', statement).is('b', true)),
        ).toBe(true)
        expect(
          ctx.get(match(expression).is('b', statement).is('a', true)),
        ).toBe(true)
        expect(ctx.get(match(expression).default(statement))).toBe(true)
      }
    }

    const a = atom('a')
    const isA = match(a).is('a', true).default(false)

    const track = ctx.subscribeTrack(isA)
    expect(track.lastInput()).toBe(true)

    a(ctx, 'abc')
    expect(track.lastInput()).toBe(false)
  })

  test('with', () => {
    const ctx = createTestCtx()

    type Data = { type: 'text' } | { type: 'img' }
    type Result =
      | { type: 'ok'; data: Data }
      | { type: 'error' }
      | { type: 'unknown' }

    const result = atom(null! as Result)

    const matched = match(result)
      .with({ type: 'error' }, 'error')
      .with({ type: 'ok', data: { type: 'text' } }, 'ok/text')
      .with({ type: 'ok', data: { type: 'img' } }, 'ok/img')
      .default('default')

    result(ctx, { type: 'unknown' })
    expect(ctx.get(matched)).toBe('default')

    result(ctx, { type: 'error' })
    expect(ctx.get(matched)).toBe('error')

    result(ctx, { type: 'ok', data: { type: 'img' } })
    expect(ctx.get(matched)).toBe('ok/img')

    result(ctx, { type: 'ok', data: { type: 'text' } })
    expect(ctx.get(matched)).toBe('ok/text')
  })

  test('default should check in the end', () => {
    const ctx = createTestCtx()

    expect(ctx.get(match(true).default(false).truthy(true))).toBe(true)
  })
})

test('reactive change', () => {
  const ctx = createTestCtx()

  const boolAtom = atom(true)
  const compAtom = match(true)
    .is(boolAtom, () => 'a')
    .default(() => 'b')

  const track = ctx.subscribeTrack(compAtom)

  expect(track.inputs()).toEqual(['a'])

  boolAtom(ctx, false)
  boolAtom(ctx, true)
  expect(track.inputs()).toEqual(['a', 'b', 'a'])
})
