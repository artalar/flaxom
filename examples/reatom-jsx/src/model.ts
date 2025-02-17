import {
  atom,
  action,
  AtomMut,
  LLNode,
  reatomLinkedList,
  LL_NEXT,
  LL_PREV,
} from '@reatom/framework'

export type ListElement = LLNode<AtomMut<string>>

export const list = reatomLinkedList((ctx, init: string) => atom(init), 'list')

export const moveDown = action((ctx, input: ListElement) => {
  list.move(ctx, input, input[LL_NEXT])
}, 'moveDown')
export const moveUp = action((ctx, input: ListElement) => {
  list.move(ctx, input, input[LL_PREV]?.[LL_PREV] ?? null)
}, 'moveUp')

// TODO: reatomReduce
// export const sum = atom(
//   (ctx) =>
//     ctx.spy(list.array).reduce((acc, input) => acc + ctx.spy(input), 0),
//   'sum',
// )

export const count = atom(1, 'count')

export const add = action((ctx) => {
  list.batch(ctx, () => {
    let i = ctx.get(count)
    while (i--) {
      list.create(ctx, i.toString())
    }
  })

  count(ctx, 1)
}, 'add')
