import { AtomOptions } from '@reatom/core-v2'
import { createPrimitiveAtom, PrimitiveAtomCreator } from '.'

export type BooleanAtomCreator = PrimitiveAtomCreator<
  boolean,
  {
    toggle: []
    setTrue: []
    setFalse: []
    change: [(state: boolean) => boolean]
    set: [boolean]
  }
>

let count = 0
export function createBooleanAtom(initState = false, options: AtomOptions = `boolean${++count}`): BooleanAtomCreator {
  return createPrimitiveAtom<
    boolean,
    {
      toggle: (state: boolean) => boolean
      setTrue: () => true
      setFalse: () => false
      change: (state: boolean, cb: (state: boolean) => boolean) => boolean
      set: (state: boolean, newState: boolean) => boolean
    }
  >(
    initState,
    {
      toggle: (state) => !state,
      setTrue: () => true,
      setFalse: () => false,
      change: (state, cb: (state: boolean) => boolean) => cb(state),
      set: (state, newState: boolean) => newState,
    },
    options,
  )
}
