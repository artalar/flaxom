import * as v3 from '@reatom/core'
import { throwReatomError } from '@reatom/core'
import { getRootCause, spyChange } from '@reatom/hooks'

import {
  Action,
  ActionCreator,
  Atom,
  AtomBinded,
  Cache,
  CacheReducer,
  defaultStore,
  Fn,
  isActionCreator,
  isAtom,
  isFunction,
  isString,
  OmitValues,
  pushUnique,
  Store,
  Rec,
  Track,
  TrackReducer,
  Transaction,
  ActionCreatorBinded,
} from './internal'

export type AtomSelfBinded<
  State = any,
  Deps extends Rec<PayloadMapper | Atom> = Rec<PayloadMapper | Atom>,
> = AtomBinded<State> & {
  [K in keyof Deps]: Deps[K] extends Atom
    ? never
    : Deps[K] extends ActionCreator
    ? never
    : K extends `_${string}`
    ? never
    : ActionCreator<Parameters<Deps[K]>, { payload: ReturnType<Deps[K]> }> & {
        dispatch: (...args: Parameters<Deps[K]>) => Action<ReturnType<Deps[K]>>
      }
}

export type AtomOptions<State = any> =
  | Atom[`id`]
  | {
      id?: Atom[`id`]
      decorators?: Array<AtomDecorator<State>>
      store?: Store
      v3atom?: v3.Atom
    }

export type AtomDecorator<State> = Fn<
  [cacheReducer: CacheReducer<State>],
  CacheReducer<State>
>

type PayloadMapper = Fn

let atomsCount = 0
export function createAtom<
  State,
  Deps extends Rec<PayloadMapper | Atom | ActionCreator>,
>(
  dependencies: Deps,
  reducer: TrackReducer<State, Deps>,
  options: AtomOptions<State> = {},
): AtomSelfBinded<State, OmitValues<Deps, Atom | ActionCreator>> {
  let {
    // decorators = [],
    v3atom,
    id = v3atom?.__reatom.name ?? `atom${++atomsCount}`,
    store = defaultStore,
  } = isString(options)
    ? ({ id: options } as Exclude<AtomOptions<State>, string>)
    : options
  const trackedTypes: Array<string> = []
  const types: Array<string> = []
  const actionCreators: Rec<ActionCreator> = {}
  const externalActions: Rec<ActionCreator> = {}

  throwReatomError(!isFunction(reducer) || !isString(id), 'atom arguments')

  Object.entries(dependencies).forEach(([name, dep]) => {
    throwReatomError(
      !isFunction(dep),
      `Invalid atom dependencies (type ${typeof dep}) at ${name}`,
    )

    if (isAtom(dep)) {
      dep.types.forEach((type) => pushUnique(types, type))
    } else {
      let type: string

      if (isActionCreator(dep)) {
        type = (externalActions[name] = dep).type
      } else {
        type = `${name}_${id}`

        // @ts-expect-error
        const actionCreator: ActionCreatorBinded = (...a: any[]) => ({
          payload: dep(...a),
          type,
          targets: [atom],
          v3action: actionCreator.v3action,
        })
        actionCreator.type = type
        actionCreator.dispatch = (...a: any[]) =>
          store.dispatch(actionCreator(...a))
        actionCreator.v3action = v3.action(type)

        actionCreators[name] = actionCreator

        if (name[0] != `_`) {
          // @ts-expect-error
          atom[name] = actionCreator
        }
      }

      pushUnique(trackedTypes, type)
      pushUnique(types, type)
    }
  })

  // const cacheReducer = decorators.reduce(
  //   (acc, decorator) => decorator(acc),
  //   createDynamicallyTrackedCacheReducer<State, Deps>(
  //     reducer,
  //     dependencies,
  //     trackedTypes,
  //     actionCreators,
  //     externalActions,
  //   ),
  // )
  const cacheReducer = createDynamicallyTrackedCacheReducer<State, Deps>(
    reducer,
    dependencies,
    trackedTypes,
    actionCreators,
    externalActions,
  )

  function atom(
    transaction: Transaction,
    // cache: CacheTemplate<State> = createTemplateCache(atom),
  ): Cache<State> {
    // return cacheReducer(transaction, cache)

    return transaction.v3ctx.get(atom.v3atom)
  }

  atom.id = id

  atom.getState = () => store.getState(atom)

  atom.subscribe = (cb: Fn) => store.subscribe(atom, cb)

  atom.types = types

  atom.v3atom = v3atom ?? v3.atom(cacheReducer, id)

  // @ts-expect-error
  atom.v3atom.__reatom.v2atom = atom

  // @ts-expect-error
  return atom
}

const ctxs = new WeakMap<v3.Ctx['cause'], WeakMap<Fn, Rec>>()

function createDynamicallyTrackedCacheReducer<
  State,
  Deps extends Rec<PayloadMapper | Atom>,
>(
  reducer: TrackReducer<State, Deps>,
  dependencies: Deps,
  trackedTypes: Array<string>,
  actionCreators: Rec<ActionCreator>,
  externalActions: Rec<ActionCreator>,
) {
  const create: Track<Deps>[`create`] = (name, ...args) =>
    // @ts-expect-error
    actionCreators[name as string](...args)

  return (v3ctx: v3.CtxSpy, state?: any): any => {
    const rootCause = getRootCause(v3ctx.cause)
    if (!ctxs.has(rootCause)) ctxs.set(rootCause, new WeakMap())
    if (!ctxs.get(rootCause)!.has(reducer))
      ctxs.get(rootCause)!.set(reducer, {})
    const ctx = ctxs.get(rootCause)!.get(reducer)!

    const get: Track<Deps>[`get`] = (name) =>
      v3ctx.spy((dependencies[name as string] as Atom).v3atom)

    const getUnlistedState: Track<Deps>[`getUnlistedState`] = (targetAtom) =>
      v3ctx.get(targetAtom.v3atom)

    const onAction: Track<Deps>[`onAction`] = (name, reaction) => {
      const ac =
        externalActions[name as string] ?? actionCreators[name as string]

      throwReatomError(ac === undefined, `Unknown action`)

      spyChange(v3ctx, ac!.v3action, ({ payload }) => {
        reaction(payload)
      })
    }

    const onChange: Track<Deps>[`onChange`] = (name, reaction) => {
      const depAtom = dependencies[name] as Atom

      spyChange(v3ctx, depAtom.v3atom, (prev, next) => reaction(prev, next))
    }

    const onInit: Track<Deps>[`onInit`] = (cb) => {
      v3ctx.get((read) => read(v3ctx.cause!.proto)) || cb()
    }

    const schedule: Track<Deps>[`schedule`] = (effect) =>
      v3ctx.schedule(
        () =>
          effect(
            // @ts-expect-error
            getRootCause(v3ctx.cause).v2store.dispatch,
            ctx,
            [],
          ),
        2,
      )

    const track: Track<Deps> = {
      create,
      get,
      getUnlistedState,
      onAction,
      onChange,
      onInit,
      schedule,
      v3ctx,
    }

    // @ts-expect-error
    state = reducer(track, state)

    return state!
  }
}
