import { describe, test, expect, vi } from 'vitest'
import { mockFn } from '@reatom/testing'
import * as v3 from '@reatom/core'

import {
  declareAction,
  declareAtom,
  getState,
  map,
  combine,
  createStore,
  getTree,
  getIsAction,
  getIsAtom,
  initAction,
  getDepsShape,
  v3toV1,
} from './'

import { Atom } from '@reatom/core'

function noop() {}

test('main api, getIsAction', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  expect(getIsAction()).toBe(false)
  expect(getIsAction(null)).toBe(false)
  expect(getIsAction({})).toBe(false)
  expect(getIsAction(declareAction())).toBe(true)
  expect(getIsAction(declareAtom(0, noop))).toBe(false)
})

test('main api, getIsAtom', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  expect(getIsAtom()).toBe(false)
  expect(getIsAtom(null)).toBe(false)
  expect(getIsAtom({})).toBe(false)
  expect(getIsAtom(declareAtom(0, noop))).toBe(true)
  expect(getIsAtom(declareAction())).toBe(false)
})

test('main api, declareAction', () => {
  expect(typeof declareAction() === 'function').toBe(true)
  const actionCreator = declareAction()
  const action = actionCreator()
  expect(action.type).toBe(actionCreator.getType())
  expect(action.payload).toBeUndefined()
  declareAction('TeSt')().type //?
  expect(declareAction('TeSt')().type.includes('TeSt')).toBe(true)

  {
    const action = declareAction(['TeSt'])()
    expect(action.type === 'TeSt' && 'payload' in action).toBeTruthy()
  }
})

test('main api, declareAtom, basics', () => {
  const name = '_atomName_'
  const initialState = {}
  const atom = declareAtom(name, initialState, () => {})
  const state = atom({}, initAction)

  expect(getState(state, atom)).toBe(initialState)
  expect(
    (() => {
      const keys = Object.keys(state)
      return keys.length === 1 && keys[0]!.includes(name)
    })(),
  ).toBeTruthy()
  expect(declareAtom([name], initialState, () => {})()).toEqual({
    [name]: initialState,
  })
})

test('main api, declareAtom, strict uid', () => {
  const addUnderscore = declareAction()
  const atom1 = declareAtom(['name1'], '1', (on) => [on(addUnderscore, (state) => `_${state}`)])
  const atom2 = declareAtom(['name2'], '2', (on) => [on(addUnderscore, (state) => `_${state}`)])
  const atomRoot = combine([atom1, atom2])

  let state = atomRoot()
  expect(state).toEqual({
    name1: '1',
    name2: '2',
    [getTree(atomRoot).id]: ['1', '2'],
  })

  state = atomRoot(state, addUnderscore())
  expect(state).toEqual({
    name1: '_1',
    name2: '_2',
    [getTree(atomRoot).id]: ['_1', '_2'],
  })
})

test('main api, declareAtom, throw error if declareAtom called with an undefined initial state', () => {
  const run = () => declareAtom(['test'], undefined, () => [])

  expect(run).toThrow(`[reatom] Atom "test". Initial state can't be undefined`)
})

test('main api, declareAtom, throw error if atom produced undefined value', () => {
  const action = declareAction()

  expect(() => declareAtom(['myAtom'], {}, (on) => on(action, () => undefined as any))({}, action())).toThrow(
    '[reatom] Invalid state. Reducer number 1 in "myAtom" atom returns undefined',
  )

  expect(() =>
    declareAtom(['test'], 0, (on) => [on(declareAction(), () => 0), on(action, () => undefined as any)])({}, action()),
  ).toThrow('[reatom] Invalid state. Reducer number 2 in "test" atom returns undefined')
})

test('main api, declareAtom, reducers collisions', () => {
  const increment = declareAction()

  const counter = declareAtom(0, (on) => [
    on(increment, (state) => state + 1),
    on(increment, (state) => state + 1),
    on(increment, (state) => state + 1),
  ])

  const store = createStore(counter)
  const sideEffect = mockFn()
  store.subscribe(counter, sideEffect)

  expect(sideEffect.calls.length).toBe(0)

  store.dispatch(increment())
  expect(sideEffect.calls.length).toBe(1)
  expect(sideEffect.lastInput()).toBe(3)
})

test('main api, createStore', () => {
  const increment = declareAction('increment')
  const toggle = declareAction()

  const count = declareAtom('count', 0, (on) => [on(increment, (state) => state + 1)])
  const countDoubled = map('count/map', count, (state) => state * 2)
  const toggled = declareAtom('toggled', false, (on) => on(toggle, (state) => !state))

  const root = combine('combine', { count, countDoubled, toggled })
  const store = createStore(root)

  expect(store.getState(root)).toEqual({
    count: 0,
    countDoubled: 0,
    toggled: false,
  })
  expect(store.getState(countDoubled)).toBe(0)
  expect(store.getState(count)).toBe(0)

  store.dispatch(increment())
  expect(store.getState(root)).toEqual({
    count: 1,
    countDoubled: 2,
    toggled: false,
  })
  expect(store.getState(countDoubled)).toBe(2)
  expect(store.getState(count)).toBe(1)

  const storeSubscriber = mockFn()
  const subscriberToggled = mockFn()
  store.subscribe(storeSubscriber)
  store.subscribe(toggled, subscriberToggled)
  expect(storeSubscriber.calls.length).toBe(0)
  expect(subscriberToggled.calls.length).toBe(0)

  store.dispatch(increment())
  expect(store.getState(root)).toEqual({
    count: 2,
    countDoubled: 4,
    toggled: false,
  })
  expect(storeSubscriber.calls.length).toBe(1)
  expect(subscriberToggled.calls.length).toBe(0)

  store.dispatch(toggle())
  expect(store.getState(root)).toEqual({
    count: 2,
    countDoubled: 4,
    toggled: true,
  })
  expect(storeSubscriber.calls.length).toBe(2)
  expect(subscriberToggled.calls.length).toBe(1)
})

test('main api, createStore lazy selectors', () => {
  const storeSubscriber = mockFn()
  const subscriberCount1 = mockFn()
  const count2Subscriber1 = mockFn()
  const count2Subscriber2 = mockFn()
  const increment = declareAction('increment')
  const set = declareAction<number>('set')

  const count1 = declareAtom(0, (on) => on(increment, (state) => state + 1))
  const count2SetMap = mockFn((state, payload) => payload)
  const count2 = declareAtom(0, (on) => [on(increment, (state) => state + 1), on(set, count2SetMap)])

  const root = combine({ count1 })
  const store = createStore(root)

  store.subscribe(storeSubscriber)
  store.subscribe(count1, subscriberCount1)

  store.dispatch(increment())
  expect(storeSubscriber.calls.length).toBe(1)
  expect(subscriberCount1.calls.length).toBe(1)

  store.dispatch(set(1))
  expect(storeSubscriber.calls.length).toBe(2)
  expect(subscriberCount1.calls.length).toBe(1)
  expect(count2SetMap.calls.length).toBe(0)

  expect(store.getState(count2)).toBe(0)
  const count2Unsubscriber1 = store.subscribe(count2, count2Subscriber1)
  const count2Unsubscriber2 = store.subscribe(count2, count2Subscriber2)
  expect(store.getState(count2)).toBe(0)

  store.dispatch(increment())
  expect(store.getState(count2)).toBe(1)
  expect(storeSubscriber.calls.length).toBe(3)
  expect(subscriberCount1.calls.length).toBe(2)
  expect(count2Subscriber1.calls[0]?.i[0]).toBe(1)
  expect(count2Subscriber2.calls.length).toBe(1)
  expect(count2SetMap.calls.length).toBe(0)

  store.dispatch(set(5))
  expect(store.getState(count2)).toBe(5)
  expect(storeSubscriber.calls.length).toBe(4)
  expect(subscriberCount1.calls.length).toBe(2)
  expect(count2Subscriber1.calls.length).toBe(2)
  expect(count2Subscriber1.calls[1]?.i[0]).toBe(5)
  expect(count2Subscriber2.calls.length).toBe(2)
  expect(count2SetMap.calls.length).toBe(1)

  count2Unsubscriber1()
  store.dispatch(set(10))
  expect(storeSubscriber.calls.length).toBe(5)
  expect(store.getState(count2)).toBe(10)
  expect(count2SetMap.calls.length).toBe(2)
  expect(count2Subscriber1.calls.length).toBe(2)
  expect(count2Subscriber2.calls.length).toBe(3)

  count2Unsubscriber2()
  expect(store.getState(count2)).toBe(0)
  store.dispatch(set(15))
  expect(storeSubscriber.calls.length).toBe(6)
  expect(store.getState(count2)).toBe(0)
  expect(count2Subscriber2.calls.length).toBe(3)
  expect(count2SetMap.calls.length).toBe(2)
})

test('main api, createStore lazy computed', () => {
  const storeSubscriber = mockFn()
  const increment1 = declareAction()
  const increment2 = declareAction()

  const count1 = declareAtom(0, (on) => on(increment1, (state) => state + 1))
  const count1Doubled = map(count1, (payload) => payload * 2)
  const count2 = declareAtom(0, (on) => on(increment2, (state) => state + 1))
  const count2Doubled = map(count2, (payload) => payload * 2)

  const root = combine({ count1 })
  const store = createStore(root)
  store.subscribe(storeSubscriber)

  store.dispatch(increment1())
  expect(store.getState(count1)).toBe(1)
  expect(store.getState(count1Doubled)).toBe(2)
  expect(store.getState(count2)).toBe(0)
  expect(store.getState(count2Doubled)).toBe(0)

  store.subscribe(count2Doubled, () => {})
  store.dispatch(increment2())
  expect(store.getState(count2)).toBe(1)
  expect(store.getState(count2Doubled)).toBe(2)
})

test('main api, createStore lazy resubscribes', () => {
  const storeSubscriber = mockFn()
  const increment = declareAction()

  const count = declareAtom('count', 0, (on) => on(increment, (state) => state + 1))
  const countDoubled = map(['countDoubled'], count, (payload) => payload * 2)
  const root = combine({ count })

  const store = createStore(root)
  store.subscribe(storeSubscriber)

  store.dispatch(increment())
  expect(store.getState(count)).toBe(1)
  expect(store.getState().countDoubled).toBeUndefined()

  let unsubscriber = store.subscribe(countDoubled, () => {})
  store.dispatch(increment())
  expect(store.getState(count)).toBe(2)
  expect(store.getState().countDoubled).toBe(4)

  unsubscriber()
  store.dispatch(increment())
  expect(store.getState(count)).toBe(3)
  expect(store.getState().countDoubled).toBeUndefined()

  unsubscriber = store.subscribe(countDoubled, () => {})
  store.dispatch(increment())
  expect(store.getState(count)).toBe(4)
  expect(store.getState().countDoubled).toBe(8)
})

test('main api, createStore lazy derived resubscribes', () => {
  const increment = declareAction()
  const count = declareAtom(['count'], 0, (on) => on(increment, (state) => state + 1))
  const root = combine(['root'], { count })

  const store = createStore()
  const unsubscribe = store.subscribe(root, () => {})

  store.dispatch(increment())
  expect(store.getState().count).toBe(1)

  unsubscribe()
  expect(store.getState().count).toBeUndefined()
})

test('main api, createStore with undefined atom', () => {
  const increment = declareAction()
  const countStatic = declareAtom(['countStatic'], 0, (on) => on(increment, (state) => state + 1))

  const store = createStore({ countStatic: 10 })
  store.dispatch(increment())

  expect(store.getState(countStatic)).toBe(10)

  store.subscribe(countStatic, () => {})
  store.dispatch(increment())

  expect(store.getState(countStatic)).toBe(11)
})

test('main api, createStore with undefined atom and state', () => {
  const store = createStore()
  expect(store.getState()).toEqual({})
})

test('main api, createStore preloaded state', () => {
  const increment = declareAction()
  const staticCount = declareAtom(['staticCount'], 0, (on) => on(increment, (state) => state + 1))
  const dynamicCount = declareAtom(['dynamicCount'], 0, (on) => on(increment, (state) => state + 1))
  const root = combine(['staticRoot'], { staticCount })

  const storeWithoutPreloadedState = createStore(root)
  expect(storeWithoutPreloadedState.getState()).toEqual({
    staticCount: 0,
    staticRoot: { staticCount: 0 },
  })
  expect(storeWithoutPreloadedState.getState(staticCount)).toBe(0)
  expect(storeWithoutPreloadedState.getState(dynamicCount)).toBe(0)

  const storeWithPreloadedState = createStore(root, {
    staticCount: 1,
    staticRoot: { staticCount: 1 },
    dynamicCount: 2,
  })

  expect(storeWithPreloadedState.getState()).toEqual({
    staticCount: 1,
    staticRoot: { staticCount: 1 },
    dynamicCount: 2,
  })
  expect(storeWithPreloadedState.getState(staticCount)).toBe(1)
  expect(storeWithPreloadedState.getState(dynamicCount)).toBe(2)
})

test('main api, createStore reactions state diff', () => {
  const increment1 = declareAction()
  const increment2 = declareAction()

  const count1Atom = declareAtom(0, (on) => on(increment1, (s) => s + 1))
  const count2Atom = declareAtom(0, (on) => on(increment2, (s) => s + 1))
  const store = createStore()
  store.subscribe(count1Atom, noop)
  store.subscribe(count2Atom, noop)

  const reaction = mockFn()
  store.subscribe(reaction)

  let action = declareAction()()
  store.dispatch(action)

  expect([reaction.lastInput(0), reaction.lastInput(1)]).toEqual([action, {}])

  action = increment1()
  store.dispatch(action)
  expect([reaction.lastInput(0), reaction.lastInput(1)]).toEqual([
    action,
    {
      [getTree(count1Atom).id]: 1,
    },
  ])

  action = increment2()
  store.dispatch(action)
  expect([reaction.lastInput(0), reaction.lastInput(1)]).toEqual([
    action,
    {
      [getTree(count2Atom).id]: 1,
    },
  ])
})

test('main api, createStore subscribe to action', () => {
  const action = declareAction<null>()
  const trackAction = mockFn()
  const trackActions = mockFn()
  const store = createStore()

  store.subscribe(action, trackAction)
  store.subscribe(trackActions)

  store.dispatch(declareAction()())
  expect(trackAction.calls.length).toBe(0)
  expect(trackActions.calls.length).toBe(1)

  store.dispatch(action(null))
  expect(trackAction.calls.length).toBe(1)
  expect(trackAction.lastInput()).toBe(null)
  expect(trackActions.calls.length).toBe(2)
})

test('atom id as symbol', () => {
  const atom = declareAtom(['my atom'], 0, () => [])
  const atomMap = map(atom, (v) => v)
  const atomCombine = combine([atom, atomMap])

  expect(typeof getTree(declareAtom(0, () => [])).id).toBe('string')
  expect(getTree(atom).id).toBe('my atom')
  expect(typeof getTree(atomMap).id).toBe('symbol')
  expect(getTree(atomMap).id.toString()).toBe('Symbol(my atom [map])')
  expect(typeof getTree(atomCombine).id).toBe('symbol')
  expect(getTree(atomCombine).id.toString()).toBe('Symbol([my atom,my atom [map]])')
  expect(
    getTree(
      map(
        declareAtom(Symbol('123'), 0, () => []),
        (v) => v,
      ),
    ).id.toString(),
  ).toBe('Symbol(123 [map])')
})

test('API atom initialization in createStore', () => {
  class Api {}
  const api = new Api()
  const mockApi = new Api()
  const apiAtom = declareAtom(Symbol('API'), api, () => [])
  let store

  store = createStore(apiAtom)
  expect(store.getState()).toEqual({
    [getTree(apiAtom).id]: api,
  })

  store = createStore({ [getTree(apiAtom).id]: mockApi })
  expect(store.getState(apiAtom)).toBe(mockApi)
  expect(JSON.stringify(store.getState())).toBe('{}')
})

test('createStore replace state', () => {
  const increment = declareAction()
  const countAtom = declareAtom(0, (on) => [on(increment, (state) => state + 1)])
  const listener = mockFn()
  const store = createStore(countAtom)

  store.subscribe(countAtom, listener)

  expect(store.getState(countAtom)).toBe(0)

  store.dispatch(increment())
  store.dispatch(increment())
  const state = store.getState()

  expect(store.getState(countAtom)).toBe(2)
  expect(listener.lastInput()).toBe(2)

  store.dispatch(increment())
  store.dispatch(increment())
  expect(store.getState(countAtom)).toBe(4)
  expect(listener.lastInput()).toBe(4)

  // @ts-ignore
  store.dispatch({ ...initAction, payload: state })
  expect(store.getState(countAtom)).toBe(2)
  expect(listener.lastInput()).toBe(2)
})

test('createStore().bind', () => {
  const a = declareAction<0>()
  const store = createStore()
  const track = mockFn()

  store.subscribe(a, track)
  store.bind(a)(0)

  expect(track.lastInput()).toBe(0)
})

test('declareAction reactions', async () => {
  const delay = () => new Promise((on) => setTimeout(on, 10))
  const setValue = declareAction<number>()
  let lastCallId = 0
  const setValueConcurrent = declareAction<number>(async (payload, store) => {
    const incrementCallId = ++lastCallId
    await delay()
    if (incrementCallId === lastCallId) store.dispatch(setValue(payload))
  })
  const valueAtom = declareAtom(0, (on) => [on(setValue, (state, payload) => payload)])
  const store = createStore(valueAtom)
  const valueSubscriber = mockFn()
  store.subscribe(valueAtom, valueSubscriber)

  store.dispatch(setValue(10))
  expect(valueSubscriber.calls.length).toBe(1)
  expect(valueSubscriber.lastInput()).toBe(10)

  store.dispatch(setValueConcurrent(20))
  expect(valueSubscriber.calls.length).toBe(1)
  await delay()
  expect(valueSubscriber.calls.length).toBe(2)
  expect(valueSubscriber.lastInput()).toBe(20)

  store.dispatch(setValueConcurrent(30))
  store.dispatch(setValueConcurrent(40))
  store.dispatch(setValueConcurrent(50))
  expect(valueSubscriber.calls.length).toBe(2)
  await delay()
  expect(valueSubscriber.calls.length).toBe(3)
  expect(valueSubscriber.lastInput()).toBe(50)

  // ---

  const fn = mockFn()
  const action = declareAction<number>('!', fn)
  store.dispatch(action(0))
  expect(fn.calls.length).toBe(1)
})

test('derived state, map + combine', () => {
  const increment = declareAction()

  const count = declareAtom('@count', 0, (on) => on(increment, (state) => state + 1))
  const countDoubled = map(count, (state) => state * 2)

  const root = combine({ count, countDoubled })

  let countState = count()
  countState = count(countState, increment())
  expect(getState(countState, count)).toBe(1)

  countState = count(countState, increment())
  expect(getState(countState, count)).toBe(2)

  let rootState = root()
  rootState = root(rootState, declareAction()())
  expect(getState(rootState, count)).toBe(0)
  expect(getState(rootState, countDoubled)).toBe(0)
  expect(getState(rootState, root)).toEqual({ count: 0, countDoubled: 0 })

  rootState = root(rootState, increment())
  expect(getState(rootState, count)).toBe(1)
  expect(getState(rootState, countDoubled)).toBe(2)
  expect(getState(rootState, root)).toEqual({ count: 1, countDoubled: 2 })
})

test('derived state, combine array', () => {
  const increment = declareAction()
  const count = declareAtom('@count', 0, (on) => on(increment, (state) => state + 1))
  const countDoubled = map(count, (state) => state * 2)

  const root = combine([count, countDoubled])

  let state = root()
  expect(getState(state, root)).toEqual([0, 0])

  state = root(state, increment())
  expect(getState(state, root)).toEqual([1, 2])
})

test('derived state, should checks atoms with equal ids', () => {
  const update = declareAction<number>()

  const aAtom = declareAtom(0, (on) => on(update, (state, payload) => payload))

  const bAtom = map(aAtom, (a) => a * 2)
  const cAtom = map(combine([aAtom, bAtom]), ([a, b]) => a + b)

  expect(() => combine([aAtom, cAtom, bAtom])).not.toThrow()
  expect(() => combine([map(['aAtom'], aAtom, (v) => v), map(['aAtom'], aAtom, (v) => v)])).toThrow(
    '[reatom] One of dependencies has the equal id',
  )
})

test('subscriber should not be called if returns previous state from atom reducer', () => {
  const increment = declareAction()
  const initialState = {
    counter: 0,
    data: {
      counter: 1,
    },
  }
  const dataReducerMock = mockFn((state) => state.data)
  const counterReducerMock = mockFn((state) => state.counter)

  const rootAtom = declareAtom(initialState, (on) => [
    on(increment, (state) => ({ ...state, counter: state.counter + 1 })),
  ])
  const dataAtom = map(rootAtom, dataReducerMock)
  const counterAtom = map(dataAtom, counterReducerMock)

  const store = createStore(counterAtom)

  expect(dataReducerMock.calls.length).toBe(1)
  expect(counterReducerMock.calls.length).toBe(1)

  store.dispatch(increment())

  expect(dataReducerMock.calls.length).toBe(2)
  expect(counterReducerMock.calls.length).toBe(1)
})

test('subscriber should not be called if returns snapshot state from atom reducer', () => {
  const action = declareAction()
  const rootAtom = declareAtom(0, (on) => [on(action, (state) => state + 1), on(action, (state) => state - 1)])

  const subReducerMock = mockFn((state) => state)
  const subAtom = map(rootAtom, subReducerMock)
  const store = createStore(subAtom)

  expect(subReducerMock.calls.length).toBe(1)

  store.dispatch(action())

  expect(subReducerMock.calls.length).toBe(1)
})

test('subscriber should not be called if always returns NaN from atom reducer', () => {
  const action = declareAction()
  const rootAtom = declareAtom(0, (on) => [on(action, () => NaN)])

  const counterReducerMock = mockFn((state) => state)
  const counterAtom = map(rootAtom, counterReducerMock)

  const store = createStore(counterAtom)
  expect(counterReducerMock.calls.length).toBe(1)

  store.dispatch(action())
  expect(counterReducerMock.calls.length).toBe(2)

  store.dispatch(action())
  expect(counterReducerMock.calls.length).toBe(2)
})

test('state of initial atom with %s should not be cleared after unsubscribing', () => {
  ;(
    [
      ['basic id', 'atom'],
      ['strict id', ['atom']],
      ['symbol id', Symbol('atom')],
    ] as [string, string | symbol | [string]][]
  ).forEach((_, name) => {
    const action = declareAction()
    const atom = declareAtom(name.toString(), 0, (on) => [on(action, (state) => state + 1)])

    const store = createStore(atom)
    store.dispatch(action())

    expect(store.getState(atom)).toBe(1)

    const unsubscribe = store.subscribe(atom, noop)
    unsubscribe()

    expect(store.getState(atom)).toBe(1)
  })
})

// @ts-ignore FIXME
function getInitialStoreState(rootAtom, state): Record<string, any> {
  const depsShape = getDepsShape(rootAtom)
  if (depsShape) {
    const states = Object.keys(depsShape).map((id) =>
      // @ts-ignore FIXME
      getInitialStoreState(depsShape[id], state[id]),
    )

    return Object.assign({}, ...states)
  }

  return {
    [getTree(rootAtom).id]: state,
  }
}

test('getInitialStoreState init root atom with combine', () => {
  const setTitle = declareAction<string>()
  const titleAtom = declareAtom('title', (on) => [on(setTitle, (_, payload) => payload)])

  const setMode = declareAction<string>()
  const modeAtom = declareAtom('desktop', (on) => [on(setMode, (_, payload) => payload)])

  const appAtom = combine(['app_store'], {
    title: titleAtom,
    mode: modeAtom,
  })

  const defaultState = getInitialStoreState(appAtom, {
    title: 'My App',
    mode: 'mobile',
  })

  const store = createStore(defaultState)

  expect(store.getState(appAtom)).toEqual({
    title: 'My App',
    mode: 'mobile',
  })
  expect(store.getState(modeAtom)).toBe('mobile')
  expect(store.getState(titleAtom)).toBe('My App')
})

test('subscription', () => {
  // arrange
  const store = createStore()

  const addItem = declareAction<string>('addItem')
  const aAtom = declareAtom<string[]>(['a'], [], (on) => [on(addItem, (state, item) => [...state, item])])

  const rootAtom = declareAtom<string[]>(['root'], [], (on) => on(aAtom, (state, payload) => payload))

  expect(store.getState()).toEqual({})

  store.subscribe(rootAtom, () => null)
  // subscribe for atom
  const subscription = store.subscribe(aAtom, () => null)

  expect(store.getState(rootAtom)).toEqual([])
  expect(store.getState(aAtom)).toEqual([])

  store.dispatch(addItem('hello'))

  expect(store.getState(rootAtom)).toEqual(['hello'])
  expect(store.getState(aAtom)).toEqual(['hello'])

  // act
  subscription()

  // assert
  expect(store.getState(rootAtom)).toEqual(['hello'])
  expect(store.getState(aAtom)).toEqual(['hello'])
})

test('direct and via combine subscription', () => {
  // arrange
  const store = createStore()

  const addItem = declareAction<string>('addItem')
  const aAtom = declareAtom<string[]>(['a'], [], (on) => [on(addItem, (state, item) => [...state, item])])

  const rootAtom = combine({ a: aAtom })

  expect(store.getState()).toEqual({})

  const rootSubscription = store.subscribe(rootAtom, () => null)
  // subscribe for atom
  const subscription = store.subscribe(aAtom, () => null)

  expect(store.getState(rootAtom)).toEqual({ a: [] })
  expect(store.getState(aAtom)).toEqual([])

  store.dispatch(addItem('hello'))

  expect(store.getState(rootAtom)).toEqual({ a: ['hello'] })
  expect(store.getState(aAtom)).toEqual(['hello'])

  // act
  subscription()

  // assert
  expect(store.getState(rootAtom)).toEqual({ a: ['hello'] })
  expect(store.getState(aAtom)).toEqual(['hello'])

  // act
  rootSubscription()

  // assert
  expect(store.getState()).toEqual({})
})

test('dynamic initialState, unsubscribed atom should recalculate on each `getState`', async () => {
  const sleep = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms))
  const dateAtom = declareAtom(Date.now(), (on) => [on(declareAction([initAction.type]), () => Date.now())])
  const store = createStore()

  const date1 = store.getState(dateAtom)
  await sleep()
  const date2 = store.getState(dateAtom)
  expect(date1).not.toBe(date2)
})

test('dynamic initialState, reducer of `initAction.type` should calling on each mount', async () => {
  const sleep = (ms = 50) => new Promise((r) => setTimeout(r, ms))
  const dateAtom = declareAtom(Date.now(), (on) => [on(declareAction([initAction.type]), () => Date.now())])
  const store = createStore()

  const un = store.subscribe(dateAtom, () => {})

  const date1 = store.getState(dateAtom)
  await sleep()
  const date2 = store.getState(dateAtom)
  expect(date1).toBe(date2)

  un()
  store.subscribe(dateAtom, () => {})
  const date3 = store.getState(dateAtom)
  expect(date1).not.toBe(date3)
})

test('unsubscribe from atom should not cancel the subscription from the action', () => {
  const subscription = vi.fn()

  const store = createStore()
  const increment = declareAction()
  const counter = declareAtom(0, (on) => [on(increment, (state) => state + 1)])

  const unsubscribeAtom = store.subscribe(counter, () => {})
  const unsubscribeAction = store.subscribe(increment, subscription)
  unsubscribeAtom()

  store.dispatch(increment())
  expect(subscription).toHaveBeenCalledTimes(1)

  unsubscribeAction()
})

test(`v3`, () => {
  const store = createStore()
  const increment = declareAction(['increment'])
  const counter = declareAtom(['counter'], 0, (on) => [on(increment, (state) => state + 1)])
  const counterDoubled = v3.atom((ctx) => ctx.spy(counter.v3atom) * 2, 'counterDoubled')

  const cbV1 = vi.fn()
  const cbV3 = vi.fn()

  store.subscribe(counter, cbV1)
  store.v3ctx.subscribe(counterDoubled, cbV3)
  store.subscribe(v3toV1(counterDoubled), cbV3)

  expect(cbV1).toHaveBeenCalledTimes(0)
  expect(cbV3).toHaveBeenCalledTimes(1)

  store.dispatch(increment())

  expect(cbV1).toHaveBeenCalledTimes(1)
  expect(cbV3).toHaveBeenCalledTimes(3)

  const lastCallV1 = cbV1.mock.calls[0]?.[0]
  const lastCallV3 = cbV3.mock.calls[cbV3.mock.calls.length - 1]?.[0]

  expect(lastCallV1).toBeDefined()
  expect(lastCallV3).toBeDefined()

  expect(lastCallV1 * 2).toBe(lastCallV3)
})

test(`v3 computed`, () => {
  const store = createStore()
  const increment = declareAction()
  const counterV1 = declareAtom('counterV1', 0, (on) => [on(increment, (state) => state + 1)])
  const counterDoubledV3 = v3.atom((ctx) => ctx.spy(counterV1.v3atom) + 1, 'counterDoubledV3')
  const counterDoubledV1 = v3toV1(counterDoubledV3)
  const counterTripleV1 = map('counterTripleV1', counterDoubledV1, (v) => v + 1)
  const counterQuadV3 = v3.atom((ctx) => ctx.spy(counterTripleV1.v3atom) + 1, 'counterQuadV3')

  const cb = vi.fn()

  store.v3ctx.subscribe(counterQuadV3, cb)

  expect(cb).toHaveBeenCalledTimes(1)

  store.dispatch(increment())

  expect(cb).toHaveBeenCalledTimes(2)

  const lastCall = cb.mock.calls[1]?.[0]
  expect(lastCall).toBeDefined()
  expect(lastCall).toBe(4)
})

test('stale unconnected atom', () => {
  const createEntityAtom = <T>(name: string, initState: T) => {
    const set = declareAction<T>(`${name}.set`)

    const entityAtom = declareAtom<T>([name], initState, (on) => [on(set, (_, n) => n)])

    return Object.assign(entityAtom, { set })
  }

  const a1 = createEntityAtom('a1', 'test1')
  const a2 = createEntityAtom('a2', 'test2')

  const a3 = map(combine([a1, a2]), ([s1, s2]) => s1 + s2)

  const store = createStore(combine([a1, a2]))

  expect(store.getState(a1)).toBe('test1')
  expect(store.getState(a2)).toBe('test2')
  expect(store.getState(a3)).toBe('test1test2')

  store.dispatch(a2.set('qwe'))
  expect(store.getState(a3)).toBe('test1qwe')
})
