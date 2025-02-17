import { createCtx } from '@reatom/core'
import { test, expect, describe } from 'vitest'

import { reatomMap } from './reatomMap'

const defaultMapEntries: readonly [string, number][] = [
  ['a', 1],
  ['b', 2],
  ['c', 3],
]

describe(`reatomMap`, () => {
  test(`init`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    expect([...ctx.get(mapAtom).entries()]).toStrictEqual(defaultMapEntries)
  })

  test(`get`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    expect(mapAtom.get(ctx, 'b')).toEqual(2)
  })

  test(`set`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    mapAtom.set(ctx, 'd', 4)

    expect(mapAtom.get(ctx, 'd')).toEqual(4)
  })

  test(`has`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    expect(mapAtom.has(ctx, 'a')).toEqual(true)
  })

  test(`delete`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    mapAtom.delete(ctx, 'a')

    expect(mapAtom.has(ctx, 'a')).toEqual(false)
  })

  test(`clear`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    mapAtom.clear(ctx)

    expect(ctx.get(mapAtom.sizeAtom)).toEqual(0)
  })
})
