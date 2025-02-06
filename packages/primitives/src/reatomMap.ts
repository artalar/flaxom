import { Action, action, Atom, atom, AtomMut, Ctx } from '@reatom/core'
import { withAssign } from './withAssign'
import { select } from '@reatom/lens'

export interface MapAtom<Key, Value> extends AtomMut<Map<Key, Value>> {
  get: (ctx: Ctx, key: Key) => Value | undefined
  getOrCreate: (ctx: Ctx, key: Key, creator: () => Value) => Value
  has: (ctx: Ctx, key: Key) => boolean
  set: Action<[key: Key, value: Value], Map<Key, Value>>
  delete: Action<[key: Key], Map<Key, Value>>
  clear: Action<[], Map<Key, Value>>
  reset: Action<[], Map<Key, Value>>
  sizeAtom: Atom<number>
  entries: Action<[], IterableIterator<[Key, Value]>>
  keys: Action<[], IterableIterator<Key>>
  values: Action<[], IterableIterator<Value>>
}

export const reatomMap = <Key, Value>(
  initState = new Map<Key, Value>(),
  name?: string,
): MapAtom<Key, Value> =>
  atom(initState, name).pipe(
    withAssign((target, name) => {
      const getOrCreate = action((ctx, key: Key, value: Value) => {
        actions.set(ctx, key, value)
        return value
      }, `${name}.getOrCreate`)

      const actions = {
        get: (ctx: Ctx, key: Key) => ctx.get(target).get(key),
        getOrCreate: (ctx: Ctx, key: Key, creator: () => Value) =>
          actions.has(ctx, key)
            ? actions.get(ctx, key)!
            : getOrCreate(ctx, key, creator()),
        has: (ctx: Ctx, key: Key) => ctx.get(target).has(key),
        set: action(
          (ctx, key: Key, value: Value) =>
            target(ctx, (prev) => {
              const valuePrev = prev.get(key)
              return Object.is(valuePrev, value) &&
                (value !== undefined || prev.has(key))
                ? prev
                : new Map(prev).set(key, value)
            }),
          `${name}.set`,
        ),
        delete: action(
          (ctx, key: Key) =>
            target(ctx, (prev) => {
              if (!prev.has(key)) return prev
              const next = new Map(prev)
              next.delete(key)
              return next
            }),
          `${name}.delete`,
        ),
        clear: action((ctx) => target(ctx, new Map()), `${name}.clear`),
        reset: action((ctx) => target(ctx, initState), `${name}.reset`),
        sizeAtom: atom(ctx => select(ctx, (ctx) => ctx.spy(target).size), `${name}.size`),
        entries: action((ctx) => ctx.get(target).entries(), `${name}.entries`),
        keys: action((ctx) => ctx.get(target).keys(), `${name}.keys`),
        values: action((ctx) => ctx.get(target).values(), `${name}.values`),
      }

      return actions
    }),
  )
