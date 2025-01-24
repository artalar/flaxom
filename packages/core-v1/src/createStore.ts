import * as v3 from '@reatom/core'
import { State, BaseAction } from './kernel'
import { throwError, safetyFunc, assign, getIsAtom, getIsAction, TREE } from './shared'
import { Action, actions, PayloadActionCreator } from './declareAction'
import { Atom, init, replace } from './declareAtom'

type ActionsSubscriber = (action: Action<unknown>, stateDiff: State) => any
type SubscribeFunction = {
  <T>(target: Atom<T> | PayloadActionCreator<T>, listener: (state: T) => any): () => void
  (listener: ActionsSubscriber): () => void
}
type GetStateFunction = {
  <T>(target: Atom<T>): T
  (): State
}

export type Store = {
  dispatch: <T>(action: Action<T>) => void
  subscribe: SubscribeFunction
  getState: GetStateFunction
  bind: <A extends (...a: any[]) => BaseAction>(
    a: A,
  ) => (...a: A extends (...a: infer Args) => any ? Args : never) => void
  v3ctx: v3.Ctx
}

export function createStore(initState?: State): Store
export function createStore(atom: Atom<any>, initState?: State): Store
// TODO: try to use ES6 Map's instead of plain object
// for prevent using `delete` operator
// (need perf tests)
export function createStore(atom?: Atom<any> | State, initState?: State, v3ctx = v3.createCtx()): Store {
  const activeAtoms = new Map<v3.Atom, number>()
  // @ts-expect-error
  v3ctx.cause[TREE] = activeAtoms
  let dispatchListeners: Function[] = []
  let nextDispatchListeners: Function[] = dispatchListeners
  let snapshot: State = {}

  if (atom !== undefined) {
    if (typeof atom === 'object' && initState === undefined) assign(snapshot, atom)
    else {
      if (!getIsAtom(atom)) throwError('Invalid atom')

      if (typeof initState === 'object' && initState !== null) {
        assign(snapshot, initState)
      } else if (initState !== undefined) {
        throwError('Invalid initial state')
      }

      subscribe(atom as Atom<any>, () => {})
      // @ts-ignore
      assign(snapshot, _getState())
    }
  }

  function ensureCanMutateNextDispatchListeners() {
    if (nextDispatchListeners === dispatchListeners) {
      nextDispatchListeners = dispatchListeners.slice()
    }
  }

  function _getState(): State
  function _getState<T>(target?: Atom<T>): State | T {
    if (target === undefined) {
      const result: v3.Rec = assign({}, snapshot)
      v3ctx.get((read) => {
        init.v3action(v3ctx, snapshot)
        activeAtoms.forEach((count, { __reatom: proto }) => {
          if (!proto.isAction) result[proto.name!] = read(proto)!.state
        })
      })
      // @ts-ignore
      return result
    }

    if (!getIsAtom(target)) throwError('Invalid target')

    return v3ctx.get(() => {
      init.v3action(v3ctx, snapshot)
      const state = v3ctx.get(target.v3atom)
      return state
    })
  }

  function subscribe(subscriber: ActionsSubscriber): () => void
  function subscribe<T>(target: Atom<T> | PayloadActionCreator<T>, subscriber: (state: T) => any): () => void
  function subscribe<T>(
    target: Atom<T> | PayloadActionCreator<T> | ActionsSubscriber,
    subscriber?: (state: T) => any,
  ): () => void {
    const listener = safetyFunc(subscriber || target, 'listener')
    let isSubscribed = true
    let skipFirst = true

    if (subscriber === undefined) {
      if (getIsAtom(listener) || getIsAction(listener)) throwError('Invalid listener')

      ensureCanMutateNextDispatchListeners()
      nextDispatchListeners.push(listener)
      return () => {
        if (!isSubscribed) return
        isSubscribed = false
        ensureCanMutateNextDispatchListeners()
        nextDispatchListeners.splice(nextDispatchListeners.indexOf(listener), 1)
      }
    }

    if (!getIsAtom(target) && !getIsAction(target)) throwError('Invalid subscription target')

    const { v3atom, v3action }: { v3atom?: v3.Atom; v3action?: v3.Action } = target as any

    if (v3action) {
      return v3ctx.subscribe(v3action, (calls) => {
        if (skipFirst) return (skipFirst = false)
        if (calls.length > 0) subscriber(calls.at(-1)!.payload)
      })
    }

    if (v3atom) {
      let un = v3ctx.get(() => {
        init.v3action(v3ctx, snapshot)
        return v3ctx.subscribe(v3atom, (v) => {
          if (skipFirst) return (skipFirst = false)
          subscriber(v)
        })
      })
      return () => {
        if (!isSubscribed) return
        isSubscribed = false
        un()
      }
    }

    throwError('Invalid subscription target')
  }

  function dispatch(action: Action<any>) {
    if (!action.v3action) {
      const registeredAction = actions.get(action.type) as v3.Fn
      if (!registeredAction) {
        throwError('Unregistered action, use "declareAction" first')
      }
      action = assign(registeredAction(action.payload), action)
    }

    const { type, payload, reactions, v3action } = action
    if (typeof action !== 'object' || action === null || typeof type !== 'string') {
      throwError('Invalid action')
    }

    const stateNew: v3.Rec = {}
    const un = v3ctx.subscribe((logs) => {
      logs.forEach((patch) => {
        if (!patch.proto.isAction) stateNew[patch.proto.name!] = patch.state
      })
    })

    v3ctx.get((read, actualize) => {
      v3ctx.schedule(un, -1)
      v3action(v3ctx, payload, reactions)
      if (v3action === init.v3action) replace(v3ctx, payload)
    })

    un()

    callFromList((dispatchListeners = nextDispatchListeners), action, stateNew)
  }

  const bind: Store['bind'] =
    (actionCreator) =>
    (...a) =>
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      store.dispatch(actionCreator(...a))

  const store = {
    getState: _getState,
    subscribe,
    dispatch,
    bind,
    v3ctx,
  }

  // @ts-expect-error
  v3ctx.cause.v1store = store

  return store
}

function callFromList(list: Function[], ...arg: any[]) {
  let i = -1
  while (++i < list.length) list[i]!(...arg)
}
