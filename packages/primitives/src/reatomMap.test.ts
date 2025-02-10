import { createCtx } from '@reatom/core'
import { it, expect, describe } from 'vitest'

import { reatomMap } from './reatomMap'

const defaultMapEntries: readonly [string, number][] = [
  ['a', 1],
  ['b', 2],
  ['c', 3],
]

describe(`reatomMap`, () => {
  it(`init`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    expect([...ctx.get(mapAtom).entries()]).toStrictEqual(defaultMapEntries)
  })

  it(`get`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    expect(mapAtom.get(ctx, 'b')).toEqual(2)
  })

  it(`set`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    mapAtom.set(ctx, 'd', 4)

    expect(mapAtom.get(ctx, 'd')).toEqual(4)
  })

  it(`has`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    expect(mapAtom.has(ctx, 'a')).toEqual(true)
  })

  it(`delete`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    mapAtom.delete(ctx, 'a')

    expect(mapAtom.has(ctx, 'a')).toEqual(false)
  })

  it(`clear`, () => {
    const ctx = createCtx()

    const mapAtom = reatomMap(new Map(defaultMapEntries))

    mapAtom.clear(ctx)

    expect(ctx.get(mapAtom.sizeAtom)).toEqual(0)
  })
})
