---
title: Debugging
description: Explaining how to install and use debug tools
sidebar:
  order: 3
---

For debugging we recommend `@reatom/logger` package (included in `@reatom/framework`)

## Installation

```sh
npm i @reatom/logger
```

After install finished you need to connect logger to reatom context

```ts
import { createCtx } from '@reatom/core'
import { connectLogger } from '@reatom/logger'

const ctx = createCtx();
connectLogger(ctx);
```
More settings you can found in [@reatom/logger](@reatom/logger) documentation

## Usage

Immutable nature of Reatom give us incredible possibilities for debugging any data flow kind: synchronous and asynchronous.  
Let's start from simple example.
```ts
import { createCtx, atom } from '@reatom/core'
import { connectLogger } from '@reatom/logger'

const ctx = createCtx();
connectLogger(ctx);

const counterAtom = atom(0)
const doubledAtom = atom((ctx) => counterAtom * 2)

counterAtom(ctx, 24)
```
This is what we see in logs:
```
Reatom 1 transaction
├─ 3:37:34 PM 477ms
├─ counterAtom
│  ├─ cause: "root"
│  ├─ history: [...]
│  ├─ newState: 0
│  ├─ oldState: 24
│  ├─ patch: {...}
│  └─ time: 275.94
├─ 24
├─ doubledAtom
│  ├─ cause: "<-- counterAtom"
│  ├─ history: [...]
│  ├─ newState: 0
│  ├─ oldState: 48
│  ├─ patch: {...}
│  └─ time: 275.96
└─ 48
 ```
 Records comes in pairs: atom and new state value.
 Under atom name record you can found few properties:
 - cause - describe why this update happens, why trigger it
 - history - atom values that was before update

More complex example you can find in [@reatom/logger](/package/logger) package documentation
