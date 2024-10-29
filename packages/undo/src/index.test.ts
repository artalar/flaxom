import { AtomMut, atom } from '@reatom/core'
import { createTestCtx, mockFn } from '@reatom/testing'
import { describe, it, expect } from 'vitest'

import { reatomDynamicUndo, reatomUndo, withUndo } from './'
import { reatomMap } from '@reatom/primitives'
import { parseAtoms } from '@reatom/lens'
import { createMemStorage, reatomPersist } from '@reatom/persist'
test('withUndo', async () => {
  const a = atom(0).pipe(withUndo({ length: 5 }))
  const ctx = createTestCtx()

  expect(ctx.get(a)).toBe(0)
  expect(ctx.get(a.isUndoAtom)).toBe(false)
  expect(ctx.get(a.isRedoAtom)).toBe(false)
  expect(ctx.get(a.historyAtom)).toEqual([0])

  ctx.get(() => {
    a(ctx, (s) => s + 1)
    a(ctx, (s) => s + 1)
    a(ctx, (s) => s + 1)
  })

  expect(ctx.get(a)).toBe(3)
  expect(ctx.get(a.isUndoAtom)).toBe(true)
  expect(ctx.get(a.isRedoAtom)).toBe(false)
  expect(ctx.get(a.historyAtom)).toEqual([0, 1, 2, 3])

  a.undo(ctx)
  expect(ctx.get(a.isUndoAtom)).toBe(true)
  expect(ctx.get(a.isRedoAtom)).toBe(true)
  expect(ctx.get(a)).toBe(2)

  a.redo(ctx)
  expect(ctx.get(a.isUndoAtom)).toBe(true)
  expect(ctx.get(a.isRedoAtom)).toBe(false)
  expect(ctx.get(a)).toBe(3)

  a.undo(ctx)
  a.undo(ctx)
  a.undo(ctx)
  expect(ctx.get(a.isUndoAtom)).toBe(false)
  expect(ctx.get(a.isRedoAtom)).toBe(true)
  expect(ctx.get(a)).toBe(0)

  a(ctx, 123)
  expect(ctx.get(a.isUndoAtom)).toBe(true)
  expect(ctx.get(a.isRedoAtom)).toBe(false)

  a.undo(ctx)
  expect(ctx.get(a.isUndoAtom)).toBe(false)
  expect(ctx.get(a.isRedoAtom)).toBe(true)
  expect(ctx.get(a)).toBe(0)
})

test('withUndo without getting historyAtom before first change', async () => {
  const a = atom(0).pipe(withUndo({ length: 5 }))
  const ctx = createTestCtx()

  a(ctx, 1)
  expect(ctx.get(a)).toBe(1)
  expect(ctx.get(a.isUndoAtom)).toBe(true)
  expect(ctx.get(a.isRedoAtom)).toBe(false)
  expect(ctx.get(a.historyAtom)).toEqual([0, 1])
})

test('limit', () => {
  const a = atom(0).pipe(withUndo({ length: 5 }))
  const ctx = createTestCtx()

  ctx.subscribeTrack(a)

  let i = 10
  while (i--) a(ctx, (s) => s + 1)
  expect(ctx.get(a.historyAtom)).toEqual([6, 7, 8, 9, 10])

  a.undo(ctx)
  a.undo(ctx)
  expect(ctx.get(a)).toBe(8)

  a(ctx, (s) => s + 1)
  expect(ctx.get(a.historyAtom)).toEqual([6, 7, 8, 9])
})

test('reatomUndo', () => {
  const a = atom(0, 'a')
  const b = atom(0, 'b')
  const c = reatomUndo({ a, b }, 'c')
  const ctx = createTestCtx()
  ctx.subscribeTrack(c)

  expect(ctx.get(c)).toEqual({ a: 0, b: 0 })

  a(ctx, 1)
  a(ctx, 2)
  b(ctx, 3)
  a(ctx, 4)
  expect(ctx.get(c)).toEqual({ a: 4, b: 3 })

  c.undo(ctx)
  expect(ctx.get(c)).toEqual({ a: 2, b: 3 })
  expect(ctx.get(a)).toBe(2)
  expect(ctx.get(b)).toBe(3)

  c.redo(ctx)
  expect(ctx.get(c)).toEqual({ a: 4, b: 3 })
  expect(ctx.get(a)).toBe(4)
  expect(ctx.get(b)).toBe(3)

  c.jump(ctx, -2)
  expect(ctx.get(c)).toEqual({ a: 2, b: 0 })
  expect(ctx.get(a)).toBe(2)
  expect(ctx.get(b)).toBe(0)

  b(ctx, 5)
  expect(ctx.get(c)).toEqual({ a: 2, b: 5 })
  expect(ctx.get(c.isRedoAtom)).toBe(false)
})

test('reatomDynamicUndo', () => {
  const listAtom = reatomMap<number, AtomMut<number>>()
  const listUndoAtom = reatomDynamicUndo((ctx) => {
    parseAtoms(ctx, listAtom)
  })
  const ctx = createTestCtx()
  const track = jest.fn()
  ctx.subscribe(listUndoAtom, track)
  track.mockClear()

  ctx.get(() => {
    listAtom.set(ctx, 1, atom(1))
    listAtom.set(ctx, 2, atom(2))

    for (const [, anAtom] of ctx.get(listAtom)) {
      anAtom(ctx, (v) => v * 10)
    }
  })

  expect(track.mock.calls.length).toBe(1)
  expect(parseAtoms(ctx, listAtom)).toEqual(new Map().set(1, 10).set(2, 20))

  for (const [, anAtom] of ctx.get(listAtom)) {
    anAtom(ctx, (v) => v * 10)
  }
  const elementAtom = atom(3)
  listAtom.set(ctx, 3, elementAtom)
  expect(track.mock.calls.length).toBe(4)
  expect(parseAtoms(ctx, listAtom)).toEqual(new Map().set(1, 100).set(2, 200).set(3, 3))

  listUndoAtom.undo(ctx)
  expect(ctx.get(listAtom).size).toBe(2)
  expect(parseAtoms(ctx, listAtom)).toEqual(new Map().set(1, 100).set(2, 200))

  listUndoAtom.undo(ctx)
  expect(parseAtoms(ctx, listAtom)).toEqual(new Map().set(1, 100).set(2, 20))

  listUndoAtom.redo(ctx)
  listUndoAtom.redo(ctx)
  expect(parseAtoms(ctx, listAtom)).toEqual(new Map().set(1, 100).set(2, 200).set(3, 3))
  expect(listAtom.get(ctx, 3)).toBe(elementAtom)
})

test('"shouldReplace"', () => {
  const inputAtom = atom('').pipe(withUndo({ shouldReplace: (ctx, state) => !state.endsWith(' ') }))
  const ctx = createTestCtx()

  for (const letter of 'This is a test') {
    inputAtom(ctx, (s) => s + letter)
  }
  expect(ctx.get(inputAtom)).toBe('This is a test')
  expect(ctx.get(inputAtom.historyAtom).length).toBe(4)

  inputAtom.undo(ctx)
  expect(ctx.get(inputAtom)).toBe('This is a')

  inputAtom.undo(ctx)
  inputAtom.undo(ctx)
  expect(ctx.get(inputAtom)).toBe('This')
})

test('"shouldUpdate"', () => {
  const ctx = createTestCtx()
  const inputAtom = atom('').pipe(withUndo({ shouldUpdate: () => true }))

  expect(ctx.get(inputAtom)).toBe('')
  expect(ctx.get(inputAtom.historyAtom).length).toBe(1)

  inputAtom(ctx, 'a')
  inputAtom(ctx, 'b')
  expect(ctx.get(inputAtom)).toBe('b')
  expect(ctx.get(inputAtom.historyAtom).length).toBe(3)

  inputAtom.undo(ctx)
  inputAtom.undo(ctx)
  inputAtom(ctx, 'b')
  expect(ctx.get(inputAtom)).toBe('b')
  expect(ctx.get(inputAtom.historyAtom).length).toBe(2)
})

test('withPersist', async () => {
  const ctx = createTestCtx()
  const mockStorage = createMemStorage({ name: 'undo' })
  const withMock = reatomPersist(mockStorage)
  const inputAtom = atom('').pipe(withUndo({ withPersist: withMock }))

  inputAtom(ctx, 'a')
  inputAtom(ctx, 'b')
  inputAtom(ctx, 'c')
  inputAtom.undo(ctx)

  const anotherCtx = createTestCtx()
  mockStorage.snapshotAtom(anotherCtx, ctx.get(mockStorage.snapshotAtom))
  expect(anotherCtx.get(inputAtom)).toBe('b')
  expect(anotherCtx.get(inputAtom.positionAtom)).toBe(2)
  expect(anotherCtx.get(inputAtom.historyAtom)).toEqual(['', 'a', 'b', 'c'])
})
