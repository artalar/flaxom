---
title: Atomization
description: How to do factories in a correct way with Reatom
order: 1
---

You could store your backend data in atoms without any mappings, but it's a good practice to wrap parts of your model in atoms for better control and access to more reactive features.

The rule is simple: **mutable properties should be atoms, readonly properties should stay as primitives**.

> [DTO](https://en.wikipedia.org/wiki/Data_transfer_object) is data from the backend, but the application model can differ slightly.

For example, if you have a user model with an editable name property:

```ts
// ~/features/user/model.ts
import { AtomMut, action, atom } from '@reatom/core'

type UserDto = {
  id: string
  name: string
}

type User = {
  id: string
  name: AtomMut<string>
}

export const userAtom = atom<null | User>(null, 'user')

export const fetchUser = action(
  (ctx) =>
    ctx.schedule(async () => {
      const userDto = await api.getUser()
      const user = { id: userDto.id, name: atom(userDto.name, 'user.name') }
      userAtom(ctx, user)
    }),
  'fetchUser',
)

export const syncUserName = action((ctx) => {
  const name = ctx.get(ctx.get(userAtom).name)
  return ctx.schedule(() => api.updateUser({ name }))
}, 'syncUserName')
```

```ts
// ~/features/user/index.tsx
import { useAction, useAtom } from '@reatom/npm-react'

// user component
const [name] = useAtom((ctx) => ctx.spy(ctx.get(userAtom).name))

const handleChange = useAction((ctx, e: React.ChangeEvent<HTMLInputElement>) =>
  ctx.get(userAtom).name(ctx, e.currentTarget.name),
)

const handleSubmit = useAction(syncUserName)
```

If you have a list of users and need to perform CRUD operations (paging, sorting, adding) on it, you should wrap it in an atom too:

> Check out our simple primitives for working with arrays: [reatomArray](/package/primitives#reatomarray)

```ts
// DTO
type Users = Array<{
  id: string
  name: string
}>

// App
type Users = AtomMut<
  Array<{
    id: string
    name: AtomMut<string>
  }>
>
```

## Reducing computational complexity

Continuing from the example above, wrapping editable properties of a list element in atoms helps prevent excessive immutable work, like array recreation.

In classic immutable state managers, it's common to recreate the entire array with a new element reference for each property update, but this could be more optimal.
Reatom offers a solution by allowing you to replace changeable properties with stable atom references, separating data structure definition and mutation.

This approach is generally called the **ref pattern**.
In Reatom, we call it **atomization**, and it's much more useful than other solutions.

```ts
// redux way: O(n)
export const updateUserName = (state, idx, name) => {
  const newList = [...state.users]
  newList[idx] = { ...newList[idx], name }
  return { ...state, list: newList }
}

// reatom way: O(1)
export const updateUserName = action((ctx, idx, name) => {
  const nameAtom = ctx.get(listAtom)[idx].name
  nameAtom(ctx, name)
})
```

Note that an atom is both a getter and a setter for its state, so you usually don't need to write an `updateUserName` action. You can directly modify the name atom in the relevant component.

In most libraries, this is an anti-pattern because it's challenging to debug what and where changes were made. However, in Reatom, you have `cause` tracking, allowing you to inspect the reason for any atom change. This provides an even better debugging experience than working with plain JSON data structures.

Another cool feature and significant benefit of this pattern is seen when you have a computed list derived from another list.
For example, mapping a list of JSX elements will re-render each property update.
This issue can only be fixed with normalization, which is more complex and less powerful than atomization.

## Reasonability

"Mutable properties could be an atom, readonly properties should stay a primitive" is a general rule, but exceptions exist.
For example, if you have a huge list (>10,000) of entities with many editable properties (>10), it may not be optimal to create an atom for each property.
In such cases, wrapping an entity in an atom with primitive properties and updating it by recreating the entity object is more reasonable.

This is where explicit atom declarations shine.
In state managers with proxy-based APIs, you often can't control atom/store/signal creation, and using a dot creates an observer.
While implicit reactivity is convenient for simple cases, it's not flexible enough for complex ones.

Reatom aims to be simple and brief, but its main design goal is to be the best tool for large applications, ensuring developers retain control.
