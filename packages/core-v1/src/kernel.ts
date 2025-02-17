import * as v3 from '@reatom/core'
import { Atom } from './declareAtom'

export type Leaf = string // unique
export type TreeId = string | symbol // unique
export type State = Record<TreeId, unknown>
// reatom specific
export type Fn = {
  (ctx: Ctx): any
  _ownerAtomId: TreeId
}
export type Ctx = ReturnType<typeof createCtx>
export type BaseAction<T = any> = {
  type: Leaf
  payload: T
  v3action: v3.Action
}
export function createCtx(state: State, { type, payload }: BaseAction) {
  return {
    state,
    stateNew: {} as State,
    type,
    payload,
    changedIds: [] as TreeId[],
    changedAtoms: new Set<Atom<any>>(),
  }
}

class SetCounted {
  _counter = new Map<Fn, number>()

  add(el: Fn) {
    this._counter.set(el, (this._counter.get(el) || 0) + 1)
  }

  delete(el: Fn) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const count = this._counter.get(el)!
    if (count === 1) {
      return this._counter.delete(el)
    }
    if (count > 1) {
      this._counter.set(el, count - 1)
    }
    return false
  }

  forEach(cb: (fn: Fn) => any) {
    this._counter.forEach((_, fn) => cb(fn))
  }
}

export class Tree {
  id: TreeId

  isLeaf: boolean

  fnsMap: Map<Leaf, SetCounted>

  constructor(id: TreeId, isLeaf = false) {
    this.id = id
    this.isLeaf = isLeaf
    this.fnsMap = new Map()
  }

  _getFns(key: Leaf) {
    return (
      this.fnsMap.get(key) ||
      (this.fnsMap.set(key, new SetCounted()).get(key) as SetCounted)
    )
  }

  addFn(fn: Fn, key: Leaf) {
    this._getFns(key).add(fn)
  }

  union(tree: Tree) {
    tree.fnsMap.forEach((set, key) => {
      const fns = this._getFns(key)
      set.forEach((fn) => fns.add(fn))
    })
  }

  disunion(tree: Tree, cb: (key: TreeId) => any) {
    tree.fnsMap.forEach((set, key) => {
      const fns = this._getFns(key)
      set.forEach((fn) => fns.delete(fn) && cb(fn._ownerAtomId))
    })
  }

  forEach(key: Leaf, ctx: Ctx) {
    const setCounted = this.fnsMap.get(key)
    if (setCounted) setCounted.forEach((fn) => fn(ctx))
  }
}
