import { Action, AtomMut, action, atom } from '@reatom/core'
import { withAssign } from './withAssign'

export interface ArrayAtom<T> extends AtomMut<Array<T>> {
  toReversed: Action<[], T[]>
  toSorted: Action<[compareFn?: (a: T, b: T) => number], T[]>
  toSpliced: Action<[start: number, deleteCount: number, ...items: T[]], T[]>
  with: Action<[i: number, value: T], T[]>
  push: Action<[...items: T[]], T[]>
  pop: Action<[], T[]>
  shift: Action<[], T[]>
  unshift: Action<[...items: T[]], T[]>
  slice: Action<[start?: number, end?: number], T[]>
}

export const reatomArray = <T>(initState = [] as T[], name?: string): ArrayAtom<T> =>
  atom(initState, name).pipe(
    withAssign((target, name) => ({
      toReversed: action((ctx) => target(ctx, (prev) => prev.slice().reverse()), `${name}.toReversed`),
      toSorted: action(
        (ctx, compareFn?: (a: T, b: T) => number) => target(ctx, (prev) => prev.slice().sort(compareFn)),
        `${name}.toSorted`,
      ),
      toSpliced: action(
        (ctx, start: number, deleteCount: number, ...items: T[]) =>
          target(ctx, (state) => {
            state = state.slice()
            state.splice(start, deleteCount, ...items)
            return state
          }),
        `${name}.toSpliced`,
      ),
      with: action(
        (ctx, i: number, value: T) =>
          target(ctx, (state) => {
            if (Object.is(state.at(i), value)) return state
            state = state.slice()
            state[i] = value
            return state
          }),
        `${name}.with`,
      ),
      push: action(
        (ctx, ...items: T[]) =>
          target(ctx, (state) => {
            state = state.slice()
            state.push(...items)
            return state
          }),
        `${name}.push`,
      ),
      pop: action(
        (ctx) =>
          target(ctx, (state) => {
            state = state.slice()
            state.pop()
            return state
          }),
        `${name}.pop`,
      ),
      shift: action(
        (ctx) =>
          target(ctx, (state) => {
            state = state.slice()
            state.shift()
            return state
          }),
        `${name}.shift`,
      ),
      unshift: action(
        (ctx, ...items: T[]) =>
          target(ctx, (state) => {
            state = state.slice()
            state.unshift(...items)
            return state
          }),
        `${name}.unshift`,
      ),
      slice: action(
        (ctx, start?: number, end?: number) => target(ctx, (state) => state.slice(start, end)),
        `${name}.slice`,
      ),
    })),
  )
