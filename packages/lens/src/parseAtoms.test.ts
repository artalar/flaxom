import { createTestCtx } from '@reatom/testing'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { atom } from '@reatom/core'
import { parseAtoms } from './parseAtoms'
import { reatomZod } from '@reatom/npm-zod'
import { z } from 'zod'

const test = suite('parseAtoms')

test('should return value', () => {
  const ctx = createTestCtx()

  assert.is(parseAtoms(ctx, 'some bare value'), 'some bare value')
  assert.is(parseAtoms(ctx, 10), 10)
  assert.is(
    parseAtoms(ctx, Symbol.for('specialSymbol')),
    Symbol.for('specialSymbol'),
  )
})

test('should parse deep atoms', () => {
  const ctx = createTestCtx()

  assert.is(
    parseAtoms(
      ctx,
      atom(() => atom('deep')),
    ),
    'deep',
  )
  assert.equal(
    parseAtoms(
      ctx,
      atom(() => [atom(['deep'])]),
    ),
    [['deep']],
  )
})

test('should parse records', () => {
  const ctx = createTestCtx()

  assert.equal(
    parseAtoms(ctx, {
      someValue: atom(1),
      someDeep: {
        deep: {
          deep: atom('value'),
        },
      },
    }),
    {
      someValue: 1,
      someDeep: {
        deep: {
          deep: 'value',
        },
      },
    },
  )
})

test('should parse maps', () => {
  const ctx = createTestCtx()

  const atomized = new Map()
  const keyObj = {}
  const keyAtom = atom('')
  atomized.set(1, atom(1))
  atomized.set(keyObj, atom({ someKey: atom('someValue') }))
  atomized.set(keyAtom, 'someRawValue')

  const parsed = parseAtoms(ctx, atomized)
  assert.is(parsed.get(1), 1)
  assert.equal(parsed.get(keyObj), { someKey: 'someValue' })
  assert.equal(parsed.get(keyAtom), 'someRawValue')
  assert.is(parsed.size, 3)
})
test('should spy if inside atom', () => {
  const ctx = createTestCtx()

  const valueAtom = atom('default')
  const parsedAtom = atom((ctx) => parseAtoms(ctx, { key: valueAtom }))

  assert.equal(ctx.get(parsedAtom), { key: 'default' })

  valueAtom(ctx, 'new')
  assert.equal(ctx.get(parsedAtom), { key: 'new' })
})

test('should parse sets', () => {
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
  assert.ok(parsed.has(1), '')
  assert.ok(parsed.has('someRawValue'))

  assert.not.ok(parsed.has(keyObj))
  assert.ok(values.some((a: any) => a?.__id__ === symbol))

  // assert.is(parsed.size, 3)
})

test('should parse mixed values', () => {
  const ctx = createTestCtx()

  assert.equal(
    parseAtoms(ctx, {
      someValue: atom(1),
      someDeep: {
        deep: {
          deep: atom('value'),
        },
      },
    }),
    {
      someValue: 1,
      someDeep: {
        deep: {
          deep: 'value',
        },
      },
    },
  )
})

test('should parse deep structures', () => {
  const ctx = createTestCtx()

  assert.equal(parseAtoms(ctx, [[[[[atom('deepStruct')]]]]]), [
    [[[['deepStruct']]]],
  ])
})

test('should parse linked list as array', () => {
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
  assert.equal(snapshot.arr, [
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

test('should ignore constructor', () => {
  const ctx = createTestCtx()

  const constructObject = new AbortController()

  assert.is(
    parseAtoms(ctx, { constructObject }).constructObject,
    constructObject,
  )
})

test.run()
