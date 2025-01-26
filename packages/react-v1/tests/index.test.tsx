import React, { createContext } from 'react'
import { renderHook, act as actHooks } from '@testing-library/react-hooks'
import { render } from '@testing-library/react'
import { declareAction, declareAtom, createStore, Store } from '@reatom/core-v1'
import { expect, describe, test, vi, it, expectTypeOf } from 'vitest'
import { Provider as StoreProvider, useAtom, useAction, createActionHook, createAtomHook } from '../src/index'

const increment = declareAction()
const add = declareAction<number>()
const countAtom = declareAtom(['count'], 0, (on) => [
  on(increment, (state) => state + 1),
  on(add, (state, payload) => state + payload),
])

function Provider(props: { store: Store; children?: any }) {
  return <StoreProvider value={props.store}>{props.children}</StoreProvider>
}

describe('@reatom/react-v1', () => {
  describe('useAtom', () => {
    test('throw Error if provider is not set', () => {
      const { result } = renderHook(() => useAtom(countAtom))
      expect(result.error).toEqual(Error('[reatom] The provider is not defined'))
    })

    test('returns atom state', () => {
      const store = createStore(countAtom)

      const { result } = renderHook(() => useAtom(countAtom), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })
      expect(result.current).toBe(0)
    })

    test('subscribe once only at mount', () => {
      const store = createStore(null)
      const subscriber = vi.fn()
      store.subscribe = subscriber
      const { rerender } = renderHook(() => useAtom(countAtom), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(subscriber).toBeCalledTimes(1)

      rerender()
      expect(subscriber).toBeCalledTimes(1)
    })

    test('updates state after store change', async () => {
      const store = createStore(countAtom, { count: 10 })
      const { result } = renderHook(() => useAtom(countAtom), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(result.current).toBe(10)

      actHooks(() => store.dispatch(increment()))
      expect(result.current).toBe(11)

      actHooks(() => store.dispatch(increment()))
      expect(result.current).toBe(12)
    })

    test('updates dynamic atom state after props change', () => {
      const store = createStore(countAtom, { count: 10 })
      const { result, rerender } = renderHook(
        ({ multiplier }) => useAtom(countAtom, (count) => count * multiplier, [multiplier]),
        {
          initialProps: { multiplier: 2 },
          wrapper: (props) => <Provider {...props} store={store} />,
        },
      )

      expect(result.current).toBe(20)

      rerender({ multiplier: 3 })
      expect(result.current).toBe(30)
    })

    test('unsubscribes from previous dynamic atom', () => {
      const store = createStore(countAtom, { count: 10 })
      const subscriber = vi.fn()
      const _subscribe = store.subscribe
      store.subscribe = (atom) => _subscribe(atom, subscriber)

      const { rerender } = renderHook(
        ({ multiplier }) => useAtom(countAtom, (count) => count * multiplier, [multiplier]),
        {
          initialProps: { multiplier: 2 },
          wrapper: (props) => <Provider {...props} store={store} />,
        },
      )

      actHooks(() => store.dispatch(increment()))
      expect(subscriber).toBeCalledTimes(1)

      rerender({ multiplier: 3 })

      actHooks(() => store.dispatch(increment()))
      expect(subscriber).toBeCalledTimes(2)
    })

    test('does not rerender if atom value is not changing', () => {
      const store = createStore(countAtom, { count: 10 })
      const render = vi.fn()
      const useTest = () => {
        render()
        useAtom(countAtom, () => null, [])
      }
      renderHook(() => useTest(), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(render).toBeCalledTimes(1)
      actHooks(() => store.dispatch(increment()))
      expect(render).toBeCalledTimes(1)
    })

    test('does not recalculate selector on rerender if deps is not changing', () => {
      const store = createStore(countAtom, { count: 10 })
      const selector = vi.fn((v) => v)
      const { rerender } = renderHook(() => useAtom(countAtom, selector, []), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(selector).toBeCalledTimes(1)

      rerender()
      expect(selector).toBeCalledTimes(1)
    })

    test('unsubscribes from store after unmount', () => {
      const store = createStore(null)
      const _subscribe = store.subscribe
      const subscriber = vi.fn()
      store.subscribe = (atom) => _subscribe(atom, subscriber)

      const { unmount } = renderHook(() => useAtom(countAtom, () => null, []), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      actHooks(() => store.dispatch(increment()))
      expect(subscriber).toBeCalledTimes(1)

      unmount()

      actHooks(() => store.dispatch(increment()))
      expect(subscriber).toBeCalledTimes(1)
    })

    test('updates state if store instance has changed', () => {
      const store1 = createStore(null)
      const store2 = createStore(null)

      let store = store1
      const { result, rerender } = renderHook(() => useAtom(countAtom), {
        wrapper: (props) => {
          return <Provider {...props} store={store} />
        },
      })

      actHooks(() => store.dispatch(increment()))

      expect(result.current).toBe(1)

      store = store2
      rerender()

      expect(result.current).toBe(0)

      actHooks(() => store.dispatch(increment()))

      expect(result.current).toBe(1)
    })

    test('unsubscribes from previous store instance', () => {
      function getMocks(store: Store) {
        const subscribeMock = vi.fn()
        const unsubscribeMock = vi.fn()

        store.subscribe = () => {
          subscribeMock()

          return unsubscribeMock
        }

        return { subscribeMock, unsubscribeMock }
      }

      const store1 = createStore(null)
      const store2 = createStore(null)

      const { subscribeMock: subscribe1, unsubscribeMock: unsubscribe1 } = getMocks(store1)
      const { subscribeMock: subscribe2, unsubscribeMock: unsubscribe2 } = getMocks(store2)

      let store = store1
      const { rerender } = renderHook(() => useAtom(countAtom), {
        wrapper: (props) => {
          return <Provider {...props} store={store} />
        },
      })

      expect(subscribe1).toBeCalledTimes(1)
      expect(unsubscribe1).toBeCalledTimes(0)

      expect(subscribe2).toBeCalledTimes(0)
      expect(unsubscribe2).toBeCalledTimes(0)

      store = store2
      rerender()

      expect(subscribe1).toBeCalledTimes(1)
      expect(unsubscribe1).toBeCalledTimes(1)

      expect(subscribe2).toBeCalledTimes(1)
      expect(unsubscribe2).toBeCalledTimes(0)
    })

    /** github.com/facebook/react/issues/14259#issuecomment-439632622 */
    test.skip('filter unnecessary updates', () => {
      const action = declareAction()
      const atom1 = declareAtom(0, (on) => [on(action, (s) => s + 1)])
      const atom2 = declareAtom(0, (on) => [on(action, (s) => s + 1)])

      const store = createStore()

      let rerenders = 0
      let datas = []

      function Component() {
        datas = [useAtom(atom1), useAtom(atom2)]

        rerenders++

        return null
      }

      render(
        <Provider store={store}>
          <Component />
        </Provider>,
      )

      expect(rerenders).toBe(1)
      expect(datas).toEqual([0, 0])

      // DO NOT use `act` here for prevent batching
      store.dispatch(action())

      expect(rerenders).toBe(2)
      expect(datas).toEqual([1, 1])
    })
  })

  describe('useAction', () => {
    test('throw Error if provider is not set', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      const { result } = renderHook(() => useAtom())
      expect(result.error).toEqual(Error('[reatom] The provider is not defined'))
    })

    test('returns binded action to dispatch', () => {
      const store = createStore(countAtom)
      const { result } = renderHook(() => useAction(increment), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(store.getState(countAtom)).toBe(0)
      result.current()
      expect(store.getState(countAtom)).toBe(1)
    })

    test('returns binded action wrapper to dispatch', () => {
      const store = createStore(countAtom)
      const { result } = renderHook(() => useAction((p: number) => add(p * 2)), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(store.getState(countAtom)).toBe(0)

      result.current(2)
      expect(store.getState(countAtom)).toBe(4)
    })

    test('updates action wrapper after props change', () => {
      const store = createStore(null)
      const dispatch = vi.fn()
      store.dispatch = dispatch

      const { rerender, result } = renderHook(
        ({ multiplier }) => useAction((count: number) => add(count * multiplier), [multiplier]),
        {
          wrapper: (props) => <Provider {...props} store={store} />,
          initialProps: { multiplier: 2 },
        },
      )

      result.current(10)
      expect(dispatch).toBeCalledWith(add(20))

      rerender({ multiplier: 3 })

      result.current(10)
      expect(dispatch).toBeCalledWith(add(30))
    })

    test('updates action wrapper if store instance has changed', () => {
      const store1 = createStore(null)
      const store2 = createStore(null)

      const dispatch1 = vi.fn()
      store1.dispatch = dispatch1

      const dispatch2 = vi.fn()
      store2.dispatch = dispatch2

      let store = store1
      const { rerender, result } = renderHook(() => useAction(increment), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(dispatch1).toBeCalledTimes(0)
      expect(dispatch2).toBeCalledTimes(0)

      result.current()

      expect(dispatch1).toBeCalledTimes(1)
      expect(dispatch2).toBeCalledTimes(0)

      store = store2
      rerender()

      result.current()

      expect(dispatch1).toBeCalledTimes(1)
      expect(dispatch2).toBeCalledTimes(1)
    })
  })

  describe('useAction type tests', () => {
    it('should handle basic action creator', () => {
      const store = createStore()
      const a = declareAction()

      const { result } = renderHook(() => useAction(a), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expectTypeOf(result.current).toBeFunction()
      expectTypeOf(result.current).parameters.toEqualTypeOf<[]>()
      expectTypeOf(result.current).returns.toEqualTypeOf<void>()
    })

    it('should handle action creator with primitive payload', () => {
      const store = createStore()
      const ap = declareAction<0>()

      const { result } = renderHook(() => useAction(ap), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })
      const { result: result2 } = renderHook(() => useAction(() => ap(0)), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expectTypeOf(result.current).parameters.toEqualTypeOf<[0]>()
      expectTypeOf(result2.current).parameters.toEqualTypeOf<[]>()
    })

    it('should handle action creator with complex payload', () => {
      const store = createStore()
      const aop = declareAction<{ a: string; b: number; c: boolean }>()

      const { result } = renderHook(
        () => useAction(useAction((a: string, b: number, c: boolean = false) => aop({ a, b, c }))),
        {
          wrapper: (props) => <Provider {...props} store={store} />,
        },
      )

      expectTypeOf(result.current).parameters.toEqualTypeOf<[a: string, b: number, c?: boolean]>()
      expectTypeOf(result.current).returns.toEqualTypeOf<void>()
    })

    it('should handle generic payload types', () => {
      const store = createStore()
      const ap = declareAction<0>()

      const { result } = renderHook(() => useAction<0>((v) => ap(v)), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expectTypeOf(result.current).parameters.toEqualTypeOf<[0]>()
    })

    it('should handle conditional action returns', () => {
      const store = createStore()
      const a = declareAction()
      const ap = declareAction<0>()

      const { result } = renderHook(
        () =>
          useAction(() => {
            if (Math.random()) return ap(0)
            if (Math.random()) return a()
            return undefined
          }),
        {
          wrapper: (props) => <Provider {...props} store={store} />,
        },
      )

      expectTypeOf(result.current).parameters.toEqualTypeOf<[]>()
      expectTypeOf(result.current).returns.toEqualTypeOf<void>()
    })

    it('should enforce action return types', () => {
      const store = createStore()
      // @ts-expect-error
      const { result } = renderHook(() => useAction(() => 123), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expectTypeOf(result.current).returns.toEqualTypeOf<void>()
    })
  })

  describe('createActionHook', () => {
    test(`calls the correct store's dispatch function`, () => {
      const NestedContext = createContext(null)
      const useCustomAction = createActionHook(NestedContext)

      const store1 = createStore(null)
      const dispatch1 = vi.fn()
      store1.dispatch = dispatch1

      const store2 = createStore(null)
      const dispatch2 = vi.fn()
      store2.dispatch = dispatch2

      const { result } = renderHook(
        () => ({
          act1: useAction(increment),
          act2: useCustomAction(increment),
        }),
        {
          wrapper: (props) => (
            <Provider store={store1}>
              <NestedContext.Provider {...props} value={store2} />
            </Provider>
          ),
        },
      )

      actHooks(() => result.current.act1())

      expect(dispatch1).toHaveBeenCalledTimes(1)
      expect(dispatch2).toHaveBeenCalledTimes(0)

      actHooks(() => result.current.act2())

      expect(dispatch1).toHaveBeenCalledTimes(1)
      expect(dispatch2).toHaveBeenCalledTimes(1)
    })
  })

  describe('createAtomHook', () => {
    test(`returns the correct store's atom value`, () => {
      const NestedContext = createContext(null)
      const useCustomAtom = createAtomHook(NestedContext)

      const store1 = createStore(countAtom)
      const store2 = createStore(countAtom)

      const { result } = renderHook(
        () => ({
          atom1: useAtom(countAtom),
          atom2: useCustomAtom(countAtom),
        }),
        {
          wrapper: (props) => (
            <Provider store={store1}>
              <NestedContext.Provider {...props} value={store2} />
            </Provider>
          ),
        },
      )

      expect(result.current.atom1).toBe(0)
      expect(result.current.atom2).toBe(0)

      actHooks(() => store1.dispatch(increment()))

      expect(result.current.atom1).toBe(1)
      expect(result.current.atom2).toBe(0)

      actHooks(() => store2.dispatch(increment()))

      expect(result.current.atom1).toBe(1)
      expect(result.current.atom2).toBe(1)
    })
  })
})
