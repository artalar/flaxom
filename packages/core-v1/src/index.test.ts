import { test } from 'uvu'
import * as assert from 'uvu/assert'
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

function noop() {}

test('main api, getIsAction', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  assert.is(getIsAction(), false)
  assert.is(getIsAction(null), false)
  assert.is(getIsAction({}), false)
  assert.is(getIsAction(declareAction()), true)
  assert.is(getIsAction(declareAtom(0, noop)), false)
})
test('main api, getIsAtom', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  assert.is(getIsAtom(), false)
  assert.is(getIsAtom(null), false)
  assert.is(getIsAtom({}), false)
  assert.is(getIsAtom(declareAtom(0, noop)), true)
  assert.is(getIsAtom(declareAction()), false)
})
test('main api, declareAction', () => {
  assert.is(typeof declareAction() === 'function', true)
  const actionCreator = declareAction()
  const action = actionCreator()
  assert.is(action.type, actionCreator.getType())
  assert.is(action.payload, undefined)
  declareAction('TeSt')().type //?
  assert.is(declareAction('TeSt')().type.includes('TeSt'), true)

  {
    const action = declareAction(['TeSt'])()
    assert.ok(action.type === 'TeSt' && 'payload' in action)
  }
})

test('main api, declareAtom, basics', () => {
  const name = '_atomName_'
  const initialState = {}
  const atom = declareAtom(name, initialState, () => {})
  const state = atom({}, initAction)

  assert.is(getState(state, atom), initialState)
  assert.ok(
    (() => {
      const keys = Object.keys(state)
      return keys.length === 1 && keys[0]!.includes(name)
    })(),
  )
  assert.equal(declareAtom([name], initialState, () => {})(), {
    [name]: initialState,
  })
})

test('main api, declareAtom, strict uid', () => {
  const addUnderscore = declareAction()
  const atom1 = declareAtom(['name1'], '1', (on) => [on(addUnderscore, (state) => `_${state}`)])
  const atom2 = declareAtom(['name2'], '2', (on) => [on(addUnderscore, (state) => `_${state}`)])
  const atomRoot = combine([atom1, atom2])

  let state = atomRoot()
  assert.equal(state, {
    name1: '1',
    name2: '2',
    [getTree(atomRoot).id]: ['1', '2'],
  })

  state = atomRoot(state, addUnderscore())
  assert.equal(state, {
    name1: '_1',
    name2: '_2',
    [getTree(atomRoot).id]: ['_1', '_2'],
  })
})

test('main api, declareAtom, throw error if declareAtom called with an undefined initial state', () => {
  const run = () => declareAtom(['test'], undefined, () => [])

  assert.throws(run, `[reatom] Atom "test". Initial state can't be undefined`)
})

test('main api, declareAtom, throw error if atom produced undefined value', () => {
  const action = declareAction()

  assert.throws(
    () => declareAtom(['myAtom'], {}, (on) => on(action, () => undefined as any))({}, action()),

    '[reatom] Invalid state. Reducer number 1 in "myAtom" atom returns undefined',
  )

  assert.throws(
    () =>
      declareAtom(['test'], 0, (on) => [on(declareAction(), () => 0), on(action, () => undefined as any)])(
        {},
        action(),
      ),

    '[reatom] Invalid state. Reducer number 2 in "test" atom returns undefined',
  )
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

  assert.is(sideEffect.calls.length, 0)

  store.dispatch(increment())
  assert.is(sideEffect.calls.length, 1)
  assert.is(sideEffect.lastInput(), 3)
})

test('main api, createStore', () => {
  const increment = declareAction('increment')
  const toggle = declareAction()

  const count = declareAtom('count', 0, (on) => [on(increment, (state) => state + 1)])
  const countDoubled = map('count/map', count, (state) => state * 2)
  const toggled = declareAtom('toggled', false, (on) => on(toggle, (state) => !state))

  const root = combine('combine', {
    count,
    countDoubled,
    toggled,
  })

  const store = createStore(root)

  assert.equal(store.getState(root), {
    count: 0,
    countDoubled: 0,
    toggled: false,
  })
  assert.equal(store.getState(root), {
    count: 0,
    countDoubled: 0,
    toggled: false,
  })
  assert.is(store.getState(countDoubled), 0)
  assert.is(store.getState(count), 0)

  assert.ok(store.getState(root) !== (store.dispatch(increment()), store.getState(root)))
  assert.equal(store.getState(root), {
    count: 1,
    countDoubled: 2,
    toggled: false,
  })
  assert.equal(store.getState(root), {
    count: 1,
    countDoubled: 2,
    toggled: false,
  })
  assert.is(store.getState(countDoubled), 2)
  assert.is(store.getState(count), 1)

  const storeSubscriber = mockFn()
  const subscriberToggled = mockFn()
  store.subscribe(storeSubscriber)
  store.subscribe(toggled, subscriberToggled)
  assert.is(storeSubscriber.calls.length, 0)
  assert.is(subscriberToggled.calls.length, 0)

  store.dispatch(increment())
  assert.equal(store.getState(root), {
    count: 2,
    countDoubled: 4,
    toggled: false,
  })
  assert.equal(store.getState(), {
    [getTree(count).id]: 2,
    [getTree(countDoubled).id]: 4,
    [getTree(toggled).id]: false,
    [getTree(root).id]: {
      count: 2,
      countDoubled: 4,
      toggled: false,
    },
  })
  assert.is(storeSubscriber.calls.length, 1)
  assert.equal(storeSubscriber.calls[0]!.i[0], increment())
  assert.is(subscriberToggled.calls.length, 0)

  store.dispatch(toggle())
  assert.equal(store.getState(root), {
    count: 2,
    countDoubled: 4,
    toggled: true,
  })
  assert.is(storeSubscriber.calls.length, 2)
  assert.equal(storeSubscriber.calls[1]!.i[0], toggle())
  assert.is(subscriberToggled.calls.length, 1)
  assert.is(subscriberToggled.calls[0]!.i[0], true)

  assert.ok(store.getState(root) === (store.dispatch(declareAction()()), store.getState(root)))
  assert.is(storeSubscriber.calls.length, 3)
  assert.is(subscriberToggled.calls.length, 1)
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
  assert.is(storeSubscriber.calls.length, 1)
  assert.is(subscriberCount1.calls.length, 1)

  store.dispatch(set(1))
  assert.is(storeSubscriber.calls.length, 2)
  assert.is(subscriberCount1.calls.length, 1)
  assert.is(count2SetMap.calls.length, 0)

  assert.is(store.getState(count2), 0)
  const count2Unsubscriber1 = store.subscribe(count2, count2Subscriber1)
  const count2Unsubscriber2 = store.subscribe(count2, count2Subscriber2)
  assert.is(store.getState(count2), 0)

  store.dispatch(increment())
  assert.is(store.getState(count2), 1)
  assert.is(storeSubscriber.calls.length, 3)
  assert.is(subscriberCount1.calls.length, 2)
  assert.is(count2Subscriber1.calls[0]!.i[0], 1)
  assert.is(count2Subscriber2.calls.length, 1)
  assert.is(count2SetMap.calls.length, 0)

  store.dispatch(set(5))
  assert.is(store.getState(count2), 5)
  assert.is(storeSubscriber.calls.length, 4)
  assert.is(subscriberCount1.calls.length, 2)
  assert.is(count2Subscriber1.calls.length, 2)
  assert.is(count2Subscriber1.calls[1]!.i[0], 5)
  assert.is(count2Subscriber2.calls.length, 2)
  assert.is(count2SetMap.calls.length, 1)

  count2Unsubscriber1()
  store.dispatch(set(10))
  assert.is(storeSubscriber.calls.length, 5)
  assert.is(store.getState(count2), 10)
  assert.is(count2SetMap.calls.length, 2)
  assert.is(count2Subscriber1.calls.length, 2)
  assert.is(count2Subscriber2.calls.length, 3)

  count2Unsubscriber2()
  assert.is(store.getState(count2), 0)
  store.dispatch(set(15))
  assert.is(storeSubscriber.calls.length, 6)
  assert.is(store.getState(count2), 0)
  assert.is(count2Subscriber2.calls.length, 3)
  assert.is(count2SetMap.calls.length, 2)
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
  assert.is(store.getState(count1), 1)
  assert.is(store.getState(count1Doubled), 2)
  assert.is(store.getState(count2), 0)
  assert.is(store.getState(count2Doubled), 0)

  store.subscribe(count2Doubled, () => {})
  store.dispatch(increment2())
  assert.is(store.getState(count2), 1)
  assert.is(store.getState(count2Doubled), 2)
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
  assert.is(store.getState(count), 1)
  assert.is(store.getState().countDoubled, undefined)

  let unsubscriber = store.subscribe(countDoubled, () => {})
  store.dispatch(increment())
  assert.is(store.getState(count), 2)
  assert.is(store.getState().countDoubled, 4)

  unsubscriber()
  store.dispatch(increment())
  assert.is(store.getState(count), 3)
  assert.is(store.getState().countDoubled, undefined)

  unsubscriber = store.subscribe(countDoubled, () => {})
  store.dispatch(increment())
  assert.is(store.getState(count), 4)
  assert.is(store.getState().countDoubled, 8)
})

test('main api, createStore lazy derived resubscribes', () => {
  const increment = declareAction()

  const count = declareAtom(['count'], 0, (on) => on(increment, (state) => state + 1))
  const root = combine(['root'], { count })

  const store = createStore()

  const unsubscribe = store.subscribe(root, () => {})

  store.dispatch(increment())

  assert.is(store.getState().count, 1)

  unsubscribe()

  assert.is(store.getState().count, undefined)
})

test('main api, createStore with undefined atom', () => {
  const increment = declareAction()
  const countStatic = declareAtom(['countStatic'], 0, (on) => on(increment, (state) => state + 1))

  const store = createStore({ countStatic: 10 })
  store.dispatch(increment())

  assert.is(store.getState(countStatic), 10)

  store.subscribe(countStatic, () => {})
  store.dispatch(increment())

  assert.is(store.getState(countStatic), 11)
})

test('main api, createStore with undefined atom and state', () => {
  const store = createStore()
  assert.equal(store.getState(), {})
})

test('main api, createStore preloaded state', () => {
  const increment = declareAction()

  const staticCount = declareAtom(['staticCount'], 0, (on) => on(increment, (state) => state + 1))
  const dynamicCount = declareAtom(['dynamicCount'], 0, (on) => on(increment, (state) => state + 1))
  const root = combine(['staticRoot'], { staticCount })

  const storeWithoutPreloadedState = createStore(root)
  assert.equal(storeWithoutPreloadedState.getState(), {
    staticCount: 0,
    staticRoot: { staticCount: 0 },
  })
  assert.is(storeWithoutPreloadedState.getState(staticCount), 0)
  assert.is(storeWithoutPreloadedState.getState(dynamicCount), 0)

  const storeWithPreloadedState = createStore(root, {
    staticCount: 1,
    staticRoot: { staticCount: 1 },
    dynamicCount: 2,
  })

  assert.equal(storeWithPreloadedState.getState(), {
    staticCount: 1,
    staticRoot: { staticCount: 1 },
    dynamicCount: 2,
  })
  assert.is(storeWithPreloadedState.getState(staticCount), 1)
  assert.is(storeWithPreloadedState.getState(dynamicCount), 2)
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

  assert.equal([reaction.lastInput(0), reaction.lastInput(1)], [action, {}])

  action = increment1()
  store.dispatch(action)
  assert.equal(
    [reaction.lastInput(0), reaction.lastInput(1)],
    [
      action,
      {
        [getTree(count1Atom).id]: 1,
      },
    ],
  )

  action = increment2()
  store.dispatch(action)
  assert.equal(
    [reaction.lastInput(0), reaction.lastInput(1)],
    [
      action,
      {
        [getTree(count2Atom).id]: 1,
      },
    ],
  )
})

test('main api, createStore subscribe to action', () => {
  const action = declareAction<null>()
  const trackAction = mockFn()
  const trackActions = mockFn()
  const store = createStore()

  store.subscribe(action, trackAction)
  store.subscribe(trackActions)

  store.dispatch(declareAction()())
  assert.is(trackAction.calls.length, 0)
  assert.is(trackActions.calls.length, 1)

  store.dispatch(action(null))
  assert.is(trackAction.calls.length, 1)
  assert.is(trackAction.lastInput(), null)
  assert.is(trackActions.calls.length, 2)
})

test('atom id as symbol', () => {
  const atom = declareAtom(['my atom'], 0, () => [])
  const atomMap = map(atom, (v) => v)
  const atomCombine = combine([atom, atomMap])

  assert.is(typeof getTree(declareAtom(0, () => [])).id, 'string')
  assert.is(getTree(atom).id, 'my atom')
  assert.is(typeof getTree(atomMap).id, 'symbol')
  assert.is(getTree(atomMap).id.toString(), 'Symbol(my atom [map])')
  assert.is(typeof getTree(atomCombine).id, 'symbol')
  assert.is(getTree(atomCombine).id.toString(), 'Symbol([my atom,my atom [map]])')
  assert.is(
    getTree(
      map(
        declareAtom(Symbol('123'), 0, () => []),
        (v) => v,
      ),
    ).id.toString(),
    'Symbol(123 [map])',
  )
})

test('IoC example', () => {
  class Api {}
  const api = new Api()
  const mockApi = new Api()
  const apiAtom = declareAtom(Symbol('API'), api, () => [])
  let store

  store = createStore(apiAtom)
  assert.equal(store.getState(), {
    [getTree(apiAtom).id]: api,
  })

  store = createStore({ [getTree(apiAtom).id]: mockApi })
  assert.is(store.getState(apiAtom), mockApi)
  assert.is(JSON.stringify(store.getState()), '{}')
})

test('createStore replace state', () => {
  const increment = declareAction()
  const countAtom = declareAtom(0, (on) => [on(increment, (state) => state + 1)])
  const listener = mockFn()
  const store = createStore(countAtom)

  store.subscribe(countAtom, listener)

  assert.is(store.getState(countAtom), 0)

  store.dispatch(increment())
  store.dispatch(increment())
  const state = store.getState()

  assert.is(store.getState(countAtom), 2)
  assert.is(listener.lastInput(), 2)

  store.dispatch(increment())
  store.dispatch(increment())
  assert.is(store.getState(countAtom), 4)
  assert.is(listener.lastInput(), 4)

  // @ts-ignore
  store.dispatch({ ...initAction, payload: state })
  assert.is(store.getState(countAtom), 2)
  assert.is(listener.lastInput(), 2)
})

test('createStore().bind', () => {
  const a = declareAction<0>()
  const store = createStore()
  const track = mockFn()

  store.subscribe(a, track)
  store.bind(a)(0)

  assert.is(track.lastInput(), 0)
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
  assert.is(valueSubscriber.calls.length, 1)
  assert.is(valueSubscriber.lastInput(), 10)

  store.dispatch(setValueConcurrent(20))
  assert.is(valueSubscriber.calls.length, 1)
  await delay()
  assert.is(valueSubscriber.calls.length, 2)
  assert.is(valueSubscriber.lastInput(), 20)

  store.dispatch(setValueConcurrent(30))
  store.dispatch(setValueConcurrent(40))
  store.dispatch(setValueConcurrent(50))
  assert.is(valueSubscriber.calls.length, 2)
  await delay()
  assert.is(valueSubscriber.calls.length, 3)
  assert.is(valueSubscriber.lastInput(), 50)

  // ---

  const fn = mockFn()
  const action = declareAction<number>('!', fn)
  store.dispatch(action(0))
  assert.is(fn.calls.length, 1)
})

test('derived state, map + combine', () => {
  const increment = declareAction()

  const count = declareAtom('@count', 0, (on) => on(increment, (state) => state + 1))
  const countDoubled = map(count, (state) => state * 2)

  const root = combine({ count, countDoubled })

  let countState = count()
  countState = count(countState, increment())
  assert.equal(getState(countState, count), 1)

  countState = count(countState, increment())
  assert.equal(getState(countState, count), 2)

  let rootState = root()
  rootState = root(rootState, declareAction()())
  assert.equal(getState(rootState, count), 0)
  assert.equal(getState(rootState, countDoubled), 0)
  assert.equal(getState(rootState, root), { count: 0, countDoubled: 0 })

  rootState = root(rootState, increment())
  assert.equal(getState(rootState, count), 1)
  assert.equal(getState(rootState, countDoubled), 2)
  assert.equal(getState(rootState, root), { count: 1, countDoubled: 2 })
})
test('derived state, combine array', () => {
  const increment = declareAction()
  const count = declareAtom('@count', 0, (on) => on(increment, (state) => state + 1))
  const countDoubled = map(count, (state) => state * 2)

  const root = combine([count, countDoubled])

  let state = root()
  assert.equal(getState(state, root), [0, 0])

  state = root(state, increment())
  assert.equal(getState(state, root), [1, 2])
})
test('derived state, should checks atoms with equal ids', () => {
  const update = declareAction<number>()

  const aAtom = declareAtom(0, (on) => on(update, (state, payload) => payload))

  const bAtom = map(aAtom, (a) => a * 2)
  const cAtom = map(combine([aAtom, bAtom]), ([a, b]) => a + b)

  assert.not.throws(() => combine([aAtom, cAtom, bAtom]))
  assert.throws(
    () => combine([map(['aAtom'], aAtom, (v) => v), map(['aAtom'], aAtom, (v) => v)]),
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

  assert.is(dataReducerMock.calls.length, 1)
  assert.is(counterReducerMock.calls.length, 1)

  store.dispatch(increment())

  assert.is(dataReducerMock.calls.length, 2)
  assert.is(counterReducerMock.calls.length, 1)
})

test('subscriber should not be called if returns snapshot state from atom reducer', () => {
  const action = declareAction()
  const rootAtom = declareAtom(0, (on) => [on(action, (state) => state + 1), on(action, (state) => state - 1)])

  const subReducerMock = mockFn((state) => state)
  const subAtom = map(rootAtom, subReducerMock)
  const store = createStore(subAtom)

  assert.is(subReducerMock.calls.length, 1)

  store.dispatch(action())

  assert.is(subReducerMock.calls.length, 1)
})

test('subscriber should not be called if always returns NaN from atom reducer', () => {
  const action = declareAction()
  const rootAtom = declareAtom(0, (on) => [on(action, () => NaN)])

  const counterReducerMock = mockFn((state) => state)
  const counterAtom = map(rootAtom, counterReducerMock)

  const store = createStore(counterAtom)
  assert.is(counterReducerMock.calls.length, 1)

  store.dispatch(action())
  assert.is(counterReducerMock.calls.length, 2)

  store.dispatch(action())
  assert.is(counterReducerMock.calls.length, 2)
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

    assert.is(store.getState(atom), 1)

    const unsubscribe = store.subscribe(atom, noop)
    unsubscribe()

    assert.is(store.getState(atom), 1)
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

  assert.equal(store.getState(appAtom), {
    title: 'My App',
    mode: 'mobile',
  })
  assert.equal(store.getState(modeAtom), 'mobile')
  assert.equal(store.getState(titleAtom), 'My App')
})

test('subscription', () => {
  // arrange
  const store = createStore()

  const addItem = declareAction<string>('addItem')
  const aAtom = declareAtom<string[]>(['a'], [], (on) => [on(addItem, (state, item) => [...state, item])])

  const rootAtom = declareAtom<string[]>(['root'], [], (on) => on(aAtom, (state, payload) => payload))

  assert.equal(store.getState(), {})

  store.subscribe(rootAtom, () => null)
  // subscribe for atom
  const subscription = store.subscribe(aAtom, () => null)

  assert.equal(store.getState(rootAtom), [])
  assert.equal(store.getState(aAtom), [])

  store.dispatch(addItem('hello'))

  assert.equal(store.getState(rootAtom), ['hello'])
  assert.equal(store.getState(aAtom), ['hello'])

  // act
  subscription()

  // assert
  assert.equal(store.getState(rootAtom), ['hello'])
  assert.equal(store.getState(aAtom), ['hello'])
})

test('direct and wia combine subscription', () => {
  // arrange
  const store = createStore()

  const addItem = declareAction<string>('addItem')
  const aAtom = declareAtom<string[]>(['a'], [], (on) => [on(addItem, (state, item) => [...state, item])])

  const rootAtom = combine({ a: aAtom })

  assert.equal(store.getState(), {})

  const rootSubscription = store.subscribe(rootAtom, () => null)
  // subscribe for atom
  const subscription = store.subscribe(aAtom, () => null)

  assert.equal(store.getState(rootAtom), { a: [] })
  assert.equal(store.getState(aAtom), [])

  store.dispatch(addItem('hello'))

  assert.equal(store.getState(rootAtom), { a: ['hello'] })
  assert.equal(store.getState(aAtom), ['hello'])

  // act
  subscription()

  // assert
  assert.equal(store.getState(rootAtom), { a: ['hello'] })
  assert.equal(store.getState(aAtom), ['hello'])

  // act
  rootSubscription()

  // assert
  assert.equal(store.getState(), {})
})

test('dynamic initialState, unsubscribed atom should recalculate on each `getState`', async () => {
  const sleep = (ms = 50) => new Promise((r) => setTimeout(r, ms))
  const dateAtom = declareAtom(Date.now(), (on) => [on(declareAction([initAction.type]), () => Date.now())])
  const store = createStore()

  const date1 = store.getState(dateAtom)
  await sleep()
  const date2 = store.getState(dateAtom)
  assert.is.not(date1, date2)
})

test('dynamic initialState, reducer of `initAction.type` should calling on each mount', async () => {
  const sleep = (ms = 50) => new Promise((r) => setTimeout(r, ms))
  const dateAtom = declareAtom(Date.now(), (on) => [on(declareAction([initAction.type]), () => Date.now())])
  const store = createStore()

  const un = store.subscribe(dateAtom, () => {})

  const date1 = store.getState(dateAtom)
  await sleep()
  const date2 = store.getState(dateAtom)
  assert.is(date1, date2)

  un()
  store.subscribe(dateAtom, () => {})
  const date3 = store.getState(dateAtom)
  assert.is.not(date1, date3)
})

/**
 * @see https://github.com/artalar/reatom/issues/348
 */
test('unsubscribe from atom should not cancel the subscription from the action', () => {
  const subscription = mockFn()

  const store = createStore()
  const increment = declareAction()
  const counter = declareAtom(0, (on) => [on(increment, (state) => state + 1)])

  const unsubscribeAtom = store.subscribe(counter, noop)
  const unsubscribeAction = store.subscribe(increment, subscription)
  unsubscribeAtom()

  store.dispatch(increment())
  assert.is(subscription.calls.length, 1)

  unsubscribeAction()
})

test(`v3`, () => {
  const store = createStore()
  const increment = declareAction(['increment'])
  const counter = declareAtom(['counter'], 0, (on) => [on(increment, (state) => state + 1)])
  const counterDoubled = v3.atom((ctx) => ctx.spy(counter.v3atom) * 2, 'counterDoubled')

  const cbV1 = mockFn()
  const cbV3 = mockFn()

  store.subscribe(counter, cbV1)
  store.v3ctx.subscribe(counterDoubled, cbV3)
  store.subscribe(v3toV1(counterDoubled), cbV3)

  assert.is(cbV1.calls.length, 0)
  assert.is(cbV3.calls.length, 1)

  store.dispatch(increment())

  assert.is(cbV1.calls.length, 1)
  assert.is(cbV3.calls.length, 3)
  assert.is(cbV1.lastInput() * 2, cbV3.lastInput())
})

test(`v3 computed`, () => {
  const store = createStore()
  const increment = declareAction()
  const counterV1 = declareAtom('counterV1', 0, (on) => [on(increment, (state) => state + 1)])
  const counterDoubledV3 = v3.atom((ctx) => ctx.spy(counterV1.v3atom) + 1, 'counterDoubledV3')
  const counterDoubledV1 = v3toV1(counterDoubledV3)
  const counterTripleV1 = map('counterTripleV1', counterDoubledV1, (v) => v + 1)
  const counterQuadV3 = v3.atom((ctx) => ctx.spy(counterTripleV1.v3atom) + 1, 'counterQuadV3')

  const cb = mockFn()

  store.v3ctx.subscribe(counterQuadV3, cb)

  assert.is(cb.calls.length, 1)

  store.dispatch(increment())

  assert.is(cb.calls.length, 2)
  assert.is(cb.lastInput(), 4)
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

  assert.is(store.getState(a1), 'test1')
  assert.is(store.getState(a2), 'test2')
  assert.is(store.getState(a3), 'test1test2')

  store.dispatch(a2.set('qwe'))
  assert.is(store.getState(a3), 'test1qwe')
})

test.run()
