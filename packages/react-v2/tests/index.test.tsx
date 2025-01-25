import React from 'react'
import { renderHook, act as actHooks } from '@testing-library/react-hooks'
import { render, act as actReact } from '@testing-library/react'
import { createAtom, createStore, Store } from '@reatom/core-v2'
import { createPrimitiveAtom } from '@reatom/core-v2/primitives'
import { reatomContext, useAtom, useAction, setBatchedUpdates } from '../src'
import { describe, test, expect, vi } from 'vitest'
import { noop } from '@reatom/utils'

setBatchedUpdates(actReact)

const StoreProvider = reatomContext.Provider

const countAtom = createPrimitiveAtom(1, {
  inc: (state) => state + 1,
  add: (state, value: number) => state + value,
})

function Provider(props: { store: Store; children?: any }) {
  return <StoreProvider value={props.store}>{props.children}</StoreProvider>
}

describe('@reatom/react-v2', () => {
  describe('useAtom', () => {
    test('returns atom state', () => {
      const store = createStore()
      store.subscribe(countAtom, () => {})

      const { result } = renderHook(() => useAtom(countAtom), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })
      expect(result.current[0]).toBe(1)
    })

    test('subscribe once only at mount', () => {
      const store = createStore()
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
      const store = createStore()
      store.subscribe(countAtom, noop)
      const { result } = renderHook(() => useAtom(countAtom), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(result.current[0]).toBe(1)

      actHooks(() => store.dispatch(countAtom.inc()))
      expect(result.current[0]).toBe(2)

      actHooks(() => store.dispatch(countAtom.add(2)))
      expect(result.current[0]).toBe(4)
    })

    test('updates dynamic atom state after props change', () => {
      const store = createStore()
      store.subscribe(countAtom, noop)
      const { result, rerender } = renderHook(
        ({ multiplier }) => useAtom(countAtom, (count) => count * multiplier, [multiplier]),
        {
          initialProps: { multiplier: 2 },
          wrapper: (props) => <Provider {...props} store={store} />,
        },
      )

      expect(result.current[0]).toBe(2)

      rerender({ multiplier: 3 })
      expect(result.current[0]).toBe(3)
    })

    test('unsubscribes from previous dynamic atom', () => {
      const store = createStore()
      store.subscribe(countAtom, noop)
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

      expect(subscriber).toBeCalledTimes(1)
      actHooks(() => store.dispatch(countAtom.inc()))
      expect(subscriber).toBeCalledTimes(2)
      actHooks(() => store.dispatch(countAtom.inc()))
      expect(subscriber).toBeCalledTimes(3)

      rerender({ multiplier: 3 })

      expect(subscriber).toBeCalledTimes(4)
      actHooks(() => store.dispatch(countAtom.inc()))
      expect(subscriber).toBeCalledTimes(5)
      actHooks(() => store.dispatch(countAtom.inc()))
      expect(subscriber).toBeCalledTimes(6)
    })

    test('does not rerender if atom value is not changing', () => {
      const store = createStore()
      store.subscribe(countAtom, noop)
      const render = vi.fn()
      const useTest = () => {
        render()
        useAtom(countAtom, () => null, [])
      }
      renderHook(() => useTest(), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(render).toBeCalledTimes(1)
      actHooks(() => store.dispatch(countAtom.inc()))
      expect(render).toBeCalledTimes(1)
    })

    test('does not recalculate selector on rerender if deps is not changing', () => {
      const store = createStore()
      store.subscribe(countAtom, noop)
      const selector = vi.fn((v) => v)
      const { rerender } = renderHook(() => useAtom(countAtom, selector, []), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(selector).toBeCalledTimes(1)

      rerender()
      expect(selector).toBeCalledTimes(1)
    })

    test('unsubscribes from store after unmount', () => {
      const store = createStore()
      const _subscribe = store.subscribe
      const subscriber = vi.fn()
      store.subscribe = (atom) => _subscribe(atom, subscriber)

      const { unmount } = renderHook(() => useAtom(countAtom, () => null, []), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      actHooks(() => store.dispatch(countAtom.inc()))
      expect(subscriber).toBeCalledTimes(1)

      unmount()

      actHooks(() => store.dispatch(countAtom.inc()))
      expect(subscriber).toBeCalledTimes(1)
    })

    test('updates state if store instance has changed', () => {
      const store1 = createStore()
      const store2 = createStore()

      let store = store1
      const { result, rerender } = renderHook(() => useAtom(countAtom), {
        wrapper: (props) => {
          return <Provider {...props} store={store} />
        },
      })

      actHooks(() => store.dispatch(countAtom.inc()))

      expect(result.current[0]).toBe(2)

      store = store2
      rerender()

      expect(result.current[0]).toBe(1)

      actHooks(() => store.dispatch(countAtom.inc()))

      expect(result.current[0]).toBe(2)
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

      const store1 = createStore()
      const store2 = createStore()

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
    test('filter unnecessary updates', () => {
      const atom1 = createPrimitiveAtom(0, { inc: (state) => state + 1 })
      const atom2 = createAtom({ inc: atom1.inc }, (track, state = 0) => {
        track.onAction(`inc`, () => state++)
        return state
      })

      const store = createStore()

      let rerenders = 0
      let datas: any[] = []

      function Component() {
        datas = [useAtom(atom1)[0], useAtom(atom2)[0]]

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
      store.dispatch(atom1.inc())

      expect(rerenders).toBe(2)
      expect(datas).toEqual([1, 1])
    })
  })

  describe('useAction', () => {
    test('returns binded action to dispatch', () => {
      const store = createStore()
      store.subscribe(countAtom, noop)
      const { result } = renderHook(() => useAction(countAtom.inc), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(store.getState(countAtom)).toBe(1)
      result.current()
      expect(store.getState(countAtom)).toBe(2)
    })

    test('returns binded action wrapper to dispatch', () => {
      const store = createStore()
      store.subscribe(countAtom, noop)
      const { result } = renderHook(() => useAction((p: number) => countAtom.add(p * 2)), {
        wrapper: (props) => <Provider {...props} store={store} />,
      })

      expect(store.getState(countAtom)).toBe(1)

      result.current(2)
      expect(store.getState(countAtom)).toBe(5)
    })

    test('updates action wrapper after props change', () => {
      const store = createStore()
      const dispatch = vi.fn()
      store.dispatch = dispatch

      const { rerender, result } = renderHook(
        ({ multiplier }) => useAction((count: number) => countAtom.add(count * multiplier), [multiplier]),
        {
          wrapper: (props) => <Provider {...props} store={store} />,
          initialProps: { multiplier: 2 },
        },
      )

      result.current(10)
      expect(dispatch).toBeCalledWith(countAtom.add(20))

      rerender({ multiplier: 3 })

      result.current(10)
      expect(dispatch).toBeCalledWith(countAtom.add(30))
    })

    test('updates action wrapper if store instance has changed', () => {
      const store1 = createStore()
      const store2 = createStore()

      const dispatch1 = vi.fn()
      store1.dispatch = dispatch1

      const dispatch2 = vi.fn()
      store2.dispatch = dispatch2

      let store = store1
      const { rerender, result } = renderHook(() => useAction(countAtom.inc), {
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

  // describe('createActionHook', () => {
  //   test(`calls the correct store's dispatch function`, () => {
  //     const NestedContext = createContext(null)
  //     const useCustomAction = createActionHook(NestedContext)

  //     const store1 = createStore()
  //     const dispatch1 = vi.fn()
  //     store1.dispatch = dispatch1

  //     const store2 = createStore()
  //     const dispatch2 = vi.fn()
  //     store2.dispatch = dispatch2

  //     const { result } = renderHook(
  //       () => ({
  //         act1: useAction(increment),
  //         act2: useCustomAction(increment),
  //       }),
  //       {
  //         wrapper: (props) => (
  //           <Provider store={store1}>
  //             <NestedContext.Provider {...props} value={store2} />
  //           </Provider>
  //         ),
  //       },
  //     )

  //     actHooks(() => result.current.act1())

  //     expect(dispatch1).toHaveBeenCalledTimes(1)
  //     expect(dispatch2).toHaveBeenCalledTimes(0)

  //     actHooks(() => result.current.act2())

  //     expect(dispatch1).toHaveBeenCalledTimes(1)
  //     expect(dispatch2).toHaveBeenCalledTimes(1)
  //   })
  // })

  // describe('createAtomHook', () => {
  //   test(`returns the correct store's atom value`, () => {
  //     const NestedContext = createContext(null)
  //     const useCustomAtom = createAtomHook(NestedContext)

  //     const store1 = createStore(countAtom)
  //     const store2 = createStore(countAtom)

  //     const { result } = renderHook(
  //       () => ({
  //         atom1: useAtom(countAtom),
  //         atom2: useCustomAtom(countAtom),
  //       }),
  //       {
  //         wrapper: (props) => (
  //           <Provider store={store1}>
  //             <NestedContext.Provider {...props} value={store2} />
  //           </Provider>
  //         ),
  //       },
  //     )

  //     expect(result.current.atom1).toBe(0)
  //     expect(result.current.atom2).toBe(0)

  //     actHooks(() => store1.dispatch(countAtom.inc()))

  //     expect(result.current.atom1).toBe(1)
  //     expect(result.current.atom2).toBe(0)

  //     actHooks(() => store2.dispatch(countAtom.inc()))

  //     expect(result.current.atom1).toBe(1)
  //     expect(result.current.atom2).toBe(1)
  //   })
  // })
})
