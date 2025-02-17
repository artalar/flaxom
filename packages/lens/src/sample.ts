import { Action, atom, Atom, AtomState, Fn } from '@reatom/core'
import { mapName } from './utils'
import { type LensAtom, type LensAction } from './'

/** Delay updates until other atom update / action call */
// https://rxjs.dev/api/operators/sample
// https://effector.dev/docs/api/effector/sample
// @ts-expect-error
export const sample: {
  // TODO for some reason an atom not handled by overloads, if an action overload is first
  <T extends Atom>(
    signal: Atom,
    name?: string,
  ): Fn<
    [T],
    T extends Action<infer Params, infer Payload>
      ? LensAction<[], Payload>
      : LensAtom<AtomState<T>>
  >
} =
  <T>(signal: Atom, name?: string) =>
  // @ts-ignore
  (anAtom) => {
    name = mapName(anAtom, 'sample', name)
    const { isAction } = anAtom.__reatom
    const _cacheAtom = atom<unknown>(null, `${name}._cacheAtom`)

    // @ts-expect-error
    const theAtom: LensAtom & LensAction = atom((ctx, prevState?: any) => {
      const patch = ctx.cause
      const isInit = patch.pubs.length === 0

      ctx.spy(anAtom, (v) => _cacheAtom(ctx, isAction ? [v] : v))

      let changed = false
      ctx.spy(signal, () => (changed = true))

      if (changed && !(isInit && !signal.__reatom.isAction)) {
        const state = ctx.get(_cacheAtom)
        // drop action cache
        _cacheAtom(ctx, ctx.get(anAtom))
        return state
      }

      return isInit && !(signal.__reatom.isAction && changed)
        ? isAction
          ? []
          : ctx.get(anAtom)
        : changed
        ? ctx.get(_cacheAtom)
        : prevState
    }, name)
    theAtom.__reatom.isAction = isAction
    theAtom.deps = [anAtom, signal]

    return theAtom
  }
