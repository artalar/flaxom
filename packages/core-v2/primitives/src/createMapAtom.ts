import { AtomOptions } from '@reatom/core-v2'
import { createPrimitiveAtom, PrimitiveAtomCreator } from '.'

export type MapAtom<Key, Element> = PrimitiveAtomCreator<
  Map<Key, Element>,
  {
    set: [key: Key, el: Element]
    delete: [key: Key]
    clear: []
    change: [map: (stateCopy: Map<Key, Element>) => Map<Key, Element>]
  }
>

let count = 0
export function createMapAtom<Key, Element>(
  initState = new Map<Key, Element>(),
  options: AtomOptions<Map<Key, Element>> = `map${++count}`,
): MapAtom<Key, Element> {
  type State = Map<Key, Element>

  return createPrimitiveAtom(
    initState,
    {
      set: (state, key: Key, el: Element) => new Map(state).set(key, el),
      delete: (state, key: Key) => {
        const newState = (state = new Map(state))
        if (!newState.delete(key)) return state
        return newState
      },
      clear: () => new Map(),
      change: (state, cb: (stateCopy: State) => State) => cb(new Map(state)),
    },
    options,
  )
}
