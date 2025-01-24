import { AtomOptions } from '@reatom/core-v2'
import { createPrimitiveAtom, PrimitiveAtomCreator } from '.'

export type SetAtom<T> = PrimitiveAtomCreator<
  Set<T>,
  {
    set: [el: T]
    delete: [el: T]
    clear: []
    change: [map: (stateCopy: Set<T>) => Set<T>]
  }
>

let count = 0
export function createSetAtom<T>(initState = new Set<T>(), options: AtomOptions<Set<T>> = `set${++count}`) {
  type State = Set<T>

  return createPrimitiveAtom(
    initState,
    {
      set: (state, el: T): State => new Set(state).add(el),
      delete: (state, el: T): State => {
        const newState = (state = new Set(state))
        if (!newState.delete(el)) return state
        return newState
      },
      clear: (): State => new Set(),
      change: (state, cb: (stateCopy: State) => State): State => cb(new Set(state)),
    },
    options,
  )
}
