> included in [@reatom/framework](https://www.reatom.dev/package/framework)

All atoms and actions have a hooks to they lifecycle, this package exposes friendly helpers to use this hooks.

We assumes that you already read [lifecycle guide](https://www.reatom.dev/handbook#lifecycle).

A lot of cool examples you could find in [async package docs](https://www.reatom.dev/package/async).

## onConnect

`onConnect` allows you to react to atom connection (first subscribtion). Optionally, you could return a cleanup callback.

All connection (and disconnection) callbacks calling during effects queue - outside batching. The returned value is a dispose function used to deactivate the hook.

"Connection" refers to the presence of any number of subscribers in the atom. The first subscriber activates the connection status, while the second subscriber does not interact with it. Unsubscribing the first subscriber has no effect since there is still one subscriber (the second one). However, after unsubscribing the second subscriber, the connection status will be deactivated, all related `ctx.schedule` will throws `AbortError` and if a cleanup callback is provided, it will be triggered. You can read more in the [lifecycle guide](https://www.reatom.dev/handbook#lifecycle).

```ts
import { atom } from '@reatom/core'
import { onConnect } from '@reatom/hooks'

export const messagesAtom = atom([], 'messagesAtom')
const dispose = onConnect(messagesAtom, (ctx) => {
  const cb = (message) => {
    messagesAtom(ctx, (messages) => [...messages, message])
  }

  WS.on('message', cb)

  return () => WS.off('message', cb)
})
```

Since connection context follow Reatom concurrent abort strategy, you can use any infinity effects with a leaks safety. In the example above the loop will not stack forever, if the atom will disconnected, as the schedule method will throw an abort error in this case.

```ts
// lazy retry logic
onConnect(fetchSome.dataAtom, async (ctx) => {
  while (true) {
    await ctx.schedule(() => sleep(5_000))
    await fetchSome(ctx)
  }
})
```

> **Deprecated!** The passed `ctx` has an `isConnected` method to check the current status of the passed atom. You can refer to the [async example](https://www.reatom.dev/package/async#periodic-refresh-for-used-data) for more information. Additionally, the `ctx` includes a `controller` property, which is an AbortController. You can conveniently reuse it with `reatomAsync`. For further details, you can refer to [another async example](https://www.reatom.dev/package/async#abortable-process).

### Comparison with React

For example, in React you should manage abort strategy by yourself by `useEffect`, if you want to cancel async process on unmount.

```tsx
import { reatomAsync, withAbort, withDataAtom } from '@reatom/async'
import { useAtom, useAction } from '@reatom/npm-react'

export const fetchList = reatomAsync((ctx) => request('api/list', ctx.controller), 'fetchList').pipe(
  withAbort(),
  withDataAtom([]),
)

export const List = () => {
  const [list] = useAtom(fetchList.dataAtom)
  const handleFetch = useAction(fetchList)
  const handleAbort = useAction(fetchList.abort)

  useEffect(() => {
    handleFetch()
    return handleAbort
  }, [])

  return <ul>{list.map(() => '...')}</ul>
}
```

With Reatom, you can simplify it and make it more readable.

```tsx
import { reatomAsync, onConnect, withDataAtom } from '@reatom/framework'
import { useAtom } from '@reatom/npm-react'

export const fetchList = reatomAsync((ctx) => request('api/list', ctx.controller), 'fetchList').pipe(withDataAtom([]))
onConnect(fetchList.dataAtom, fetchList)

export const List = () => {
  const [list] = useAtom(fetchList.dataAtom)

  return <ul>{list.map(() => '...')}</ul>
}
```

Isn't it cool, how the size of the code is reduced and how the logic is simplified?

## onDisconnect

Shortcut to `onConnect` returned callback.

## withInit

This operator helps you to initialize the state lazily on the first atom read.

```ts
import { atom } from '@reatom/core'
import { withInit } from '@reatom/hooks'

export const langAtom = atom('', 'langAtom').pipe(
  withInit(() => navigator.languages?.[0] ?? (navigator.language || navigator.userLanguage)),
)
```

You can use it to depend the init state from an other atom too.

```ts
import { atom } from '@reatom/core'
import { withInit } from '@reatom/hooks'

export const pageTitleAtom = atom('', 'pageTitleAtom')

export const searchAtom = atom('', 'searchAtom').pipe(withInit((ctx) => ctx.get(pageTitleAtom)))
```

Also, you can use it to do a side effects in rare cases.

```ts
export const pageUptimeAtom = atom(0, 'pageUptimeAtom').pipe(
  withInit((ctx) => {
    setTimeout(() => pageUptimeAtom(ctx, performance.now()), 1000)
    return performance.now()
  }),
)
```

```ts
export const dataAtom = atom(0, 'dataAtom').pipe(
  withInit((ctx, init) => {
    ctx.get(socketServiceAtom).on('data', (data) => dataAtom(ctx, data))

    return init(ctx)
  }),
)
```

Note that the subscription will leave forever. To manage resources more efficiently, you can use should use probably [onConnect](#onconnect).

## isInit

This utility allows you to check that the current atom or action is being called for the first time (in the current context). It is useful to perform some initialisation effects only once.

```ts
import { action } from '@reatom/core'
import { isInit } from '@reatom/hooks'

export const doSome = action((ctx, payload) => {
  if (isInit(ctx)) {
    // setup
  }
  return work()
})
```

## onUpdate

The `onUpdate` hook allows you to react to state updates of the passed atom. However, **this hook will be deprecated in the future**. It is recommended and more convenient to use the atom's `onChange` method and the action's `onCall` method. You can find more information about these methods in the [core package documentation](https://www.reatom.dev/core/#atomonchange-api).

For general computed atoms (via `ctx.spy`), it is only called when the atom is connected. You can read more in the [lifecycle guide](https://www.reatom.dev/handbook#lifecycle).

One unique feature of `onUpdate` is that it could activate the entire chain of dependent atoms **if they are `LensAtom` or `LensAction`** from the [lens package](https://www.reatom.dev/package/lens/). It useful when you want to delay or sample the reaction.

```ts
import { onUpdate } from '@reatom/hooks'
import { debounce } from '@reatom/lens'

onUpdate(onChange.pipe(debounce(250)), (ctx) => fetchData(ctx))
```

<!-- Very simplified example of lazy analytics connection.

```ts
// analytics.ts
import { isAtom } from '@reatom/core'
import { onUpdate } from '@reatom/hooks'
import * as moduleA from '~/module-a'
// ...
import * as moduleN from '~/module-N'

for (const mod of [moduleA, moduleN]) {
  for (const name of Object.keys(mod)) {
    if (isAtom(mod[name])) {
      onUpdate(mod[name], (ctx, data) => analyticsService.send(name, data))
    }
  }
}
``` -->
