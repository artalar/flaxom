import React, { useMemo, useEffect } from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { render } from '@testing-library/react'
import { act } from 'react-test-renderer'
import { declareAction, declareAtom, createStore, Store } from '@reatom/core'
import { context, useAtom, useAction } from '../index'

const increment = declareAction()
const add = declareAction<number>()
const countAtom = declareAtom(['count'], 0, on => [
  on(increment, state => state + 1),
  on(add, (state, payload) => state + payload),
])

function Provider(props: { store: Store; children?: any }) {
  return (
    <context.Provider value={props.store}>{props.children}</context.Provider>
  )
}

describe('@reatom/react', () => {
  describe('useAtom', () => {
    test('throw Error if provider is not set', () => {
      const { result } = renderHook(() => useAtom(countAtom))
      expect(result.error).toEqual(
        Error('[reatom] The provider is not defined'),
      )
    })

    test('returns atom state', () => {
      const store = createStore(countAtom)

      const { result } = renderHook(() => useAtom(countAtom), {
        wrapper: props => <Provider {...props} store={store} />,
      })
      expect(result.current).toBe(0)
    })

    test('subscribe once only at mount', () => {
      const store = createStore(null)
      const subscriber = jest.fn()
      store.subscribe = subscriber
      const { rerender } = renderHook(() => useAtom(countAtom), {
        wrapper: props => <Provider {...props} store={store} />,
      })

      expect(subscriber).toBeCalledTimes(1)

      rerender()
      expect(subscriber).toBeCalledTimes(1)
    })

    test('updates state after store change', async () => {
      const store = createStore(countAtom, { count: 10 })
      const { result } = renderHook(() => useAtom(countAtom), {
        wrapper: props => <Provider {...props} store={store} />,
      })

      expect(result.current).toBe(10)

      act(() => store.dispatch(increment()))
      expect(result.current).toBe(11)

      act(() => store.dispatch(increment()))
      expect(result.current).toBe(12)
    })

    test('updates dynamic atom state after props change', () => {
      const store = createStore(countAtom, { count: 10 })
      const { result, rerender } = renderHook(
        ({ multiplier }) =>
          useAtom(countAtom, count => count * multiplier, [multiplier]),
        {
          initialProps: { multiplier: 2 },
          wrapper: props => <Provider {...props} store={store} />,
        },
      )

      expect(result.current).toBe(20)

      rerender({ multiplier: 3 })
      expect(result.current).toBe(30)
    })

    test('unsubscribes from previous dynamic atom', () => {
      const store = createStore(countAtom, { count: 10 })
      const subscriber = jest.fn()
      const _subscribe = store.subscribe
      // @ts-ignore
      store.subscribe = atom => _subscribe(atom, subscriber)

      const { rerender } = renderHook(
        ({ multiplier }) =>
          useAtom(countAtom, count => count * multiplier, [multiplier]),
        {
          initialProps: { multiplier: 2 },
          wrapper: props => <Provider {...props} store={store} />,
        },
      )

      act(() => store.dispatch(increment()))
      expect(subscriber).toBeCalledTimes(1)

      rerender({ multiplier: 3 })

      act(() => store.dispatch(increment()))
      expect(subscriber).toBeCalledTimes(2)
    })

    test('does not rerender if atom value is not changing', () => {
      const store = createStore(countAtom, { count: 10 })
      const render = jest.fn()
      const useTest = () => {
        render()
        useAtom(countAtom, () => null, [])
      }
      renderHook(() => useTest(), {
        wrapper: props => <Provider {...props} store={store} />,
      })

      act(() => store.dispatch(increment()))
      expect(render).toBeCalledTimes(1)
    })

    test('unsubscribes from store after unmount', () => {
      const store = createStore(null)
      const _subscribe = store.subscribe
      const subscriber = jest.fn()
      // @ts-ignore
      store.subscribe = atom => _subscribe(atom, subscriber)

      const { unmount } = renderHook(() => useAtom(countAtom, () => null, []), {
        wrapper: props => <Provider {...props} store={store} />,
      })

      act(() => store.dispatch(increment()))
      expect(subscriber).toBeCalledTimes(1)

      unmount()

      act(() => store.dispatch(increment()))
      expect(subscriber).toBeCalledTimes(1)
    })
  })

  describe('useAction', () => {
    test('returns binded action to dispatch', () => {
      const store = createStore(countAtom)
      const { result } = renderHook(() => useAction(increment), {
        wrapper: props => <Provider {...props} store={store} />,
      })

      expect(store.getState(countAtom)).toBe(0)
      result.current()
      expect(store.getState(countAtom)).toBe(1)
    })

    test('returns binded action wrapper to dispatch', () => {
      const store = createStore(countAtom)
      const { result } = renderHook(
        () => useAction((p: number) => add(p * 2)),
        {
          wrapper: props => <Provider {...props} store={store} />,
        },
      )

      expect(store.getState(countAtom)).toBe(0)

      result.current(2)
      expect(store.getState(countAtom)).toBe(4)
    })

    test('updates action wrapper after props change', () => {
      const store = createStore(null)
      const dispatch = jest.fn()
      store.dispatch = dispatch

      const { rerender, result } = renderHook(
        ({ multiplier }) =>
          useAction((count: number) => add(count * multiplier), [multiplier]),
        {
          wrapper: props => <Provider {...props} store={store} />,
          initialProps: { multiplier: 2 },
        },
      )

      result.current(10)
      expect(dispatch).toBeCalledWith(add(20))

      rerender({ multiplier: 3 })

      result.current(10)
      expect(dispatch).toBeCalledWith(add(30))
    })
  })
})
