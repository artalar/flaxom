import {
  Action,
  Atom,
  AtomState,
  createAtom,
  defaultStore,
  Fn,
  getState,
  isActionCreator,
  Rec,
  Store,
} from '@reatom/core-v2/'
import React from 'react'

export const reatomContext = React.createContext(defaultStore)

let batchedUpdates = (f: () => any) => f()
export const setBatchedUpdates = (f: (callback: () => any) => void) => {
  batchedUpdates = f
}

function bindActionCreator<Args extends any[]>(
  store: Store,
  actionCreator: (...args: Args) => Action | Action[] | void,
) {
  return (...args: Args) => {
    const action = actionCreator(...args)

    if (action) {
      batchedUpdates(() => {
        store.dispatch(action)
      })
    }
  }
}

export function useAction<Args extends any[] = []>(
  actionCreator: (...args: Args) => Action | Action[] | void,
  deps: any[] = [],
): (...args: Args) => void {
  const store = React.useContext(reatomContext)

  return React.useCallback(bindActionCreator(store, actionCreator), deps.concat(store))
}

type ActionCreators<T extends Rec = {}> = {
  [K in keyof T]: T[K] extends (...a: infer Args) => Action ? (...args: Args) => void : never
}

export function useAtom<T extends Atom>(
  atom: T,
  deps?: any[],
): [state: AtomState<T>, bindedActionCreators: ActionCreators<T>]
export function useAtom<T extends Atom, Res>(
  atom: T,
  map: Fn<[AtomState<T>], Res>,
  deps?: any[],
): [state: Res, bindedActionCreators: ActionCreators<T>]
export function useAtom(atom: Atom, mapOrDeps?: Fn | any[], deps?: any[]) {
  const origin = atom
  if (typeof mapOrDeps === 'function') {
    deps ??= []
    // FIXME: rewrite to useState
    atom = React.useMemo(() => createAtom({ origin }, ({ get }) => mapOrDeps(get(`origin`))), deps.concat(origin))
  } else {
    deps = mapOrDeps ?? []
  }

  const store = React.useContext(reatomContext)

  deps = deps.concat([atom, store])

  let [state, setState] = React.useState(() => getState(atom, store))
  const lastRef = React.useRef(state)
  lastRef.current = state = getState(atom, store)

  const bindedActionCreators = React.useMemo(
    () =>
      Object.entries(origin).reduce((acc, [k, ac]) => {
        // @ts-expect-error
        if (isActionCreator(ac)) acc[k] = bindActionCreator(store, ac)
        return acc
      }, {} as ActionCreators),
    deps,
  )

  React.useEffect(() => {
    return store.subscribe(
      atom,
      (newState) => Object.is(newState, lastRef.current) || setState((lastRef.current = newState)),
    )
  }, deps)

  React.useDebugValue(state)

  return [state, bindedActionCreators]
}
