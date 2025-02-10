import { createCtx } from '@reatom/core'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import { reatomMap } from './reatomMap'

const test = suite('reatomMap')

const defaultMapEntries: readonly [string, number][] = [['a', 1], ['b', 2], ['c', 3]] ;

test(`reatomMap. init`, () => {
  const ctx = createCtx()

  const mapAtom = reatomMap(new Map(defaultMapEntries))

  assert.equal([...ctx.get(mapAtom).entries()], defaultMapEntries)
})

test(`reatomMap. get`, () => {
  const ctx = createCtx()

  const mapAtom = reatomMap(new Map(defaultMapEntries))

  assert.equal(mapAtom.get(ctx, 'b'), 2)
})

test(`reatomMap. set`, () => {
  const ctx = createCtx()

  const mapAtom = reatomMap(new Map(defaultMapEntries))

  mapAtom.set(ctx, 'd', 4)

  assert.equal(mapAtom.get(ctx, 'd'), 4)
})

test(`reatomMap. has`, () => {
  const ctx = createCtx()

  const mapAtom = reatomMap(new Map(defaultMapEntries))


  assert.equal(mapAtom.has(ctx, 'a'), true)
})

test(`reatomMap. delete`, () => {
  const ctx = createCtx()

  const mapAtom = reatomMap(new Map(defaultMapEntries))

  mapAtom.delete(ctx, 'a')

  assert.equal(mapAtom.has(ctx, 'a'), false)
})

test(`reatomMap. clear`, () => {
  const ctx = createCtx()

  const mapAtom = reatomMap(new Map(defaultMapEntries))

  mapAtom.clear(ctx)

  assert.equal(ctx.get(mapAtom.sizeAtom), 0)
})

test(`reatomMap should accept map constructor as initState`, () => {
  const ctx = createCtx()

  let mapAtom = reatomMap(defaultMapEntries)
  assert.equal(ctx.get(mapAtom.sizeAtom), 3)

  mapAtom = reatomMap();
  assert.equal(ctx.get(mapAtom.sizeAtom), 0)
})


test.run()
