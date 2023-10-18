---
title: Examples
description: Complex examples of Reatom state manager
---

### Data fetching and React

https://codesandbox.io/s/reatomasync-9t0x42?file=/src/model.ts

### Next.js + Reatom

A close-to-real-life example of SSR (Server-Side Rendering) with API data hydration. The cool thing is that the code is almost isomorphic. You can check [this commit](https://github.com/artalar/reatom-nextjs/commit/ca0099bcddc0fbd5bc8c76eeb160f828838453d7) to understand how simple it is to turn on SSR for an existing code with Reatom.

https://github.com/artalar/reatom-nextjs

### Migration from RTK

https://github.com/artalar/RTK-entities-basic-example/pull/1

### Search component

This example is close to real life and shows the complexity of interactive UI. It uses [async package](https://www.reatom.dev/package/async) to handle classic search edge cases and made perfect UX.

https://codesandbox.io/s/reatom-react-search-component-l4pe8q?file=/src/App.tsx

### Dynamic atom creation

This example shoes how to use [atomization](https://www.reatom.dev/guides/atomization) to improve editable fields performance, persists it to localStorage.

https://codesandbox.io/s/reatom-react-atomization-k39vrs?file=/src/App.tsx

### Data fetching and Svelte

https://svelte.dev/repl/0613e23e6aa74246afad6d726d6c5a33?version=3.55.0

### Tree-like dependent reactive structure

Nested checkboxes with indeterminate states could be realy hard and unoptimal in reactive context. This example shows the complex optimized model for tree-like structure, check [the model file](https://github.com/artalar/reatom-react-tree/blob/main/src/model.ts)https://github.com/artalar/reatom-react-tree/blob/main/src/model.ts.
