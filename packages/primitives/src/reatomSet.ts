import { Action, action, atom, Atom, AtomMut, Ctx } from '@reatom/core'
import { withAssign } from './withAssign'

export interface SetAtom<T> extends AtomMut<Set<T>> {
  add: Action<[el: T], Set<T>>
  delete: Action<[el: T], Set<T>>
  toggle: Action<[el: T], Set<T>>
  clear: Action<[], Set<T>>
  reset: Action<[], Set<T>>
  intersection: Action<[set: Set<T>], Set<T>>
  union: Action<[set: Set<T>], Set<T>>
  difference: Action<[set: Set<T>], Set<T>>
  symmetricDifference: Action<[set: Set<T>], Set<T>>
  has: (ctx: Ctx, el: T) => boolean
  isSubsetOf: (ctx: Ctx, set: Set<T>) => boolean
  isSupersetOf: (ctx: Ctx, set: Set<T>) => boolean
  isDisjointFrom: (ctx: Ctx, set: Set<T>) => boolean
  size: (ctx: Ctx) => number
  /** @deprecated */
  set: Action<[el: T], Set<T>>
  sizeAtom: Atom<number>
}

interface ProposalSet<T> extends Set<T> {
  difference(other: Set<T>): Set<T>
  intersection(other: Set<T>): Set<T>
  isDisjointFrom(other: Set<T>): boolean
  isSubsetOf(other: Set<T>): boolean
  isSupersetOf(other: Set<T>): boolean
  symmetricDifference(other: Set<T>): Set<T>
  union(other: Set<T>): Set<T>
}

type FirstSetConstructorParam<T> = ConstructorParameters<typeof Set<T>>[0]

export const reatomSet = <T>(
  initState: Set<T> | FirstSetConstructorParam<T> = new Set<T>(),
  name?: string,
): SetAtom<T> => {
  const atomInitState = initState instanceof Set ? initState : new Set(initState);
  
  return atom(atomInitState, name).pipe(
    withAssign((target, name) => ({
      add: action(
        (ctx, el) =>
          target(ctx, (prev) => (prev.has(el) ? prev : new Set(prev).add(el))),
        `${name}.add`,
      ),
      /** @deprecated */
      set: action(
        (ctx, el) =>
          target(ctx, (prev) => (prev.has(el) ? prev : new Set(prev).add(el))),
        `${name}.set`,
      ),
      delete: action((ctx, el) => {
        return target(ctx, (prev) => {
          if (!prev.has(el)) return prev
          const next = new Set(prev)
          next.delete(el)
          return next
        })
      }, `${name}.delete`),
      clear: action((ctx) => {
        return target(ctx, (prev) => {
          if (prev.size === 0) return prev
          return new Set<T>()
        })
      }, `${name}.clear`),
      reset: action((ctx) => target(ctx, atomInitState), `${name}.reset`),
      intersection: action(
        (ctx, set) =>
          target(ctx, (prev) => (prev as ProposalSet<T>).intersection(set)),
        `${name}.intersection`,
      ),
      union: action(
        (ctx, set) =>
          target(ctx, (prev) => (prev as ProposalSet<T>).union(set)),
        `${name}.union`,
      ),
      difference: action(
        (ctx, set) =>
          target(ctx, (prev) => (prev as ProposalSet<T>).difference(set)),
        `${name}.difference`,
      ),
      symmetricDifference: action(
        (ctx, set) =>
          target(ctx, (prev) =>
            (prev as ProposalSet<T>).symmetricDifference(set),
          ),
        `${name}.symmetricDifference`,
      ),
      toggle: action((ctx, el) => {
        return target(ctx, (prev) => {
          if (!prev.has(el)) return new Set(prev).add(el)
          const next = new Set(prev)
          next.delete(el)
          return next
        })
      }, `${name}.toggle`),
      has: (ctx: Ctx, el: T) => ctx.get(target).has(el),
      isSubsetOf: (ctx: Ctx, set: Set<T>) =>
        (ctx.get(target) as ProposalSet<T>).isSubsetOf(set),
      isSupersetOf: (ctx: Ctx, set: Set<T>) =>
        (ctx.get(target) as ProposalSet<T>).isSupersetOf(set),
      isDisjointFrom: (ctx: Ctx, set: Set<T>) =>
        (ctx.get(target) as ProposalSet<T>).isDisjointFrom(set),
      size: (ctx: Ctx) => ctx.get(target).size,
      sizeAtom: atom((ctx) => ctx.spy(target).size, `${name}.size`),
    })),
  )
}
