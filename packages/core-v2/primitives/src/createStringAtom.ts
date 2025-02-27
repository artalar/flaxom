import { AtomOptions } from '@reatom/core-v2'
import { createPrimitiveAtom, PrimitiveAtom, PrimitiveAtomCreator } from '.'

export type StringAtom<State extends string = string> = PrimitiveAtomCreator<
  State,
  { set: [State]; change: [map: (stateCopy: State) => State] }
>

let count = 0
export function createStringAtom(
  initState?: string,
  options?: AtomOptions,
): StringAtom
export function createStringAtom<T extends string>(
  initState: T,
  options?: AtomOptions,
): StringAtom<T>
export function createStringAtom(
  initState = ``,
  options: AtomOptions = `string${++count}`,
): StringAtom {
  // @ts-ignore
  return createPrimitiveAtom(initState, null, options)
}
