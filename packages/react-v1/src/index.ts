import {
  createContext,
  useEffect,
  useRef,
  useReducer,
  useContext,
  useCallback,
  Reducer,
  Context,
} from 'react'

import { Store, Atom, Action } from '@reatom/core-v1'

function noop() {}

export const context = createContext<Store | null>(null)

export const { Provider } = context

function useForceUpdate() {
  // dispatch don't have action and don't changes between rerenders
  return useReducer<Reducer<number, null>>((s) => s + 1, 0)[1] as () => void
}

const lifeCycleStatus = {
  init: 'init',
  upToDate: 'upToDate',
  outOfDate: 'outOfDate',
} as const

const defaultMapper = (atomValue: any) => atomValue

/**
 * @param ctx react context for your store.
 * @returns A `useAtom` hook bound to the context.
 */
export function createAtomHook(ctx: Context<Store | null> = context) {
  function useAtom<T>(atom: Atom<T>): T
  function useAtom<TI, TO = TI>(
    atom: Atom<TI>,
    selector: (atomValue: TI) => TO,
    deps: any[],
  ): TO
  function useAtom<TI, TO = TI>(
    atom: Atom<TI>,
    selector: (atomValue: TI) => TO = defaultMapper,
    deps: any[] = [],
  ): TO {
    const forceUpdate = useForceUpdate()
    const store = useContext(ctx)
    if (!store) throw new Error('[reatom] The provider is not defined')

    const { current: that } = useRef({
      store,
      atom: undefined as any as Atom<TI>,
      selector,
      deps,
      atomValue: undefined as any as TI,
      selectorValue: undefined as any as TO,
      unsubscribe: noop,
      mountStatus: lifeCycleStatus.init as keyof typeof lifeCycleStatus,
    })
    that.selector = selector

    if (store !== that.store || atom !== that.atom) {
      that.store = store
      that.atom = atom
      that.deps = deps
      that.unsubscribe()
      that.unsubscribe = store.subscribe(that.atom, (atomValue: any) => {
        if (Object.is(that.atomValue, atomValue)) return
        that.atomValue = atomValue

        const selectorValue = that.selector(atomValue)
        if (Object.is(selectorValue, that.selectorValue)) return
        that.selectorValue = selectorValue

        if (that.mountStatus === lifeCycleStatus.init) {
          that.mountStatus = lifeCycleStatus.outOfDate
        } else {
          forceUpdate()
        }
      })
      that.atomValue = that.store.getState(atom)
      that.selectorValue = that.selector(that.atomValue)
    } else {
      const atomValue = that.store.getState(that.atom)
      if (
        !Object.is(atomValue, that.atomValue) ||
        deps.length !== that.deps.length ||
        deps.some((d, i) => !Object.is(d, that.deps[i]))
      ) {
        that.deps = deps
        that.atomValue = atomValue
        that.selectorValue = that.selector(that.atomValue)
      }
    }

    useEffect(() => {
      if (that.mountStatus === lifeCycleStatus.outOfDate) {
        that.mountStatus = lifeCycleStatus.upToDate
        forceUpdate()
      }
      that.mountStatus = lifeCycleStatus.upToDate

      return () => that.unsubscribe()
    }, [])

    return that.selectorValue as TO
  }

  return useAtom
}

/**
 * @param atom target atom for subscription
 * @param selector (optional)
 * @param deps (optional)
 * @returns atom value
 */
export const useAtom = createAtomHook()

type AnyActionCreator = (...args: any[]) => Action<any> | void

let batch = (cb: () => void) => cb()

export const setupBatch = (newBatch: typeof batch) => {
  batch = newBatch
}

/**
 * @param ctx react context for your store.
 * @returns A `useAction` hook bound to the context.
 */
export function createActionHook(ctx: Context<Store | null> = context) {
  function useAction<AC extends AnyActionCreator>(
    cb: AC,
    deps?: any[],
  ): (...args: Parameters<AC>) => void
  function useAction(cb: () => Action<any> | void, deps?: any[]): () => void
  function useAction<T>(
    cb: (a: T) => Action<any> | void,
    deps?: any[],
  ): (payload: T) => void
  function useAction(
    cb: AnyActionCreator,
    deps: any[] = [],
  ): (...args: any[]) => void {
    const store = useContext(ctx)
    if (!store) throw new Error('[reatom] The provider is not defined')
    if (typeof cb !== 'function') {
      throw new TypeError('[reatom] `useAction` argument must be a function')
    }

    return useCallback((...args) => {
      const action = cb(...args)
      if (action) {
        const storeFixed = Object.assign({}, store, {
          dispatch(nextAction: Action<any>) {
            const actionFixed = Object.assign({}, nextAction, {
              reactions: (nextAction.reactions || []).map(
                (reaction) => (payload: any) => reaction(payload, storeFixed),
              ),
            })

            batch(() => store.dispatch(actionFixed))
          },
        })

        storeFixed.dispatch(action)
      }
    }, deps.concat(store))
  }

  return useAction
}

/**
 * @param cb actionCreator (may return void for preventing dispatch)
 * @param deps
 */
export const useAction = createActionHook()
