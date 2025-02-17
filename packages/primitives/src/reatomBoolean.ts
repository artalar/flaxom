import { Action, AtomMut, action, atom } from '@reatom/core'
import { withAssign } from './withAssign'

export interface BooleanAtom extends AtomMut<boolean> {
  toggle: Action<[], boolean>
  setTrue: Action<[], true>
  setFalse: Action<[], false>
  reset: Action<[], boolean>
}

export const reatomBoolean = (init = false, name?: string): BooleanAtom =>
  atom(init, name).pipe(
    withAssign((target, name) => ({
      toggle: action((ctx) => target(ctx, (prev) => !prev), `${name}.toggle`),
      setTrue: action((ctx) => target(ctx, true) as true, `${name}.setTrue`),
      setFalse: action(
        (ctx) => target(ctx, false) as false,
        `${name}.setFalse`,
      ),
      reset: action((ctx) => target(ctx, init), `${name}.reset`),
    })),
  )
