import { Atom, AtomState, CtxSpy } from '@reatom/core'

export const withComputed =
  <T extends Atom>(
    computed: (ctx: CtxSpy, state: AtomState<T>) => AtomState<T>,
  ) =>
  (anAtom: T): T => {
    const prevComputed = anAtom.__reatom.computer
    anAtom.__reatom.computer = (ctx, state) => {
      if (prevComputed) {
        state = prevComputed(ctx, state)
      }
      return computed(ctx, state as AtomState<T>)
    }
    return anAtom
  }
