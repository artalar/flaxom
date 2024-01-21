Reatom integration for Vue Composition API.

## Installation

```sh
npm i @reatom/npm-vue
```

## API

### `createReatomVue`

A function that creates a [Vue App plugin](https://vuejs.org/guide/reusability/plugins.html#plugins) which you can use. Accepts a `Ctx` object or creates one if it's not provided.

```ts
import { createReatomVue } from '@reatom/npm-vue'

app.use(createReatomVue())
```

### `reatomRef`

A function that turns a Reatom atom into a Vue ref which is updated on target atom changes. A returned pseudo-ref is mutable if a target atom is mutable itself.

Because all Reatom APIs require `ctx` to be available, you must either provide it with `createReatomVue` plugin or pass it explicitly as a second argument to `reatomRef`.

## Example

See the [source code](https://github.com/artalar/reatom/tree/v3/examples/vue-issues) or open in [StackBlitz](https://stackblitz.com/github/artalar/reatom/tree/v3/examples/vue-issues)

## Usage

Setup `ctx` somewhere in the app root:

```ts
import { createCtx } from '@reatom/core'
import { createReatomVue } from '@reatom/npm-vue'

const ctx = createCtx()
app.use(createReatomVue(/* optional */ ctx))
```

Then use Reatom state in your components:

```ts
import { reatomRef } from '@reatom/npm-vue'

const count = atom(0, 'count')

// turn an atom into a ref-like object
const countRef = reatomRef(count)
// selectors are supported as well
const countDoubleRef = reatomRef((ctx) => ctx.spy(count) * 2)

countRef // Ref<number>
countRef.value // 0
countRef.value = 3 // 3

countDoubleRef // Readonly<Ref<number>>
countDoubleRef.value // 6
```
