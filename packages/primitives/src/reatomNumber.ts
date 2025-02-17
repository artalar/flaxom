import { Action, AtomMut, action, atom } from '@reatom/core'
import { withAssign } from './withAssign'

export interface NumberAtom extends AtomMut<number> {
  increment: Action<[by?: number], number>
  decrement: Action<[by?: number], number>
  random: Action<[], number>
  reset: Action<[], number>
}

export const reatomNumber = (initState = 0, name?: string): NumberAtom =>
  atom(initState, name).pipe(
    withAssign((target, name) => ({
      increment: action(
        (ctx, by = 1) => target(ctx, (prev) => prev + by),
        `${name}.increment`,
      ),
      decrement: action(
        (ctx, by = 1) => target(ctx, (prev) => prev - by),
        `${name}.decrement`,
      ),
      random: action((ctx) => target(ctx, Math.random()), `${name}.decrement`),
      reset: action((ctx) => target(ctx, initState), `${name}.reset`),
    })),
  )
