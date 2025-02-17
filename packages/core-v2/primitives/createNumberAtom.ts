import { AtomOptions } from '@reatom/core-v2'
import { createPrimitiveAtom, PrimitiveAtomCreator } from '.'

export type NumberAtom = PrimitiveAtomCreator<
  number,
  {
    increment: []
    decrement: []
    add: [value: number]
    subtract: [value: number]
    change: [map: (state: number) => number]
    set: [newState: number]
  }
>

let count = 0
export function createNumberAtom(
  initState = 0,
  options: AtomOptions = `number${++count}`,
): NumberAtom {
  return createPrimitiveAtom(
    initState,
    {
      increment: (state) => state + 1,
      decrement: (state) => state - 1,
      add: (state, value: number) => state + value,
      subtract: (state, value: number) => state - value,
      change: (state, map: (state: number) => number) => map(state),
      set: (state, newState: number) => newState,
    },
    options,
  )
}
