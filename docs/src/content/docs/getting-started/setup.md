---
title: Setup
description: Explaining initial setup
sidebar:
  order: 1
---

Reatom is a framework-agnostic state manager, meaning you can use it with various adapters for different frameworks.
This guide focuses on using Reatom with React.js, as it's currently the most popular view library.

## Create new project from template

The base template project includes Vite, TypeScript, React and Reatom ecosystem.
You can check in out [here](https://github.com/artalar/reatom-react-ts)

You can also try it online:

- [codesandbox](https://codesandbox.io/p/sandbox/github/artalar/reatom-react-ts/tree/main)
- [stackblitz](https://githubblitz.com/artalar/reatom-react-ts)
- [gitpod](https://gitpod.io/#https://github.com/artalar/reatom-react-ts)

To setup it in your machine you can use the [degit](https://github.com/Rich-Harris/degit) package.

```sh
npx degit github:artalar/reatom-react-ts PROJECT-NAME
cd PROJECT-NAME

npm install
npm run dev
```

## Add to existing project

```sh
npm i @reatom/core
```

### With React

#### Installation

```sh
npm i @reatom/npm-react
```

You need to set up the main context and wrap your application in a provider at the top level.

```jsx
import { createCtx } from '@reatom/core'
import { reatomContext } from '@reatom/npm-react'
import { Main } from './path/to/an/Main'

const ctx = createCtx()

export const App = () => (
  <reatomContext.Provider value={ctx}>
    <Main />
  </reatomContext.Provider>
)
```

#### Usage

The `useAtom` function lets you manage state similar to `useState`, but with the added benefit of shared atom state.

```jsx
const nameAtom = atom('Joe')
const greetingAtom = atom((ctx) => `Hello, ${ctx.spy(nameAtom)}!`)

const Greeting = () => {
  const [name, setName] = useAtom(nameAtom)
  const [greeting] = useAtom(greetingAtom)

  return (
    <>
      <label>
        What is your name?:
        <input value={name} onChange={(e) => setName(e.currentTarget.value)} />
      </label>
      <h1>Hello {greeting}!</h1>
    </>
  )
}
```

Additionally, you can create computed atoms (similar to selectors) directly inside `useAtom`.

```jsx
const nameAtom = atom('Joe')

const Greeting = () => {
  const t = useTranslation()
  const [name, setName] = useAtom(nameAtom)
  const [greeting] = useAtom(
    (ctx) => `${t('common:GREETING')} ${ctx.spy(nameAtom)}!`,
    [t],
  )

  return (
    <>
      <label>
        What is your name?:
        <input value={name} onChange={(e) => setName(e.currentTarget.value)} />
      </label>
      <h1>{greeting}!</h1>
    </>
  )
}
```

This is just the basic functionality of reatom-react bindings.
For more details, check out the @reatom/npm-react package documentation.

<!--
### With Solid

### With Vue
-->
