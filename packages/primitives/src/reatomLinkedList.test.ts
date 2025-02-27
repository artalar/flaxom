import { action, atom } from '@reatom/core'
import { createTestCtx, mockFn } from '@reatom/testing'
import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import { reatomLinkedList } from './reatomLinkedList'
import { parseAtoms } from '@reatom/lens'
import { isCausedBy } from '@reatom/effects'

const test = suite('reatomLinkedList')

test(`should respect initState, create and remove elements properly`, () => {
  const ctx = createTestCtx()
  const list = reatomLinkedList({
    create: (ctx, n: number) => atom(n),
    initState: [atom(1), atom(2)],
  })

  const last = list.create(ctx, 3)
  assert.equal(
    ctx.get(list.array).map((v) => ctx.get(v)),
    [1, 2, 3],
  )

  list.remove(ctx, last)
  assert.equal(parseAtoms(ctx, list.array), [1, 2])
  list.remove(ctx, last)
  assert.equal(parseAtoms(ctx, list.array), [1, 2])

  list.remove(ctx, list.find(ctx, (n) => ctx.get(n) === 1)!)
  assert.equal(parseAtoms(ctx, list.array), [2])

  list.remove(ctx, list.find(ctx, (n) => ctx.get(n) === 2)!)
  assert.equal(parseAtoms(ctx, list.array), [])

  try {
    list.remove(ctx, list.find(ctx, (n) => ctx.get(n) === 2)!)
    assert.ok(false, 'Error expected')
  } catch (error: any) {
    assert.is(
      error?.message,
      'Reatom error: The passed data is not a linked list node.',
    )
  }
})

test(`should swap elements`, () => {
  const ctx = createTestCtx()
  const list = reatomLinkedList((ctx, n: number) => ({ n }))
  const { array } = list.reatomMap((ctx, { n }) => ({ n }))
  const track = ctx.subscribeTrack(
    atom((ctx) => ctx.spy(array).map(({ n }) => n)),
  )
  const one = list.create(ctx, 1)
  const two = list.create(ctx, 2)
  const three = list.create(ctx, 3)
  const four = list.create(ctx, 4)

  // const [one, two, three, four] = ctx.get(
  //   () =>
  //     [
  //       list.create(ctx, 1),
  //       list.create(ctx, 2),
  //       list.create(ctx, 3),
  //       list.create(ctx, 4),
  //     ] as const,
  // )

  assert.equal(track.lastInput(), [1, 2, 3, 4])

  list.swap(ctx, four, two)
  assert.equal(track.lastInput(), [1, 4, 3, 2])

  list.swap(ctx, two, four)
  assert.equal(track.lastInput(), [1, 2, 3, 4])

  list.swap(ctx, three, four)
  assert.equal(track.lastInput(), [1, 2, 4, 3])

  list.swap(ctx, four, three)
  assert.equal(track.lastInput(), [1, 2, 3, 4])

  list.remove(ctx, two)
  assert.equal(track.lastInput(), [1, 3, 4])

  list.remove(ctx, three)
  assert.equal(track.lastInput(), [1, 4])

  list.swap(ctx, four, one)
  assert.equal(track.lastInput(), [4, 1])

  list.swap(ctx, four, one)
  assert.equal(track.lastInput(), [1, 4])

  list.remove(ctx, one)
  assert.equal(track.lastInput(), [4])

  // TODO
  // assert.throws(() => list.swap(ctx, four, one))

  list.clear(ctx)
  assert.equal(parseAtoms(ctx, list.array), [])
})

test(`should move elements`, () => {
  const ctx = createTestCtx()
  const list = reatomLinkedList((ctx, n: number) => ({ n }))
  const one = list.create(ctx, 1)
  const two = list.create(ctx, 2)
  const three = list.create(ctx, 3)
  const four = list.create(ctx, 4)
  const track = ctx.subscribeTrack(list.array)

  assert.equal(
    track.lastInput().map(({ n }) => n),
    [1, 2, 3, 4],
  )

  list.move(ctx, one, four)
  assert.equal(
    track.lastInput().map(({ n }) => n),
    [2, 3, 4, 1],
  )
  assert.is(track.calls.length, 2)

  list.move(ctx, one, four)
  assert.equal(
    track.lastInput().map(({ n }) => n),
    [2, 3, 4, 1],
  )
  assert.is(track.calls.length, 2)

  list.move(ctx, one, null)
  assert.equal(
    track.lastInput().map(({ n }) => n),
    [1, 2, 3, 4],
  )
})

test('should respect node keys even if it is an atom', () => {
  const ctx = createTestCtx()
  const list = reatomLinkedList({
    create: (ctx, id: string) => ({ id: atom(id) }),
    key: 'id',
    initState: [{ id: atom('1') }, { id: atom('2') }],
  })
  const track = ctx.subscribeTrack(atom((ctx) => [...ctx.spy(list.map).keys()]))

  assert.equal(track.lastInput(), ['1', '2'])

  ctx.get(list.map).get('1')?.id(ctx, '0')
  assert.equal(track.lastInput(), ['0', '2'])
})

test('should correctly handle batching and cause tracking', () => {
  const ctx = createTestCtx()
  const list = reatomLinkedList(() => ({}))
  list.onChange((ctx) => {
    isCausedBy(ctx, action())
  })

  list.create(ctx)

  list.batch(ctx, () => {
    list.create(ctx)
    list.create(ctx)
  })
})

test('should remove a single node', () => {
  const ctx = createTestCtx()
  const list = reatomLinkedList((ctx, n: number) => ({ n }))

  const node = list.create(ctx, 1)
  assert.equal(ctx.get(list.array), [{ n: 1 }])
  assert.is(ctx.get(list).size, 1)

  list.remove(ctx, node)
  assert.equal(ctx.get(list.array), [])
  assert.is(ctx.get(list).size, 0)

  list.remove(ctx, node)
  assert.equal(ctx.get(list.array), [])
  assert.is(ctx.get(list).size, 0)
})

test('should respect initSnapshot for initializing', () => {
  const ctx = createTestCtx()
  const list = reatomLinkedList({
    create: (ctx, id: string) => ({ id: atom(id) }),
    key: 'id',
    initSnapshot: [['1'], ['2']],
  })
  const track = ctx.subscribeTrack(atom((ctx) => [...ctx.spy(list.map).keys()]))

  assert.equal(track.lastInput(), ['1', '2'])

  ctx.get(list.map).get('1')?.id(ctx, '0')
  assert.equal(track.lastInput(), ['0', '2'])
})

test.run()
