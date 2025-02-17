---
title: Debugging
description: Explaining how to install and use debug tools
sidebar:
  order: 3
show: false
---

<!-- TODO add `anAtom.onChange(console.log)` docs above -->

For debugging, we recommend using the `@reatom/logger` package, which is included in the `@reatom/framework`. It logs all you actions and atoms changes in the console if you named it properly.

## Installation

```sh
npm i @reatom/logger
```

After the installation is finished, you need to connect the logger to the reatom context.

```ts
import { createCtx } from '@reatom/core'
import { connectLogger } from '@reatom/logger'

const ctx = createCtx()

if (import.meta.env.DEV) {
  connectLogger(ctx)
}
```

## Usage

The immutable nature of reatom gives us incredible possibilities for debugging any data flow, whether synchronous or asynchronous.
Let's start with a simple example.

```ts
import { createCtx, atom, action } from '@reatom/core'
import { connectLogger } from '@reatom/logger'

const ctx = createCtx()

if (import.meta.env.DEV) {
  connectLogger(ctx)
}

const counterAtom = atom(0, 'counterAtom')
const doubledAtom = atom((ctx) => counterAtom * 2, 'doubledAtom')
const increment = action(
  (ctx) => counterAtom(ctx, (state) => state + 1),
  'increment',
)

ctx.subscribe(doubledAtom, () => {})

increment(ctx, 24)
```

Here is what we see in logs:

```
Reatom 1 transaction
├─ 3:37:34 PM 477ms
├─ increment
│  └─ 1
├─ counterAtom
│  ├─ cause: "<-- increment"
│  ├─ history: [...]
│  ├─ newState: 1
│  ├─ oldState: 0
│  └─ patch: {...}
├─ doubledAtom
│  ├─ cause: "<-- counterAtom <-- increment"
│  ├─ history: [...]
│  ├─ newState: 2
│  ├─ oldState: 0
│  └─ patch: {...}
```

Records come in pairs: the atom and its new state value.
Under the atom name record, you can find a few properties:

- cause: Describes why this update happened and what triggered it.
- history: Shows the atom values before the update.

Check out the [@reatom/logger](/package/logger) package documentation for available options.

Try to use [@reatom/eslint-plugin](/package/eslint-plugin/) to automate the names indication.
