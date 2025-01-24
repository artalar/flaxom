import { Action, atom, Atom, AtomState, Ctx, CtxSpy, Fn } from '@reatom/core'
import { isShallowEqual } from '@reatom/utils'
import { mapName } from './utils'
import { type LensAtom, type LensAction } from './'

/** Filter updates by comparator function ("shallow equal" for atoms by default) */
export const filter: {
  // TODO for some reason an atom not handled by overloads, if an action overload is first
  <T extends Atom>(
    predicate?: T extends Action<infer Params, infer Payload>
      ? Fn<[Ctx, Payload, Params], boolean>
      : Fn<[CtxSpy, AtomState<T>, AtomState<T>], boolean>,
    name?: string,
  ): Fn<
    [T],
    T extends Action<infer Params, infer Payload>
      ? LensAction<Params, Payload>
      : T extends Atom<infer State>
      ? LensAtom<State>
      : never
  >
} =
  (predicate?: Fn, name?: string) =>
  (anAtom: Atom): any => {
    const { isAction } = anAtom.__reatom

    predicate ??= isAction ? () => true : (ctx, a, b) => !isShallowEqual(a, b)

    // @ts-expect-error
    const theAtom: LensAtom & LensAction = atom(
      (ctx, prevState?: any) => {
        const isInit = ctx.cause.pubs.length === 0
        const state = ctx.spy(anAtom)

        return isAction
          ? state.reduce(
              (acc: any, call: any) => (predicate!(ctx, call.payload, call.params) ? [call] : acc),
              prevState ?? [],
            )
          : isInit || predicate!(ctx, state, prevState)
          ? state
          : prevState
      },
      mapName(anAtom, 'filter', name),
    )
    theAtom.deps = [anAtom]
    theAtom.__reatom.isAction = isAction

    return theAtom
  }
