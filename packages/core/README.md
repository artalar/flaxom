Tiny, efficient, featured, and extensible core to handle reactivity right. The ultimate state manager. Build anything, from a small widget to a huge application.

> included in [@reatom/framework](https://www.reatom.dev/package/framework)

[Main introduction](https://www.reatom.dev/).

The raw API description is [below](#atom-api).

## About

Reatom allows you to describe both simple and complex logic using three main components: **atoms** for data reference, **actions** for logic processing, and **context** (`ctx`) for system isolation. This core is a perfect solution for building your own high-order library or an entire framework, with all the packages built on top of it.

Reatom is inspired by the React and Redux architectures. All processed data should be [immutable](https://developer.mozilla.org/en-US/docs/Glossary/Immutable), computations should be pure, and all side effects should be scheduled for a separate effects queue using `ctx.schedule(callback)`. Only consistent data transactions should be applied. All prerequisites can be checked in this article: [What is a state manager](https://www.reatom.dev/blog/what-is-state-manager).

## Installation

```sh
npm i @reatom/core
```

## Usage

Let's describe a simple example of a search input with a tip and a list of goods. This code is written in TypeScript, but you can also use JavaScript; a lot of types are inferred automatically.
Pay your attention to the comments; they will help you to understand the core concepts.

```ts
// ~/ctx.ts
import { createCtx } from '@reatom/core'

// create context in the app root and use it to start all computations
// for tests or SSR you will want to create a different context
export const ctx = createCtx()
```

All atoms and actions accept `ctx` as their first argument to match and process all data inside it. It assists you greatly in many areas: testing, debugging, SSR, effects chain management, and logging. It is the **most powerful** feature of Reatom and is indispensable in complex scenarios. And it only requires three extra letters for each function call - super efficient!

As the entire data processing flows through the context, you can easily inspect it: `ctx.subscribe(logs => console.log(logs))` or connect a separate [logger](https://www.reatom.dev/package/logger) to view all changes in your app with proper formatting.

Now, let's outline some logic.

```ts
// ~/features/search/model.ts
import { action, atom, batch } from '@reatom/core'

// define your base mutable data references
// by passing a primitive initial values
const searchAtom = atom('')
const isSearchingAtom = atom(false)
const goodsAtom = atom(new Array<Goods>())

// define computed atoms to infer data
// with smart and optimized caching
const tipAtom = atom((ctx) => {
  // read and subscribe by `ctx.spy`
  const isSearching = ctx.spy(isSearchingAtom)
  const goodsCount = ctx.spy(goodsAtom).length

  if (isSearching) {
    return 'Searching...'
  }
  if (goodsCount === 0) {
    // read atom lazy without subscribing by `get`
    return ctx.get(searchAtom) ? 'Nothing found' : 'Try to search something'
  }
  if (goodsCount === 1) {
    return `We found one treasure`
  }
  return `Found ${goodsCount} goods`
})

// define your actions to handle any effects and work with atoms
const fetchGoods = action(async (ctx, search: string) => {
  // mutate base atoms by passing relative ctx and the new state
  goodsAtom(ctx, [])

  if (search === '') return

  // all sync updates inside action automatically batched
  // (relative atoms will compute after the function sync part)
  isSearchingAtom(ctx, true)

  // schedule side-effects
  // which will be called after successful execution of all computations
  const goods = await ctx.schedule(() =>
    fetch(`/api/goods?search=${search}`).then((r) => r.json()),
  )

  // use `batch` to prevent glitches and extra effects.
  batch(ctx, () => {
    isSearchingAtom(ctx, false)
    goodsAtom(ctx, goods)
  })
})
// react to data changes
searchAtom.onChange(fetchGoods)
```

Here we just described the logic of a module which uses `ctx`, but does not import it. This is because we want to use the same module in different contexts, such as view components and tests. It is a good architectural practice in itself.

So, we should connect an IO and our module together somewhere.

```ts
// ~/features/search/index.ts
import { ctx } from '~/ctx'
import { tipAtom, onSearch, fetchGoods } from './model'

// subscribe to your atoms
ctx.subscribe(tipAtom, (tip) => {
  document.getElementById('goods-tip').innerText = tip
})
// handle user interactions by your actions
document.getElementById('search-input').addEventListener('input', (event) => {
  searchAtom(ctx, event.currentTarget.value)
})
```

> Do you want to see [the docs for React adapter](https://www.reatom.dev/package/npm-react) next?

## Action handling (advanced)

It is better to keep atoms stupid and handle all logic inside actions. But sometimes you need to turn the direction of your code coupling and make atoms depend on an action. And you can do it!

An action is an atom with a temporal state, which is an array of all passed payloads. This state is cleared after the transaction ends; if you try to `get` or `spy` an action which wasn't called, you will receive an empty array. But if the action was called, the array will contain some elements.

```ts
// ~/modules/someFlow
import { atom, batch } from '@reatom/core'
import { newMessage } from '~/modules/ws'

const FLOW_NAME = 'someFlow'

export const someFlowAtom = atom(0)

// you need to subscribe to it to start watching `newMessage`
export const someFlowManagerAtom = atom((ctx) => {
  console.log('example log for `ctx.get(newMessage)`', ctx.get(newMessage))

  ctx.spy(newMessage).forEach(({ payload }) => {
    if (payload.relation === FLOW_NAME) someFlowAtom(ctx, payload)

    console.log('example log for `ctx.spy(newMessage)[N]`.payload', payload)
  })
})

// socket service:
socket.on(
  throttle(150, (msgs) =>
    batch(ctx, () => {
      msgs.forEach((msg) => newMessage(ctx, msg))
    }),
  ),
)

// someFlowManagerAtom reducer:
// example log for `ctx.get(newMessage)` [{ params: [1], payload: 1 }, { params: [2], payload: 2 }]
// example log for `ctx.spy(newMessage)[N]` 1
// example log for `ctx.spy(newMessage)[N]` 2
```

> You need to know one **rare** tricky thing. If during a transaction you call an action and read its dependent atom a few times step by step, `ctx.get` will return an array of all passed payloads, but `ctx.spy` will return an array with only new elements that weren't handled in this reducer during this transaction. To make this rare case correct, you should spy your dependencies in the same way each time, without conditions. In other words, for this case your dependencies list should be static.

## atom API

```ts
import { atom } from '@reatom/core'
```

The `atom()` function is a factory for an atomic-based reactive primitive. Atoms don't store their data (state, listeners, dependencies) within themselves; they only provide a key to a cache in [ctx](#ctx-api) (context). You can think of an atom as a prototype for a cache. One of the most powerful features of Reatom is that the cache is immutable, and it is recreated on each relative update. The immutability of the cache helps to process [transactions](#ctxschedule) and is extremely useful for debugging. Don't worry, it is also quite [efficient](https://www.reatom.dev/#how-performant-reatom-is).

As Atom is a key, it should be mapped somewhere to its cache. `ctx` has an internal [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) `caches`, which store your data until there is a link to Atom. When you subscribe (connect) and unsubscribe (disconnect) from Atom, the state isn't reset or deleted; it is still stored in the cache, which will be cleared by the GC only after the link to the Atom disappears from your closures. This behavior is the most intuitive and works just like any variable storing. So, if you define a global Atom available in a few of your modules, the state will always persist in memory during the application lifetime, whether you subscribed or unsubscribed for the Atom, which is useful. If you need to clear the state on disconnect or do other lifetime transformations, check the [hooks package](https://www.reatom.dev/package/hooks) and [withreset](https://www.reatom.dev/package/lens#withreset) helper.

If you need to create a base mutable atom, just pass the initial value to `atom`. Pass the atom name as a second argument (it is optional but strongly recommended). The resulted atom will be mutable (`Mut`) with a callable signature (a function); you can mutate it by passing a context and a new value or a reducer function.

```ts
// create
const countAtom = atom(0, 'countAtom')
// countAtom: AtomMut<number>

// mutate by setter
countAtom(ctx, 10)
// updates and return 10

// mutate by reducer
countAtom(ctx, (state) => state + 1)
// updates and return 11
```

**All atom state changes should be immutable**.

```ts
export const listAtom = atom([], 'listAtom')
// add item
listAtom(ctx, (list) => [...list, newItem])
```

You could create a computed derived atom by passing a function to `atom`. The first argument of the passed reducer is a special kind of `ctx` with a `spy` function, which allows you to subscribe to the passed atom and receive its fresh state. The second argument is an optional previous `state`, which you can initiate by defining a default value.

> **Note to TypeScript users**: It is impossible to describe the reducer type with an optional generic state argument, which is returned from the function. If you use the second `state` argument, you should define its type; do not rely on the return type.

```ts
const isCountEvenAtom = atom(
  (ctx) => ctx.spy(countAtom) % 2 === 0,
  'isCountEven',
)
// isCountEvenAtom: Atom<number>
```

> To store a function in Reatom state, just wrap it in a container, like `atom({ fn })`.

Reatom allows you to use native language features to describe your conditions, with all reactive dependencies reconnecting in real-time.

```ts
export const currencyAtom = atom<'us' | 'eu'>('us')
export const rateAtom = atom(1)
export const usCurrencyAtom = atom(0)
export const euCurrencyAtom = atom(0)
export const currencyValueAtom = atom((ctx) => {
  const currency = ctx.spy(currencyAtom)
  const valueAtom = currency === 'us' ? usCurrencyAtom : euCurrencyAtom
  return ctx.spy(valueAtom)
})
```

Moreover, you could dynamically create and manage atoms.

```ts
const currencyAtom = atom('us')
const currenciesAtom = atom({ us: atom(0) })
export const currencyValueAtom = atom((ctx) => {
  const currency = ctx.spy(currencyAtom)
  let valueAtom = ctx.spy(currenciesAtom)[currency]

  if (!valueAtom) {
    valueAtom = atom(0)
    currenciesAtom(ctx, (state) => ({
      ...state,
      [currency]: valueAtom,
    }))
  }

  return ctx.spy(valueAtom)
})

// update could look like
ctx.get(currenciesAtom)[ctx.get(currencyAtom)](ctx, newValue)
```

You could handle each update independently by passing a function to the `spy` method. It is useful for action-reaction scenarios or if you need to handle a few concurrent updates.

```ts
export const changeCurrency = action<string>('changeCurrency')
export const currencyAtom = atom((ctx, state?: string) => {
  ctx.spy(languageAtom, (language) => {
    state = getCurrencyByLanguage(language)
  })

  ctx.spy(changeCurrency, (currency) => {
    state = currency
  })

  return state
}, 'currencyAtom')
```

## atom.pipe API

Pipe is a general chain helper, it applies an operator to the atom to map it to another thing. Classic operator interface is `<T extends Atom>(options?: any) => (anAtom: T) => aNewThing`. The main reason is a readable and type-safe way to apply decorators.

```ts
const countAtom = atom(0).pipe(
  withInit(() => localStorage.getItem('COUNT') ?? 0),
)
// equals to
const countAtom = withInit(() => localStorage.getItem('COUNT') ?? 0)(atom(0))
```

> `withInit` allows you to configure the initial state of the atom reading, which is sometimes more predictable and safer for testing.

Operator `with` prefix mean that the target atom will be changed somehow and the returned reference will the same. [reatom/async](https://www.reatom.dev/package/async) uses operators a lot to configure the behavior of the effect by composition, which is good for tree-shaking. Check naming conventions and more examples in [this guide](https://www.reatom.dev/recipes/custom-operator/)

Btw, actions has `pipe` too!

## atom.onChange API

All links and computations between atoms and actions are performed in a separate context. However, there can be many cases when you need to describe some logic between two things statically outside a context, such as an action trigger on a data change, etc. The `onChange` hook allows you to define this common logic right in the place of your atoms definition.

```ts
const searchAtom = atom('', 'searchAtom')
const fetchSearchSuggestion = action((ctx, search) => {
  /* ... */
}, 'fetchSearchSuggestion')
searchAtom.onChange((ctx, state) => fetchSearchSuggestion(ctx, state))
// or just
searchAtom.onChange(fetchSearchSuggestion)
```

`onChange` returns an unsubscribe function which you should use if you are adding a hook dynamically to a global atom.

The key difference between a hook and a subscription is that the hook does not activate the connections.

```ts
const searchAtom = atom('', 'searchAtom')
const fetchSearchSuggestion = action((ctx, search) => {
  /* ... */
}, 'fetchSearchSuggestion')

const filteredSearchAtom = atom((ctx, state = '') => {
  const search = ctx.spy(searchAtom)
  return search.length >= 3 ? search : state
}, 'filteredSearchAtom')
// the hook will not be called if the atom has no subscription, as it's lazy.
filteredSearchAtom.onChange(fetchSearchSuggestion)
```

## action API

Actions are atoms with temporal states, which live only during a transaction. The action state is an array of parameters and payloads. The array is needed to handle multiple action calls during a transaction batch. Action callbacks can change atoms or call other actions, but their dependencies will only be notified after the callback ends - that is what a batch means.

Possible usage:

```ts
const increment = action()
// increment: Action<[], void>
const increment = action('increment')
// increment: Action<[], void>

const add = action<number>()
// add: Action<[number], number>
const add = action<number>('add')
// add: Action<[number], number>
const add = action((ctx, value: number) => value)
// add: Action<[number], number>
const add = action((ctx, value: number) => value, 'add')
// add: Action<[number], number>
const splice = action((ctx, start: number, deleteCount?: number) => {
  listAtom(ctx, (list) => {
    const newList = list.slice(0)
    newList.splice(start, deleteCount)
    return newList
  })
})
// splice: Action<[number, number?], number>
```

Action state is `Array<{ params: Array<any>, payload: any }>`, but action call returns the payload:

```ts
const submit = action((ctx, name, password) => ({ name, password }))

batch(ctx, () => {
  submit(ctx, 'Joe', 'Bom')
  // { name: 'Joe', password: 'Bom' }

  submit(ctx, 'Koe', 'Rog')
  // { name: 'Koe', password: 'Rog' }

  ctx.get(submit)
  // [{ name: 'Joe', password: 'Bom' }, { name: 'Koe', password: 'Rog' }]
})
```

## action.onCall API

The same as [atom.onChange](#atomonchange-api), but with the relative arguments: `payload` and `params`.

```ts
const doSome = action((ctx, a, b) => ({ a, b }), 'doSome')
doSome.onCall((ctx, payload, params) => {
  console.log(payload, params)
  // `doSome(ctx, 1, 2)` will log "{ a: 1, b: 2 }, [1, 2]"
})
```


## createCtx API

A context creation function accepts a few optional parameters that you probably won't want to change in regular use. However, it might be useful for testing and some rare production needs.

- `callLateEffect` - Use it to delay or track late effects such as subscriptions notification
- `callNearEffect` - Use it to delay or track near effects such as API calls
- `restrictMultipleContexts` - Mange multiple contexts warning

The call effect handlers by default wrap all effects with a `catch` handler that converts the thrown value to `Error` instance to save the callstack for better debugging, and it does `setTimeout(() => { throw err })` to trigger a global handler of an uncaught error. The `setTimeout` behavior is modified in `createTestCtx` from [testing package](https://www.reatom.dev/package/testing/).

The `restrictMultipleContexts` option, which is `true` by default, will log a "multiple contexts detected" warning to the console when a few `createCtx` occur in a browser environment. We highly recommend deduping all your packages and using only one instance of each reatom package to archive the stability of all features.

## ctx API

`ctx` is the main shell that holds the state for all atoms, and where all user and metadata reside. Each atom and action produces an immutable version of the context and it should not be mutated!

An important rule to note, even if you might not need it, is: don't run one context inside another, such as ctx1.get(() => ctx2.get(anAtom)). Doing so will throw an error.

## ctx.get atom API

Get fresh atom state

`get<T>(anAtom: Atom<T>): T`

## ctx.get batch API

You can call `ctx.get` with a function to achieve batching, but it is preferred to use the separate [batch](#batch) API.

## ctx.subscribe atom API

Subscribe to atom new state. Passed callback called immediately and after each atom state change.

`subscribe<T>(anAtom: Atom<T>, cb: (newState: T) => void): () => void`

## ctx.subscribe log API

Subscribe to transaction end. Useful for logging.

`subscribe(cb: (logs: Array<AtomCache>, error?: Error) => void): () => void`

## ctx.schedule

To achieve [atomicity](https://www.reatom.dev/handbook#data-consistency), each update (action call / atom mutation) starts a complex batch operation, which tries to optimize your updates and collect them into a new immutable [log](#ctxsubscribe-log-api) of new immutable cache snapshots. If some computation throws an error (like `can't use property of undefined`) the whole update will be canceled, otherwise the new caches will be merged into the context internal `caches` weak map. To achieve purity of computations and the ability to cancel them, all side-effects should be called separately in a different queue, after all computations. This is where `schedule` comes in; it accepts an effect callback and returns a promise which will be resolved after the effect call or rejected if the transaction fails.

```ts
const fetchData = action((ctx) => {
  loadingAtom(ctx, true)
  ctx.schedule(effect).then((data) => {
    loadingAtom(ctx, false)
    dataAtom(ctx, data)
  })
})
```

A unique feature of Reatom, especially in scheduling, is ability to define the target queue. The second argument of `schedule` is a priority number:

- `-1` - rollback queue, useful when you need to do a side-effect during pure computations. Check the example [below](#ctxschedule-rollback-api).
- `0` - computations queue, schedule **pure** computation, which will call right after current batch.
- `1` - the **default** near effect queue, used to schedule regular effects. The calling of these effects can be redefined (or delayed) using the `callNearEffect` option of `createCtx`.
- `2` - lates effect queue, used to schedule subscribers. The calling of these effects can be redefined (or delayed) using the `callLateEffect` option of `createCtx`.

> Read more in the [lifecycle guild](https://www.reatom.dev/handbook#lifecycle).

## ctx.schedule rollback API

Sometimes, you may want to perform a side-effect during clean calculations or need to store an artifact of an effect. To make it clean, you should describe a rollback (cleanup) function for the case of an unexpected error by passing `-1` as the second argument of `ctx.schedule`. Check out this example with a debounced action:

```ts
const timeoutIdAtom = atom(-1)

// `timeoutIdAtom` update in a schedule causes an extra transaction, which is not handy.
export const doSome = action((ctx) => {
  const timeoutId = ctx.get(timeoutIdAtom)

  ctx.schedule(() => {
    clearTimeout(timeoutId)
    const newTimeoutId = setTimeout(some)
    timeoutIdAtom(ctx, newTimeoutId)
  })
})
// updating `timeoutIdAtom` during a transaction is more obvious.
export const doSome = action((ctx) => {
  const timeoutId = ctx.get(timeoutIdAtom)
  ctx.schedule(() => clearTimeout(timeoutId))

  const newTimeoutId = setTimeout(some)
  timeoutIdAtom(ctx, newTimeoutId)
  ctx.schedule(() => clearTimeout(newTimeoutId), -1)
})
```

## batch

Start transaction and batch all updates.

`batch<T>(ctx: Ctx, cb: () => T): T`.

Normally, all your synchronous computations should be described in a separate action. However, sometimes you already have an asynchronous action and just want to save the resulting data. Here is how it works:

```ts
import { action, atom, batch } from '@reatom/core'

export const firstNameAtom = atom('', 'firstNameAtom')
export const lastNameAtom = atom('', 'lastNameAtom')
export const fullNameAtom = atom(
  (ctx) => `${ctx.spy(firstNameAtom)} ${ctx.spy(lastNameAtom)}`,
  'fullNameAtom',
)
export const fetchUser = action(async (ctx, id: string) => {
  const user = await ctx.schedule(() => api.getUser(id))
  firstNameAtom(ctx, user.firstName)
  lastNameAtom(ctx, user.lastName)
}, 'fetchUser')

ctx.subscribe(fullNameAtom, console.log)
// log: " "
fetchUser(ctx, 1)
// log: "John "
// log: "John Doe"
fetchUser(ctx, 2)
// A MISTAKE, DATA COLLISION!
// log: "Mat Doe"
// log: "Mat Black"
```

```ts
import { action, atom, batch } from '@reatom/core'

export const firstNameAtom = atom('', 'firstNameAtom')
export const lastNameAtom = atom('', 'lastNameAtom')
export const fullNameAtom = atom(
  (ctx) => `${ctx.spy(firstNameAtom)} ${ctx.spy(lastNameAtom)}`,
  'fullNameAtom',
)
export const fetchUser = action(async (ctx, id: string) => {
  const user = await ctx.schedule(() => api.getUser(id))
  batch(ctx, () => {
    firstNameAtom(ctx, user.firstName)
    lastNameAtom(ctx, user.lastName)
  })
}, 'fetchUser')

ctx.subscribe(fullNameAtom, console.log)
// log: " "
fetchUser(ctx, 1)
// log: "John Doe"
// All good
fetchUser(ctx, 2)
// log: "Mat Black"
```

And you can use additional actions instead, of course.

```ts
import { action, atom, batch } from '@reatom/core'

export const firstNameAtom = atom('', 'firstNameAtom')
export const lastNameAtom = atom('', 'lastNameAtom')
export const fullNameAtom = atom(
  (ctx) => `${ctx.spy(firstNameAtom)} ${ctx.spy(lastNameAtom)}`,
  'fullNameAtom',
)
export const saveUser = action((ctx, firstName: string, lastName: string) => {
  firstNameAtom(ctx, firstName)
  lastNameAtom(ctx, lastName)
}, 'saveUser')
export const fetchUser = action(async (ctx, id: string) => {
  const user = await ctx.schedule(() => api.getUser(id))
  saveUser(ctx, user.firstName, user.lastName)
}, 'fetchUser')

ctx.subscribe(fullNameAtom, console.log)
// log: " "
fetchUser(ctx, 1)
// log: "John Doe"
// All good
fetchUser(ctx, 2)
// log: "Mat Black"
```

But beware, in the example above, `saveUser` starts a new synchronous transaction because it is called after the await. If you need to call multiple actions, such as `saveUser` and `loading(ctx, false)`, there will still be two transactions. You should either batch these action calls with `batch` again or move them to another action like `resolveFetchUser`, for example.

In the code below in a User component which subscribes to `isUserLoadingAtom` and `fullNameAtom` will be two rerenders, where the first contains the fetched full name but still shows the loader and the only second one will show the full name without loader.

```ts
import { action, atom, batch } from '@reatom/core'

export const isUserLoadingAtom = atom(false, 'isUserLoadingAtom')
export const firstNameAtom = atom('', 'firstNameAtom')
export const lastNameAtom = atom('', 'lastNameAtom')
export const fullNameAtom = atom(
  (ctx) => `${ctx.spy(firstNameAtom)} ${ctx.spy(lastNameAtom)}`,
  'fullNameAtom',
)
export const saveUser = action((ctx, firstName: string, lastName: string) => {
  firstNameAtom(ctx, firstName)
  lastNameAtom(ctx, lastName)
}, 'saveUser')
export const fetchUser = action(async (ctx, id: string) => {
  isUserLoadingAtom(ctx, true)
  try {
    const user = await ctx.schedule(() => api.getUser(id))
    saveUser(ctx, user.firstName, user.lastName)
    isUserLoadingAtom(ctx, false)
  } catch {
    isUserLoadingAtom(ctx, false)
  }
}, 'fetchUser')
```

Here is the fixed version, which will force to rerender the user component only once with the all final correct data.

```ts
import { action, atom, batch } from '@reatom/core'

export const isUserLoadingAtom = atom(false, 'isUserLoadingAtom')
export const firstNameAtom = atom('', 'firstNameAtom')
export const lastNameAtom = atom('', 'lastNameAtom')
export const fullNameAtom = atom(
  (ctx) => `${ctx.spy(firstNameAtom)} ${ctx.spy(lastNameAtom)}`,
  'fullNameAtom',
)
export const saveUser = action((ctx, firstName: string, lastName: string) => {
  firstNameAtom(ctx, firstName)
  lastNameAtom(ctx, lastName)
}, 'saveUser')
export const resolveFetchUser = action(
  (ctx, firstName: string, lastName: string) => {
    saveUser(ctx, firstName, firstName)
    isUserLoadingAtom(ctx, false)
  },
  'resolveFetchUser',
)
export const fetchUser = action(async (ctx, id: string) => {
  isUserLoadingAtom(ctx, true)
  try {
    const user = await ctx.schedule(() => api.getUser(id))
    resolveFetchUser(ctx, user.firstName, user.lastName)
  } catch {
    isUserLoadingAtom(ctx, false)
  }
}, 'fetchUser')
```

The code above is a perfect example of code decomposition. It also produces a lot of logs about each step of the data processing. However, if you want, you can reduce the amount of code with the 'batch' method.

```ts
import { action, atom, batch } from '@reatom/core'

export const isUserLoadingAtom = atom(false, 'isUserLoadingAtom')
export const firstNameAtom = atom('', 'firstNameAtom')
export const lastNameAtom = atom('', 'lastNameAtom')
export const fullNameAtom = atom(
  (ctx) => `${ctx.spy(firstNameAtom)} ${ctx.spy(lastNameAtom)}`,
  'fullNameAtom',
)
export const fetchUser = action(async (ctx, id: string) => {
  isUserLoadingAtom(ctx, true)
  try {
    const user = await ctx.schedule(() => api.getUser(id))
    batch(ctx, () => {
      isUserLoadingAtom(ctx, false)
      firstNameAtom(ctx, user.firstName)
      lastNameAtom(ctx, user.lastName)
    })
  } catch {
    isUserLoadingAtom(ctx, false)
  }
}, 'fetchUser')
```
