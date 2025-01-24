import { AtomMut, atom } from '@reatom/core'
import { createTestCtx, mockFn } from '@reatom/testing'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { reatomDynamicUndo, reatomUndo, withUndo } from './'
import { reatomMap } from '@reatom/primitives'
import { parseAtoms } from '@reatom/lens'
import { createMemStorage, reatomPersist } from '@reatom/persist'

test('withUndo', async () => {
  const a = atom(0).pipe(withUndo({ length: 5 }))
  const ctx = createTestCtx()

  assert.is(ctx.get(a), 0)
  assert.is(ctx.get(a.isUndoAtom), false)
  assert.is(ctx.get(a.isRedoAtom), false)
  assert.equal(ctx.get(a.historyAtom), [0])

  ctx.get(() => {
    a(ctx, (s) => s + 1)
    a(ctx, (s) => s + 1)
    a(ctx, (s) => s + 1)
  })

  assert.is(ctx.get(a), 3)
  assert.is(ctx.get(a.isUndoAtom), true)
  assert.is(ctx.get(a.isRedoAtom), false)
  assert.equal(ctx.get(a.historyAtom), [0, 1, 2, 3])

  a.undo(ctx)
  assert.is(ctx.get(a.isUndoAtom), true)
  assert.is(ctx.get(a.isRedoAtom), true)
  assert.is(ctx.get(a), 2)

  a.redo(ctx)
  assert.is(ctx.get(a.isUndoAtom), true)
  assert.is(ctx.get(a.isRedoAtom), false)
  assert.is(ctx.get(a), 3)

  a.undo(ctx)
  a.undo(ctx)
  a.undo(ctx)
  assert.is(ctx.get(a.isUndoAtom), false)
  assert.is(ctx.get(a.isRedoAtom), true)
  assert.is(ctx.get(a), 0)

  a(ctx, 123)
  assert.is(ctx.get(a.isUndoAtom), true)
  assert.is(ctx.get(a.isRedoAtom), false)

  a.undo(ctx)
  assert.is(ctx.get(a.isUndoAtom), false)
  assert.is(ctx.get(a.isRedoAtom), true)
  assert.is(ctx.get(a), 0)
  ;('👍') //?
})

test('withUndo without getting historyAtom before first change', async () => {
  const a = atom(0).pipe(withUndo({ length: 5 }))
  const ctx = createTestCtx()

  a(ctx, 1)
  assert.is(ctx.get(a), 1)
  assert.is(ctx.get(a.isUndoAtom), true)
  assert.is(ctx.get(a.isRedoAtom), false)
  assert.equal(ctx.get(a.historyAtom), [0, 1])
  ;('👍') //?
})

test('limit', () => {
  const a = atom(0).pipe(withUndo({ length: 5 }))
  const ctx = createTestCtx()

  ctx.subscribeTrack(a)

  let i = 10
  while (i--) a(ctx, (s) => s + 1)
  assert.equal(ctx.get(a.historyAtom), [6, 7, 8, 9, 10])

  a.undo(ctx)
  a.undo(ctx)
  assert.is(ctx.get(a), 8)

  a(ctx, (s) => s + 1)
  assert.equal(ctx.get(a.historyAtom), [6, 7, 8, 9])
  ;('👍') //?
})

test('reatomUndo', () => {
  const a = atom(0, 'a')
  const b = atom(0, 'b')
  const c = reatomUndo({ a, b }, 'c')
  const ctx = createTestCtx()
  ctx.subscribeTrack(c)

  assert.equal(ctx.get(c), { a: 0, b: 0 })

  a(ctx, 1)
  a(ctx, 2)
  b(ctx, 3)
  a(ctx, 4)
  assert.equal(ctx.get(c), { a: 4, b: 3 })

  c.undo(ctx)
  assert.equal(ctx.get(c), { a: 2, b: 3 })
  assert.is(ctx.get(a), 2)
  assert.is(ctx.get(b), 3)

  c.redo(ctx)
  assert.equal(ctx.get(c), { a: 4, b: 3 })
  assert.is(ctx.get(a), 4)
  assert.is(ctx.get(b), 3)

  c.jump(ctx, -2)
  assert.equal(ctx.get(c), { a: 2, b: 0 })
  assert.is(ctx.get(a), 2)
  assert.is(ctx.get(b), 0)

  b(ctx, 5)
  assert.equal(ctx.get(c), { a: 2, b: 5 })
  assert.is(ctx.get(c.isRedoAtom), false)
  ;('👍') //?
})

test('reatomDynamicUndo', () => {
  const listAtom = reatomMap<number, AtomMut<number>>()
  const listUndoAtom = reatomDynamicUndo((ctx) => {
    parseAtoms(ctx, listAtom)
  })
  const ctx = createTestCtx()
  const track = mockFn()
  ctx.subscribe(listUndoAtom, track)
  track.calls.length = 0

  ctx.get(() => {
    listAtom.set(ctx, 1, atom(1))
    listAtom.set(ctx, 2, atom(2))

    for (const [, anAtom] of ctx.get(listAtom)) {
      anAtom(ctx, (v) => v * 10)
    }
  })

  assert.is(track.calls.length, 1)
  assert.equal(parseAtoms(ctx, listAtom), new Map().set(1, 10).set(2, 20))

  for (const [, anAtom] of ctx.get(listAtom)) {
    anAtom(ctx, (v) => v * 10)
  }
  const elementAtom = atom(3)
  listAtom.set(ctx, 3, elementAtom)
  assert.is(track.calls.length, 4)
  assert.equal(parseAtoms(ctx, listAtom), new Map().set(1, 100).set(2, 200).set(3, 3))

  listUndoAtom.undo(ctx)
  assert.is(ctx.get(listAtom).size, 2)
  assert.equal(parseAtoms(ctx, listAtom), new Map().set(1, 100).set(2, 200))

  listUndoAtom.undo(ctx)
  assert.equal(parseAtoms(ctx, listAtom), new Map().set(1, 100).set(2, 20))

  listUndoAtom.redo(ctx)
  listUndoAtom.redo(ctx)
  assert.equal(parseAtoms(ctx, listAtom), new Map().set(1, 100).set(2, 200).set(3, 3))
  assert.is(listAtom.get(ctx, 3), elementAtom)
  ;('👍') //?
})

test('"shouldReplace"', () => {
  const inputAtom = atom('').pipe(withUndo({ shouldReplace: (ctx, state) => !state.endsWith(' ') }))
  const ctx = createTestCtx()

  for (const letter of 'This is a test') {
    inputAtom(ctx, (s) => s + letter)
  }
  assert.is(ctx.get(inputAtom), 'This is a test')
  assert.is(ctx.get(inputAtom.historyAtom).length, 4)

  inputAtom.undo(ctx)
  assert.is(ctx.get(inputAtom), 'This is a')

  inputAtom.undo(ctx)
  inputAtom.undo(ctx)
  assert.is(ctx.get(inputAtom), 'This')
  ;('👍') //?
})

test('"shouldUpdate"', () => {
  const ctx = createTestCtx()
  const inputAtom = atom('').pipe(withUndo({ shouldUpdate: () => true }))

  assert.is(ctx.get(inputAtom), '')
  assert.is(ctx.get(inputAtom.historyAtom).length, 1)

  inputAtom(ctx, 'a')
  inputAtom(ctx, 'b')
  assert.is(ctx.get(inputAtom), 'b')
  assert.is(ctx.get(inputAtom.historyAtom).length, 3)

  inputAtom.undo(ctx)
  inputAtom.undo(ctx)
  inputAtom(ctx, 'b')
  assert.is(ctx.get(inputAtom), 'b')
  assert.is(ctx.get(inputAtom.historyAtom).length, 2)
  ;('👍') //?
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
  assert.is(anotherCtx.get(inputAtom), 'b')
  assert.is(anotherCtx.get(inputAtom.positionAtom), 2)
  assert.equal(anotherCtx.get(inputAtom.historyAtom), ['', 'a', 'b', 'c'])
  ;`👍` //?
})

test.run()
