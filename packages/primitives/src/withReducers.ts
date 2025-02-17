import { action, Action, AtomMut, AtomState, Fn, Rec } from '@reatom/core'

interface Reducers<A extends AtomMut>
  extends Rec<(state: AtomState<A>, ...args: Array<any>) => AtomState<A>> {}

export type WithReducers<A extends AtomMut, R extends Reducers<A>> = A & {
  [K in keyof R]: R[K] extends Fn<[any, ...infer Args]>
    ? Action<Args, AtomState<A>>
    : never
}

/** @deprecated use withAssign instead */
export const withReducers =
  <A extends AtomMut, R extends Reducers<A>>(reducers: R) =>
  (anAtom: A) =>
    Object.keys(reducers).reduce((anAtom, k) => {
      ;(anAtom as any)[k] = action(
        (ctx, ...args) => anAtom(ctx, reducers[k]!(ctx.get(anAtom), ...args)),
        `${anAtom.__reatom.name}._${k}`,
      )
      return anAtom
    }, anAtom) as WithReducers<A, R>
