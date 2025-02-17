import {
  type Atom,
  action,
  atom,
  type Action,
  type AtomMut,
  random,
} from '@reatom/framework'

export interface Tree {
  id: string
  childrenAtom: AtomMut<Array<Tree>>
  checkedAtom: Atom<boolean>
  indeterminateAtom: Atom<boolean>
  toggle: Action<[boolean?]>
  add: Action<[string], Tree>
  del: Action<[]>
}

export const reatomTree = (id: string, parent?: Tree): Tree => {
  id += random(1000, 9999)
  const name = `tree#${id}`

  const childrenAtom: Tree['childrenAtom'] = atom(
    new Array<Tree>(),
    `${name}.childrenAtom`,
  )

  const indeterminateChildrenAtom = atom(
    (ctx) =>
      ctx.spy(childrenAtom).some((child) => ctx.spy(child.indeterminateAtom)),
    `${name}._indeterminateChildrenAtom`,
  )

  const checkedCountAtom = atom(
    (ctx) =>
      ctx
        .spy(childrenAtom)
        .reduce(
          (acc, child) => (ctx.spy(child.checkedAtom) ? acc + 1 : acc),
          0,
        ),
    `${name}._checkedCountAtom`,
  )

  const indeterminateAtom: Tree['indeterminateAtom'] = atom((ctx) => {
    const indeterminateChildren = ctx.spy(indeterminateChildrenAtom)
    const count = ctx.spy(checkedCountAtom)
    const { length } = ctx.spy(childrenAtom)

    return indeterminateChildren || (count > 0 && count < length)
  }, `${name}.indeterminateAtom`)

  const toggle: Tree['toggle'] = action((ctx, state?: boolean) => {
    state ??= !ctx.get(indeterminateAtom)
    ctx.get(childrenAtom).forEach((child) => child.toggle(ctx, state))

    return state
  }, `${name}.toggle`)

  const checkedAtom: Tree['checkedAtom'] = atom((ctx) => {
    const indeterminate = ctx.spy(indeterminateAtom)
    const checkedCount = ctx.spy(checkedCountAtom)
    const { length } = ctx.spy(childrenAtom)
    let state = !indeterminate && (length === 0 || checkedCount > 0)

    ctx.spy(toggle, ({ payload }) => {
      state = payload
    })

    return state
  }, `${name}.checkedAtom`)

  const add: Tree['add'] = action((ctx, name: string) => {
    const childTree = reatomTree(name, tree)
    childrenAtom(ctx, (state) => [...state, childTree])
    return childTree
  }, `${name}.add`)

  const del: Tree['del'] = action((ctx) => {
    parent?.childrenAtom(ctx, (state) => state.filter((el) => el !== tree))
  }, `${name}.del`)

  const tree: Tree = {
    id,
    childrenAtom,
    checkedAtom,
    indeterminateAtom,
    toggle,
    add,
    del,
  }

  return tree
}
