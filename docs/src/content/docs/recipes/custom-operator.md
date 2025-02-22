---
title: Custom operator
description: How to create custom operators to improve your code and modularize it
---

All atoms and actions by default include the [pipe operator](/package/core#atompipe-api) for easy extending and composing.
You can create your own operators to enhance your code and make it more modular.

We assume that you've already read the [core](/package/core) docs.

## Prefix and types

Operator for the pipe function should starts with a verb.

```ts
import { Atom, CtxSpy } from '@reatom/core'

declare function mapState<T, Res>(
  mapper: Fn<[CtxSpy, T, undefined | T], Res>,
  name?: string,
): (anAtom: Atom<T>) => Atom<Res>
```

> [Real `mapState`](/package/lens#mapstate)

If an operator doesn't create a new atom and instead mutates the passed one, you should use the `with` prefix.

```ts
import { Atom, AtomState } from '@reatom/core'

declare function withStateHistory<T extends Atom>(
  length: string,
): (anAtom: T) => T & {
  stateHistoryAtom: Atom<AtomState<T>>
}
```

We use `T extends Atom` instead of the simpler `<T>(length: string): (anAtom: Atom<T>) => Atom<T> & {...}` to preserve all additional properties added by previous operators.

> [Real `historyAtom`](/package/undo)

## Example

[![codesandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/sandbox/reatom-custom-operator-example-mym3vo)

```ts
import { action, atom, Atom } from '@reatom/core'

// operator accepts an options by a first argument
// and returns function witch accepts target atom
export const delay =
  <T>(ms: number) =>
  (anAtom: Atom<T>) => {
    // to improve debugability compute name of the new atom
    const name = `${anAtom.__reatom.name}.delay`
    // hide unnecessary meta by `_` prefix in name
    const update = action<T>(`${name}._update`)
    const updateTimeout = atom(-1, `${name}._updateTimeout`)

    return atom((ctx, prevState?: T) => {
      const state = ctx.spy(anAtom)
      // more about action spying: https://www.reatom.dev/package/core#action-api
      const updates = ctx.spy(update)

      // first call, no need to delay
      if (prevState === undefined) return state

      // update from the schedule below
      if (updates.length) return updates.at(-1)!.payload

      // do not forget to schedule all side effects!
      ctx.schedule(() => {
        clearTimeout(ctx.get(updateTimeout))
        const timeout = setTimeout(() => update(ctx, state), ms)
        updateTimeout(ctx, timeout)
      })

      return prevState
    }, name)
  }
```

> [Real `debounce`](https://www.reatom.dev/package/lens#debounce)

## Advanced example

This example demonstrates complexity of **hot**ness and **cold**ness of reactive nodes.

Let's break down the implementation of `withReadyAtom` for [@reatom/async](/package/async/). That'll be cool!

First, take a look to the result, then we will disassemble this code step by step:

```ts
import { AsyncAction } from '@reatom/async'
import { Atom, atom } from '@reatom/core'

export const withReadyAtom =
  <T extends AsyncAction & { dataAtom?: Atom }>(initState = false) =>
  (anAsync: T): T & { readyAtom: Atom<boolean> } => {
    // use `spy` to prevent any race conditions
    const readyAtom = atom((ctx, state?: boolean) => {
      // trigger connection to start the fetch if `onConnect` used
      if (anAsync.dataAtom) ctx.spy(anAsync.dataAtom)

      const pending = ctx.spy(anAsync.pendingAtom)

      return state === undefined ? initState : pending === 0
    }, `${anAsync.__reatom.name}.readyAtom`)

    // grand correct state even for unconnected atom
    anAsync.pendingAtom.onChange((ctx) => {
      ctx.get(readyAtom)
    })

    return Object.assign(anAsync, { readyAtom })
  }
```

The logic is simple: the atom represents a flag indicating that the fetching of data has been done (in one way or another). You can find this useful if you are used to code like this:

```jsx
if (!ctx.spy(fetchSome.readyAtom)) {
  return <Loading />
}

if (ctx.spy(fetchSome.errorAtom)) {
  return <Error />
}

return <Data />
```

The native `pendingAtom` is not very useful here because it's 0 by default, and we'll get a flash of empty content instead of a neat loader during the first render.

Let's start by defining a generic variable which should have an optional `dataAtom`. Otherwise, we'll have to use @ts-ignore to access this atom. We need this atom to trigger a connection, with something like `onConnect(fetchSome.dataAtom, fetchSome)` a [resource](/package/async/#reatomresource). Without this, we'll never touch `dataAtom`, thus never trigger fetch and get stuck in a forever-loading state.

Then let's `spy` the `pendingAtom`, but we use its value only on the second and following reads of `readyAtom`. If it's the first read, we just show the initial state.

Now we get to an interesting but tricky part. We set `onChange` on the atom we just have spied on, but we don't do anything with this changed value. This trick is needed because of the way atoms get invalidated and because atoms are lazy by default.

When you spy (read and subscribe) on an atom, reatom guarantees you immediate invalidation of the atom. This means that when you change `pendingAtom`, every atom spying on it will get invalidated and recalculated when you need their value.

Note that if you try to implement similar behavior only using `onChange`, making readyAtom a simple `AtomMut<boolean>` without computed bindings, you may get an intermediate invalid state when `pendingAtom` has already changed but `onChange` has not yet triggered.
