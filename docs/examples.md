> **These are the examples from [tests](https://github.com/artalar/reatom/blob/master/examples/counter.test.ts)**

## Simple counter

```js
test('simple counter', () => {
  const increment = declareAction()
  const counterAtom = declareAtom(
    // initial state
    0,
    // callback for creating
    // list of dependencies and their transformations
    on => [on(increment, state => state + 1)],
  )

  const store = createStore(counterAtom)
  let counterState = store.getState(counterAtom)
  expect(counterState).toBe(0)

  store.dispatch(increment())
  store.dispatch(increment())
  counterState = store.getState(counterAtom)
  expect(counterState).toBe(2)
})
```

## Derived (computed) atoms

```js
test('derived (computed) atoms', () => {
  const increment = declareAction()
  const counterAtom = declareAtom(0, on => [on(increment, state => state + 1)])
  const counterDoubledAtom = map(counterAtom, value => value * 2)
  const countersShapeAtom = combine([counterAtom, counterDoubledAtom])

  const store = createStore(countersShapeAtom)

  store.dispatch(increment())
  expect(store.getState(counterAtom)).toBe(1)
  expect(store.getState(counterDoubledAtom)).toBe(2)
  expect(store.getState(countersShapeAtom)).toEqual([1, 2])
})
```

## Side effects

```js
test('side effects', async () => {
  const setValue = declareAction()
  let lastCallId = 0
  const setValueConcurrent = declareAction(async (payload, store) => {
    const incrementCallId = ++lastCallId
    await delay()
    if (incrementCallId === lastCallId) store.dispatch(setValue(payload))
  })
  const valueAtom = declareAtom(0, on => [
    on(setValue, (state, payload) => payload),
  ])
  const store = createStore(valueAtom)
  const valueSubscriber = jest.fn()
  store.subscribe(valueAtom, valueSubscriber)

  store.dispatch(setValue(10))
  expect(valueSubscriber).toBeCalledTimes(1)
  expect(valueSubscriber).toBeCalledWith(10)

  store.dispatch(setValueConcurrent(20))
  expect(valueSubscriber).toBeCalledTimes(1)
  await delay()
  expect(valueSubscriber).toBeCalledTimes(2)
  expect(valueSubscriber).toBeCalledWith(20)

  store.dispatch(setValueConcurrent(30))
  store.dispatch(setValueConcurrent(40))
  store.dispatch(setValueConcurrent(50))
  expect(valueSubscriber).toBeCalledTimes(2)
  await delay()
  expect(valueSubscriber).toBeCalledTimes(3)
  expect(valueSubscriber).toBeCalledWith(50)
})
```

## Todo-list

> Beware, it is _enterprise_-like example with feature-driven structure, normalization and other abstractions. Simpler examples will be added later.

[![Todo-list](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/reatom-todo-app-eko8b)

---

Next:

> - <a href="https://reatom.js.org/#/faq">FAQ</a>
