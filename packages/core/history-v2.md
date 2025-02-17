# History of API / architecture choices

## Atom options

Main problems

- Execution order
- Type inference
- Calculation sharing

### Options builder

```ts
const add = declareAction<number>()

const counterAtom = declareAtom(0, (atom) =>
  atom
    .id(`counter`)
    .meta({ updates: 0 })
    .on(add, (value, state) => state + value)
    .compute(($, state) =>
      $(shouldSyncCounterAtom) ? $(globalCounterAtom) : state,
    )
    .assign({
      inc: (value: void, state) => state + 1,
    })
    .change((state, store, meta) =>
      console.log(
        `counterAtom receive new value: ${state}.`,
        `It is ${++meta.updates} update`,
      ),
    ),
)
```

### Options declarative properties

```ts
const add = declareAction<number>()

const counterAtom = declareAtom(0, {
  id: `counter`,
  meta: { updates: 0 },
  on: [add.reduce((value, state) => state + value)],
  compute: [
    ($, state) => ($(shouldSyncCounterAtom) ? $(globalCounterAtom) : state),
  ],
  assign: {
    inc: (value: void, state) => state + 1,
  },
  change: [
    (state, store, meta) =>
      console.log(
        `counterAtom receive new value: ${state}.`,
        `It is ${++meta.updates} update`,
      ),
  ],
})
```

### Options tuples

```ts
const add = declareAction<number>()

const counterAtom = declareAtom(
  0,
  [`id`, `counter`],
  [`meta`, { updates: 0 }],
  [add, (value, state) => state + value],
  [`inc`, (value: void, state) => state + 1],
  ($, state) => ($(shouldSyncCounterAtom) ? $(globalCounterAtom) : state),
  [
    `*`,
    (state) => (store, meta) =>
      console.log(
        `counterAtom receive new value: ${state}.`,
        `It is ${++meta.updates} update`,
      ),
  ],
)
```

### Options operators

```ts
const add = declareAction()

const counterAtom = declareAtom(
  {
    state: 0,
    id: `counter`,
    meta: { updates: 0 },
    actions: {
      add: (action: ActionCreator<[123]>) => reduce(action),
    },
  },
  ($, state) => ($(shouldSyncCounterAtom) ? $(globalCounterAtom) : state),
  reduce(add, (value, state) => state + value),
  sample(add, ($, state) => state + $(someAtom)),
  handle(add, (action, state) => ({
    state,
    effect: async (store) => {},
  })),
  change((oldState, newState) => newState),
)
```

### Options function properties

```ts
const add = declareAction<number>()

const counterAtom = declareAtom(0, {
  id: `counter`,
  ctx: { updates: 0 },
  methods: {
    inc: (value:void, state) => state + 1,
  },
  computer: ($, state) => {
    $(add, (value) => state += value))

    if ($(shouldSyncCounterAtom)) {
      $(globalCounterAtom, (globalCounter) => state = globalCounter)
    }

    return state
  }
  change: (newState, state) => (store, ctx) =>
    console.log(
      `counterAtom receive new value: ${state}.`,
      `It is ${++ctx.updates} update`,
    ),
})
```

### Options method properties

```ts
const add = declareAction<number>()

const counterAtom = declareAtom(0, {
  id: `counter`,
  ctx: { updates: 0 },
  change: (newState, state) => (store, ctx) =>
    console.log(
      `counterAtom receive new value: ${state}.`,
      `It is ${++ctx.updates} update`,
    ),
}, {
  inc: (inc: AC<void>) => ($, state) => {
    $(inc, () => state++)
    return state
  },
  computer: ($, state) => {
    $(add, (value) => state += value))

    if ($(shouldSyncCounterAtom)) {
      $(globalCounterAtom, (globalCounter) => state = globalCounter)
    }

    return state
  }
})
```

### Options single function

```ts
const add = declareAction<number>()

const counterAtom = declareAtom({ inc: () => null }, ($, state = 0) => {
  const oldState = state

  $((store, ctx) =>
    console.log(
      `counterAtom receive new value: ${state}.`,
      `It is ${(ctx.updates = (ctx.updates ?? 0) + 1)} update`,
    ),
  )

  $({ inc: () => state++ })

  $(add, (value) => (state += value))

  if ($(shouldSyncCounterAtom)) {
    $(globalCounterAtom, (globalCounter) => (state = globalCounter))
  }

  return state
})
```

### Options static dependencies

```ts
// decline outer actionCreators support

const counterAtom = declareAtom(
  { shouldSyncCounterAtom, globalCounterAtom, inc: () => null },
  ({ get, onAction, onChange, schedule }, state = 0) => {
    const oldState = state

    schedule((dispatch, ctx) =>
      console.log(
        `counterAtom receive new value: ${state}.`,
        `It is ${(ctx.updates = (ctx.updates ?? 0) + 1)} update`,
      ),
    )

    onAction(`inc`, () => state++)

    if (get(`shouldSyncCounterAtom`)) {
      onChange(`globalCounterAtom`, (globalCounter) => (state = globalCounter))
    }

    return state
  },
)
```

## Chained properties access

I write it in times of this API: `atom(ctx => ctx.spy(dataAtom))`. Third version of Reatom is allow dynamic atoms creation which force to describe all data with atoms. Practically it means that we now have a lot of code with nested atom, like `type A = Atom<{ b: { c: Atom<{ d: Atom }> } }>`, which looks really ugly in reading: `ctx.spy(ctx.get(ctx.get(aAtom).b.c).d)` - it is not obvious which structure we inspect and how. The better way is moving data accessor to it source - atom, for example: `aAtom(ctx.get).b.c(ctx.get).d(ctx.spy)`.

```js
// a.b.c.d
// ctx.spy(ctx.get(ctx.get(aAtom).b.c).d)
// a(trz.ctx).b.c(trz.ctx).d(trz)
// a.pipe(ctx.get).b.c.pipe(ctx.get).d(ctx.spy)

const doOne = action()
const doTwo = action((v /*: 0*/) => v)
const a1 = atom(0)
const a2 = atom(
  // `trz` mean "transaction"
  (trz) => {
    // just read
    a1(trz.ctx) * 2
    // read and subscribe
    a1(trz) * 2
    // update - just pass the second argument
    a1(trz, 123)
    a1(trz, (s) => s + 1)

    /*
      actions are atoms too, but their state is
      tmp array of payloads during dispatch
    */

    // just read
    doOne(trz.ctx) // []
    // read and subscribe
    doOne(trz) // []

    /*
      the main question is how to describe
      action call without payload - void - no arguments
    */

    // (1) undefined
    doOne(trz, undefined)
    doTwo(trz, 0)
    // VS (2) arguments array
    doOne(trz, [])
    doTwo(trz, [0])
    // VS (3) `call` overload
    doOne.call(trz)
    doTwo.call(trz, 0)
    // VS (4) separate `dispatch` method
    doOne.dispatch(trz)
    doTwo.dispatch(trz, 0)
    // VS (5) trz `call`
    trz.act(doOne)
    trz.act(doTwo, 0)
    // VS (6) old `dispatch` by action overload
    trz.dispatch(doOne())
    trz.dispatch(doTwo(0))

    /* result of one call - array with one element */

    doOne(trz.ctx) // [undefined]
    doTwo(trz.ctx) // [0]
  },
)
```
