import { action, atom } from '@reatom/core'
import { createTestCtx, mockFn } from '@reatom/testing'
import { describe, it, expect } from 'vitest'
import { reatomLinkedList } from './reatomLinkedList'
import { parseAtoms } from '@reatom/lens'
import { isCausedBy } from '@reatom/effects'

describe('reatomLinkedList', () => {
  it('should respect initState, create and remove elements properly', () => {
    const ctx = createTestCtx()
    const list = reatomLinkedList({
      create: (ctx, n: number) => atom(n),
      initState: [atom(1), atom(2)],
    })

    const last = list.create(ctx, 3)
    expect(ctx.get(list.array).map((v) => ctx.get(v))).toEqual([1, 2, 3])

    list.remove(ctx, last)
    expect(parseAtoms(ctx, list.array)).toEqual([1, 2])

    list.remove(ctx, last)
    expect(parseAtoms(ctx, list.array)).toEqual([1, 2])

    list.remove(ctx, list.find(ctx, (n) => ctx.get(n) === 1)!)
    expect(parseAtoms(ctx, list.array)).toEqual([2])

    list.remove(ctx, list.find(ctx, (n) => ctx.get(n) === 2)!)
    expect(parseAtoms(ctx, list.array)).toEqual([])

    expect(() => {
      list.remove(ctx, list.find(ctx, (n) => ctx.get(n) === 2)!)
    }).toThrow('Reatom error: The passed data is not a linked list node.')
  })

  it('should swap elements', () => {
    const ctx = createTestCtx()
    const list = reatomLinkedList((ctx, n: number) => ({ n }))
    const { array } = list.reatomMap((ctx, { n }) => ({ n }))
    const track = ctx.subscribeTrack(atom((ctx) => ctx.spy(array).map(({ n }) => n)))
    const one = list.create(ctx, 1)
    const two = list.create(ctx, 2)
    const three = list.create(ctx, 3)
    const four = list.create(ctx, 4)

    expect(track.lastInput()).toEqual([1, 2, 3, 4])

    list.swap(ctx, four, two)
    expect(track.lastInput()).toEqual([1, 4, 3, 2])

    list.swap(ctx, two, four)
    expect(track.lastInput()).toEqual([1, 2, 3, 4])

    list.swap(ctx, three, four)
    expect(track.lastInput()).toEqual([1, 2, 4, 3])

    list.swap(ctx, four, three)
    expect(track.lastInput()).toEqual([1, 2, 3, 4])

    list.remove(ctx, two)
    expect(track.lastInput()).toEqual([1, 3, 4])

    list.remove(ctx, three)
    expect(track.lastInput()).toEqual([1, 4])

    list.swap(ctx, four, one)
    expect(track.lastInput()).toEqual([4, 1])

    list.swap(ctx, four, one)
    expect(track.lastInput()).toEqual([1, 4])

    list.remove(ctx, one)
    expect(track.lastInput()).toEqual([4])

    list.clear(ctx)
    expect(parseAtoms(ctx, list.array)).toEqual([])
  })

  it('should move elements', () => {
    const ctx = createTestCtx()
    const list = reatomLinkedList((ctx, n: number) => ({ n }))
    const one = list.create(ctx, 1)
    const two = list.create(ctx, 2)
    const three = list.create(ctx, 3)
    const four = list.create(ctx, 4)
    const track = ctx.subscribeTrack(list.array)

    expect(track.lastInput().map(({ n }) => n)).toEqual([1, 2, 3, 4])

    list.move(ctx, one, four)
    expect(track.lastInput().map(({ n }) => n)).toEqual([2, 3, 4, 1])
    expect(track.calls.length).toBe(2)

    list.move(ctx, one, four)
    expect(track.lastInput().map(({ n }) => n)).toEqual([2, 3, 4, 1])
    expect(track.calls.length).toBe(2)

    list.move(ctx, one, null)
    expect(track.lastInput().map(({ n }) => n)).toEqual([1, 2, 3, 4])
  })

  it('should respect node keys even if it is an atom', () => {
    const ctx = createTestCtx()
    const list = reatomLinkedList({
      create: (ctx, id: string) => ({ id: atom(id) }),
      key: 'id',
      initState: [{ id: atom('1') }, { id: atom('2') }],
    })
    const track = ctx.subscribeTrack(atom((ctx) => [...ctx.spy(list.map).keys()]))

    expect(track.lastInput()).toEqual(['1', '2'])

    ctx.get(list.map).get('1')?.id(ctx, '0')
    expect(track.lastInput()).toEqual(['0', '2'])
  })

  it('should correctly handle batching and cause tracking', () => {
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

  it('should remove a single node', () => {
    const ctx = createTestCtx()
    const list = reatomLinkedList((ctx, n: number) => ({ n }))

    const node = list.create(ctx, 1)
    expect(ctx.get(list.array)).toEqual([{ n: 1 }])
    expect(ctx.get(list).size).toBe(1)

    list.remove(ctx, node)
    expect(ctx.get(list.array)).toEqual([])
    expect(ctx.get(list).size).toBe(0)

    list.remove(ctx, node)
    expect(ctx.get(list.array)).toEqual([])
    expect(ctx.get(list).size).toBe(0)
  })
})
