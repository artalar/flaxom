import { createTestCtx } from '@reatom/testing'
import { describe, it, expectTypeOf } from 'vitest'
import { parseAtoms } from './parseAtoms'
import { atom } from '@reatom/core'
import {
  LL_NEXT,
  LL_PREV,
  reatomEnum,
  reatomLinkedList,
} from '@reatom/primitives'

describe('parseAtoms', () => {
  it('should return value', () => {
    const ctx = createTestCtx()

    expectTypeOf(parseAtoms(ctx, 'some bare value')).toEqualTypeOf<string>()
    expectTypeOf(parseAtoms(ctx, 10)).toEqualTypeOf<number>()
    expectTypeOf(
      parseAtoms(ctx, Symbol.for('specialSymbol')),
    ).toEqualTypeOf<symbol>()
  })

  it('should parse deep atoms', () => {
    const ctx = createTestCtx()
    expectTypeOf(
      parseAtoms(
        ctx,
        atom(() => atom('deep')),
      ),
    ).toEqualTypeOf<string>()
    expectTypeOf(
      parseAtoms(
        ctx,
        atom(() => [atom(['deep'])]),
      ),
    ).toEqualTypeOf<string[][]>()
  })

  it('should parse records', () => {
    const ctx = createTestCtx()
    expectTypeOf(
      parseAtoms(ctx, {
        someValue: atom(1),
        someDeep: {
          deep: {
            deep: atom('value'),
          },
        },
      }),
    ).toEqualTypeOf<{
      someValue: number
      someDeep: {
        deep: {
          deep: string
        }
      }
    }>()
  })

  it('should parse maps', () => {
    const ctx = createTestCtx()
    const atomized = new Map<any, any>()
    const keyObj = {}
    const keyAtom = atom('')
    atomized.set(1, atom(1))
    atomized.set(keyObj, atom({ someKey: atom('someValue') }))
    atomized.set(keyAtom, 'someRawValue')

    expectTypeOf(parseAtoms(ctx, atomized)).toEqualTypeOf<Map<any, any>>()
  })

  it('should parse sets', () => {
    const ctx = createTestCtx()
    const atomized = new Set<any>()
    atomized.add(atom(1))
    atomized.add('someRawValue')

    expectTypeOf(parseAtoms(ctx, atomized)).toEqualTypeOf<Set<any>>()
  })

  it('should parse mixed values', () => {
    const ctx = createTestCtx()
    expectTypeOf(
      parseAtoms(ctx, {
        someValue: atom(1),
        someDeep: {
          deep: {
            deep: atom('value'),
          },
        },
      }),
    ).toEqualTypeOf<{
      someValue: number
      someDeep: {
        deep: {
          deep: string
        }
      }
    }>()
  })

  it('should parse deep structures', () => {
    const ctx = createTestCtx()
    expectTypeOf(parseAtoms(ctx, [[[[[atom('deepStruct')]]]]])).toEqualTypeOf<
      string[][][][][]
    >()
  })

  it('should parse linked list as array', () => {
    const ctx = createTestCtx()

    const model = reatomLinkedList((ctx, value: number) => ({
      kind: 'TEST' as const,
      bool1: atom(true),
      array: atom([
        atom({
          type: reatomEnum(['A', 'B', 'C']),
          str1: atom(''),
          bool: atom(false),
        }),
      ]),
    }))

    const test = parseAtoms(ctx, model)

    type ToMatchTypeOf = {
      kind: 'TEST'
      bool1: boolean
      array: {
        type: 'A' | 'B' | 'C'
        str1: string
        bool: boolean
      }[]
      [LL_PREV]: ToMatchTypeOf | null
      [LL_NEXT]: ToMatchTypeOf | null
    }

    expectTypeOf(test).toMatchTypeOf<ToMatchTypeOf[]>()
  })

  it('should parse File and other classes properly', () => {
    const ctx = createTestCtx()

    expectTypeOf(
      parseAtoms(ctx, {
        file: new File([''], 'test.txt'),
        someDeep: {
          abortController: new AbortController(),
        },
      }),
    ).toEqualTypeOf<{
      file: File
      someDeep: {
        abortController: AbortController
      }
    }>()
  })
})
