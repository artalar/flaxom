import { it, expect, describe } from 'vitest'
import { atom } from '@reatom/core'
import { Atom, createAtom, createStore, Fn, getState, Rec, callSafety, defaultStore } from '../'
import { createNumberAtom, createPrimitiveAtom } from '../primitives'

import { mockFn, parseCauses, sleep } from '../test_utils'

function init(atoms: Array<Atom>, store = defaultStore) {
  const unsubscribers = atoms.map((atom) => store.subscribe(atom, () => {}))
  return () => unsubscribers.forEach((un) => un())
}

describe('core-v2', () => {
  it('displayName', () => {
    const firstNameAtom = createPrimitiveAtom(
      'John',
      {
        set: (state, name: string) => name,
      },
      `firstName`,
    )

    const lastNameAtom = createAtom(
      {},
      ($, state = 'Doe') => {
        return state
      },
      `lastName`,
    )

    const isFirstNameShortAtom = createAtom(
      { firstNameAtom },
      ({ get }) => {
        return get(`firstNameAtom`).length < 10
      },
      `isFirstNameShort`,
    )

    const fullNameAtom = createAtom(
      { firstNameAtom, lastNameAtom },
      ({ get }) => `${get(`firstNameAtom`)} ${get(`lastNameAtom`)}`,
      `fullName`,
    )

    const displayNameAtom = createAtom(
      { isFirstNameShortAtom, fullNameAtom, firstNameAtom },
      ({ get }) => (get(`isFirstNameShortAtom`) ? get(`fullNameAtom`) : get(`firstNameAtom`)),
      `displayName`,
    )

    const store = createStore()

    const cb = mockFn()

    store.subscribe(displayNameAtom, cb)

    expect(cb.calls.length).toEqual(1)
    expect(cb.lastInput()).toEqual('John Doe')

    store.dispatch(firstNameAtom.set('John'))
    expect(cb.calls.length).toEqual(1)
    expect(cb.lastInput()).toEqual('John Doe')

    store.dispatch(firstNameAtom.set('Joe'))
    expect(cb.calls.length).toEqual(2)
    expect(cb.lastInput()).toEqual('Joe Doe')

    store.dispatch(firstNameAtom.set('Joooooooooooooooooooe'))
    expect(cb.calls.length).toEqual(3)
    expect(cb.lastInput()).toEqual('Joooooooooooooooooooe')

    store.dispatch(firstNameAtom.set('Joooooooooooooooooooe'))
    expect(cb.calls.length).toEqual(3)
    expect(cb.lastInput()).toEqual('Joooooooooooooooooooe')
  })

  it('combine', () => {
    const aAtom = createPrimitiveAtom(0)
    const bAtom = createAtom({ aAtom }, ({ get }) => get('aAtom') % 2)
    const cAtom = createAtom({ aAtom }, ({ get }) => get('aAtom') % 2)
    const bcAtom = createAtom({ b: bAtom, c: cAtom }, ({ get }) => ({
      b: get('b'),
      c: get('c'),
    }))
    const store = createStore()

    init([bcAtom], store)

    const bsState1 = store.getState(bcAtom)
    expect(store.getState(aAtom)).toBe(0)
    expect(bsState1).toEqual({ b: 0, c: 0 })

    store.dispatch(aAtom.change((s) => s + 1))
    const bsState2 = store.getState(bcAtom)
    expect(store.getState(aAtom)).toBe(1)
    expect(bsState2).toEqual({ b: 1, c: 1 })

    store.dispatch(aAtom.change((s) => s + 2))
    const bsState3 = store.getState(bcAtom)
    expect(store.getState(aAtom)).toBe(3)
    expect(bsState3).toEqual({ b: 1, c: 1 })
    expect(bsState2).toBe(bsState3)
  })

  it('atom external action subscribe', () => {
    const a1 = createAtom({ add: (value: number) => value }, (track, state = 0) => {
      track.onAction('add', (value: number) => {
        state += value
      })
      return state
    })

    const a2 = createAtom({ add: (value: number) => value }, (track, state = 0) => {
      track.onAction('add', (value: number) => {
        state += value
      })
      return state
    })

    const store = createStore()
    init([a1, a2], store)

    expect(store.getState(a1)).toBe(0)
    expect(store.getState(a2)).toBe(0)

    store.dispatch(a1.add(10))

    expect(store.getState(a1)).toBe(10)
    expect(store.getState(a2)).toBe(0)
  })

  it.skip('atom filter', () => {
    const track = mockFn()
    const a1Atom = createPrimitiveAtom(0, null, 'a1Atom')
    const a2Atom = createPrimitiveAtom(0, null, 'a2Atom')
    const bAtom = createAtom({ a1Atom, a2Atom }, ({ get, onChange }, s = 0) => {
      track()

      const a = get('a1Atom')
      if (a % 2) s = a

      onChange('a2Atom', (v) => (s = v))

      return s
    })

    const bCache1 = bAtom(createTransaction([]))
    expect(track.calls.length).toBe(1)
    expect(bCache1.state).toBe(0)

    const bCache2 = bAtom(createTransaction([]), bCache1)
    expect(track.calls.length).toBe(1)
    expect(bCache1).toBe(bCache2)

    const bCache3 = bAtom(createTransaction([a1Atom.set(0)]), bCache2)
    expect(track.calls.length).toBe(1)
    expect(bCache2).toBe(bCache3)
    expect(bCache3.state).toBe(0)
    expect(bCache2.state).toBe(bCache3.state)

    const bCache4 = bAtom(createTransaction([a1Atom.set(1)]), bCache3)
    expect(track.calls.length).toBe(2)
    expect(bCache3).not.toBe(bCache4)
    expect(bCache4.state).toBe(1)
    expect(bCache3.state).not.toBe(bCache4.state)

    const bCache5 = bAtom(createTransaction([a1Atom.change((s) => s + 2)]), bCache4)
    expect(track.calls.length).toBe(3)
    expect(bCache4).not.toBe(bCache5)
    expect(bCache5.state).toBe(3)
    expect(bCache4.state).not.toBe(bCache5.state)
  })

  it.skip('in atom action effect', async () => {
    function createResource<I, O>(fetcher: (params: I) => Promise<O>, id: string) {
      const resourceAtom = createAtom(
        {
          request: (payload: I) => payload,
          response: (payload: O | Error) => payload,
        },
        ({ create, onAction, schedule }, state = null as null | O | Error) => {
          onAction('request', (payload: I) => {
            schedule((dispatch) =>
              fetcher(payload)
                .then((data) => dispatch(create('response', data)))
                .catch((e) => dispatch(create('response', e instanceof Error ? e : new Error(e)))),
            )
          })

          onAction('response', (payload: O | Error) => {
            state = payload
          })

          return state
        },
        id,
      )

      return resourceAtom
    }

    const dataAtom = createResource((params: void) => Promise.resolve([]), 'data')
    const cb = mockFn()

    const store = createStore()

    store.subscribe(dataAtom, cb)
    expect(cb.calls.length).toBe(1)
    expect(cb.lastInput()).toBe(null)

    store.dispatch(dataAtom.request())
    expect(cb.calls.length).toBe(1)
    await sleep()
    expect(cb.calls.length).toBe(2)
    expect(cb.lastInput()).toEqual([])

    expect(parseCauses(cb.lastInput(1))).toEqual([
      'DISPATCH: request_data',
      'request (request_data) handler',
      'DISPATCH: response_data',
      'response_data action',
    ])
  })

  it.skip('Atom store dependency states', () => {
    const aTrack = mockFn()
    const noopAction = () => ({ type: 'noop', payload: null })
    const aAtom = createAtom({ inc: () => null }, ({ onAction }, state = 1) => {
      aTrack()
      onAction('inc', () => (state += 1))
      return state
    })
    const bAtom = createAtom({ aAtom }, ({ get }) => get('aAtom') + 1)

    const bCache1 = bAtom(createTransaction([noopAction()]))
    expect(aTrack.calls.length).toBe(1)

    const bCache2 = bAtom(createTransaction([noopAction()]), bCache1)
    expect(aTrack.calls.length).toBe(1)
    expect(bCache1).toBe(bCache2)

    expect(bCache2.state).toBe(2)
    const bCache3 = bAtom(createTransaction([aAtom.inc()]), bCache1)
    expect(aTrack.calls.length).toBe(2)
    expect(bCache3.state).toBe(3)
  })

  it.skip('Atom from', () => {
    const a = createPrimitiveAtom(42)

    expect(a(createTransaction([{ type: 'noooop', payload: null }])).state).toBe(42)
    expect(a(createTransaction([a.set(43)])).state).toBe(43)
    expect(a(createTransaction([a.change((s) => s + 2)])).state).toBe(44)
  })

  it.skip('Persist', () => {
    const snapshot: Rec = { TEST: 42 }
    const persist = createPersist({ get: (key) => snapshot[key] })
    const a = createPrimitiveAtom(0, null, {
      id: 'TEST',
      decorators: [persist()],
    })

    const { state } = a(createTransaction([]))

    expect(state).toBe(42)
  })

  it('Batched dispatch', () => {
    const a = createPrimitiveAtom(0)
    const store = createStore()
    const cb = mockFn()

    store.subscribe(a, cb)

    expect(cb.calls.length).toBe(1)

    store.dispatch([a.change((s) => s + 1), a.change((s) => s + 1)])
    expect(cb.calls.length).toBe(2)
    expect(cb.lastInput()).toBe(2)
  })

  it('Manage dynamic dependencies', () => {
    let reducerCalls = 0
    const a = createPrimitiveAtom(0)
    const b = createAtom(
      { add: (atom: Atom) => atom },
      ({ onAction, getUnlistedState }, state = new Array<readonly [Atom, any]>()) => {
        reducerCalls++

        onAction('add', (atom) => (state = [...state, [atom, getUnlistedState(atom)]]))
        return state
      },
    )
    const store = createStore()

    init([b], store)
    expect(reducerCalls).toBe(1)

    store.dispatch([b.add(a), a.set(1)])
    expect(store.getState(b)).toEqual([[a, 1]])
    expect(reducerCalls).toBe(2)
  })

  it('await all effect', async () => {
    function createCallSafetyTracked(cb: Fn) {
      let count = 0
      const callSafetyTracked: typeof callSafety = (...a: any[]) => {
        const result: any = callSafety(...a)

        if (result instanceof Promise) {
          count++
          result.finally(() => --count === 0 && cb())
        }

        return result
      }
      return callSafetyTracked
    }

    const resourceDataAtom = createPrimitiveAtom(0)
    const resourceAtom = createAtom(
      { resourceDataAtom, doA: () => null, doB: () => null },
      ({ create, get, onAction, schedule }) => {
        onAction('doA', () =>
          schedule(async (dispatch) => {
            await sleep(10)
            await dispatch(create('doB'))
          }),
        )

        onAction('doB', () =>
          schedule(async (dispatch) => {
            await sleep(10)
            await dispatch(resourceDataAtom.change((s) => s + 1))
          }),
        )

        return get('resourceDataAtom')
      },
    )

    const cb = mockFn()
    const callSafetyTracked = createCallSafetyTracked(cb)
    const store = createStore({ callSafety: callSafetyTracked })

    init([resourceAtom], store)

    store.dispatch(resourceAtom.doA())

    expect(cb.calls.length).toBe(0)

    await sleep(10)

    expect(cb.calls.length).toBe(0)

    await sleep(10)

    expect(cb.calls.length).toBe(1)
  })

  it('subscription to in-cache atom', () => {
    const a = createPrimitiveAtom(0)
    const b = createAtom({ a }, ({ get }) => get('a'))

    const trackA = mockFn()
    const trackB = mockFn()

    b.subscribe(trackB)

    expect(trackA.calls.length).toBe(0)
    expect(trackB.calls.length).toBe(1)

    a.change.dispatch((s) => s + 1)
    expect(trackB.calls.length).toBe(2)

    a.subscribe(trackA)
    expect(trackA.calls.length).toBe(1)
    expect(trackB.calls.length).toBe(2)

    a.change.dispatch((s) => s + 1)
    expect(trackA.calls.length).toBe(2)
    expect(trackB.calls.length).toBe(3)
  })

  it('getState of stale atom', () => {
    const a = createPrimitiveAtom(0)
    const b = createAtom({ a }, ({ get }) => get('a'))

    const store = createStore()

    const un = store.subscribe(b, () => {})

    expect(getState(a, store)).toBe(0)
    expect(getState(b, store)).toBe(0)

    store.dispatch(a.set(1))
    expect(getState(a, store)).toBe(1)
    expect(getState(b, store)).toBe(1)

    un()
    store.dispatch(a.set(2))
    expect(getState(a, store)).toBe(2)
    expect(getState(b, store)).toBe(2)
  })

  it.skip('subscription call cause', () => {
    const counterAtom = createAtom(
      { inc: () => null, add: (v: number) => v },
      ({ onAction }, counter = 1) => {
        onAction('inc', () => counter++)
        onAction('add', (v) => (counter += v))
        return counter
      },
      'counter',
    )
    const counterIsEvenAtom = createAtom({ counterAtom }, ({ get }) => get('counterAtom') % 2 === 0, 'counterIsEven')
    const counterIsHugeAtom = createAtom({ counterAtom }, ({ get }) => get('counterAtom') > 10_000, 'counterIsHuge')
    const titleAtom = createAtom(
      { counterIsEvenAtom, counterIsHugeAtom },
      ({ onChange }, title = 'counter') => {
        onChange('counterIsEvenAtom', () => (title = 'counter is even'))
        onChange('counterIsHugeAtom', () => (title = 'counter is huge'))
        return title
      },
      'title',
    )

    const store = createStore()
    const cb = mockFn()

    store.subscribe(titleAtom, cb)

    store.dispatch(counterAtom.inc())
    expect(parseCauses(cb.lastInput(1))).toEqual(['DISPATCH: inc_counter', 'counterIsEven atom'])

    store.dispatch(counterAtom.add(100_000))
    expect(parseCauses(cb.lastInput(1))).toEqual(['DISPATCH: add_counter', 'counterIsHuge atom'])
  })

  it.skip('createTemplateCache', () => {
    const atomWithoutSnapshot = createNumberAtom(0)
    const atomWithSnapshot = createNumberAtom(0)

    const snapshot = { [atomWithSnapshot.id]: 42 }

    const store = createStore({
      createTemplateCache: (atom) => Object.assign(createTemplateCache(atom), { state: snapshot[atom.id] }),
    })

    expect(store.getState(atomWithoutSnapshot)).toBe(0)
    expect(store.getState(atomWithSnapshot)).toBe(42)
  })

  it.skip('onPatch / onError', () => {
    const a = createPrimitiveAtom(0)
    const b = createAtom({ a }, (track) => {
      const state = track.get('a')
      if (state % 2) throw new Error('test')
      return state
    })
    const store = createStore()
    const listener = mockFn()
    const onError = mockFn()
    const onPatch = mockFn()
    store.subscribe(b, listener)
    store.onError(onError)
    store.onPatch(onPatch)

    store.dispatch(a.set(2))

    expect(listener.lastInput()).toBe(2)
    expect(onPatch.calls.length).toBe(1)

    let error: any
    try {
      store.dispatch(a.set(1))
    } catch (e) {
      error = e
    }

    expect(onError.lastInput()).toBe(error)
    expect(error.message).toBe('test')
    expect(listener.lastInput()).toBe(2)
    expect(onPatch.calls.length).toBe(1)
    expect(store.getCache(a)!.state).toBe(2)
  })

  it('State updates order', async () => {
    const a = createAtom({ setB: () => null, _setC: () => null }, ({ onAction, schedule, create }, state = 'a') => {
      onAction('setB', () => {
        state = 'b'
        schedule((dispatch) => {
          dispatch(create('_setC'))
        })
      })

      onAction('_setC', () => {
        state = 'c'
      })

      return state
    })

    const store = createStore()
    const listener = mockFn()
    store.subscribe(a, listener)
    store.dispatch(a.setB())

    await sleep()

    expect(listener.calls.map((c) => c.i[0])).toEqual(['a', 'c'])
  })

  it('v3', () => {
    const a = atom(0)
    const b = createAtom({}, (track) => track.v3ctx.spy(a))
    const store = createStore()
    const listener = mockFn()

    store.subscribe(b, listener)
    expect(listener.lastInput()).toBe(0)

    a(store.v3ctx, 1)
    expect(listener.lastInput()).toBe(1)
  })
})
