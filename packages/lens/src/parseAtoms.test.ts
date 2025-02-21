import { createTestCtx } from '@reatom/testing'
import { describe, it } from 'vitest'
import { expect } from 'vitest'
import { atom } from '@reatom/core'
import { parseAtoms } from './parseAtoms'
import { reatomZod } from '@reatom/npm-zod'
import { z } from 'zod'

describe('parseAtoms', () => {
  it('should return value', () => {
    const ctx = createTestCtx()

    expect(parseAtoms(ctx, 'some bare value')).toBe('some bare value')
    expect(parseAtoms(ctx, 10)).toBe(10)
    expect(parseAtoms(ctx, Symbol.for('specialSymbol'))).toBe(Symbol.for('specialSymbol'))
  })

  it('should parse deep atoms', () => {
    const ctx = createTestCtx()

    expect(
      parseAtoms(
        ctx,
        atom(() => atom('deep')),
      ),
    ).toBe('deep')
    expect(
      parseAtoms(
        ctx,
        atom(() => [atom(['deep'])]),
      ),
    ).toEqual([['deep']])
  })

  it('should parse records', () => {
    const ctx = createTestCtx()

    expect(
      parseAtoms(ctx, {
        someValue: atom(1),
        someDeep: {
          deep: {
            deep: atom('value'),
          },
        },
      }),
    ).toEqual({
      someValue: 1,
      someDeep: {
        deep: {
          deep: 'value',
        },
      },
    })
  })

  it('should parse maps', () => {
    const ctx = createTestCtx()

    const atomized = new Map()
    const keyObj = {}
    const keyAtom = atom('')
    atomized.set(1, atom(1))
    atomized.set(keyObj, atom({ someKey: atom('someValue') }))
    atomized.set(keyAtom, 'someRawValue')

    const parsed = parseAtoms(ctx, atomized)
    expect(parsed.get(1)).toBe(1)
    expect(parsed.get(keyObj)).toEqual({ someKey: 'someValue' })
    expect(parsed.get(keyAtom)).toEqual('someRawValue')
    expect(parsed.size).toBe(3)
  })

  it('should spy if inside atom', () => {
    const ctx = createTestCtx()

    const valueAtom = atom('default')
    const parsedAtom = atom((ctx) => parseAtoms(ctx, { key: valueAtom }))

    expect(ctx.get(parsedAtom)).toEqual({ key: 'default' })

    valueAtom(ctx, 'new')
    expect(ctx.get(parsedAtom)).toEqual({ key: 'new' })
  })

  it('should parse sets', () => {
    const ctx = createTestCtx()

    const atomized = new Set()
    const symbol = Symbol()
    const keyObj = { __id__: symbol }
    atomized.add(atom(1))
    atomized.add(atom(1))
    atomized.add(atom(1))
    atomized.add(atom(1))

    atomized.add(keyObj)
    atomized.add('someRawValue')

    const parsed = parseAtoms(ctx, atomized)
    const values = Array.from(parsed.values())
    expect(parsed.has(1)).toBeTruthy()
    expect(parsed.has('someRawValue')).toBeTruthy()

    expect(parsed.has(keyObj)).toBeFalsy()
    expect(values.some((a: any) => a?.__id__ === symbol)).toBeTruthy()

    // expect(parsed.size).toBe(3)
  })

  it('should parse mixed values', () => {
    const ctx = createTestCtx()

    expect(
      parseAtoms(ctx, {
        someValue: atom(1),
        someDeep: {
          deep: {
            deep: atom('value'),
          },
        },
      }),
    ).toEqual({
      someValue: 1,
      someDeep: {
        deep: {
          deep: 'value',
        },
      },
    })
  })

  it('should parse deep structures', () => {
    const ctx = createTestCtx()

    expect(parseAtoms(ctx, [[[[[atom('deepStruct')]]]]]))
      .toEqual([[[[['deepStruct']]]]])
  })

  it('should parse linked list as array', () => {
    const ctx = createTestCtx()
    const model = reatomZod(
      z.object({
        kind: z.literal('TEST'),
        bool1: z.boolean().optional().nullable(),
        arr: z.array(
          z.object({
            type: z.enum(['A', 'B', 'C']).readonly(),
            str1: z.string().optional(),
            bool: z.boolean().optional(),
          }),
        ),
        bool2: z.boolean().nullish(),
      }),
    )

    model.arr.create(ctx, {
      type: 'A',
      str1: 'a',
      bool: true,
    })
    model.arr.create(ctx, {
      type: 'B',
      str1: 'b',
      bool: true,
    })
    model.arr.create(ctx, {
      type: 'C',
      str1: 'c',
      bool: false,
    })
    const snapshot = parseAtoms(ctx, model)
    expect(snapshot.arr).toEqual([
      {
        type: 'A',
        str1: 'a',
        bool: true,
      },
      {
        type: 'B',
        str1: 'b',
        bool: true,
      },
      {
        type: 'C',
        str1: 'c',
        bool: false,
      },
    ])
  })

  it('should ignore constructor', () => {
    const ctx = createTestCtx()

    const constructObject = new AbortController()

    expect(parseAtoms(ctx, { constructObject }).constructObject).toBe(constructObject)
  })
})

// const ctx = createTestCtx();

// const result = parseAtoms(ctx, {
//   numberValue: 123,
//   atom: atom(123),
//   fileValue: new File([], 'file.txt'),
//   nested: {
//     numberValue: 123,
//     fileValue: new File([], 'file.txt'),
//   },
//   atomic: {
//     atom: atom(123),
//     linkedList: reatomLinkedList((ctx, n: number) => ({ n }))
//   }
// })
