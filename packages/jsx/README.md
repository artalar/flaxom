An **EXPERIMENTAL** JSX runtime for describing dynamic DOM UIs with Reatom.

## Core benefits

- No extra build step needed; we use plain TSX (JSX), which is currently supported in various tools.
- Nice integrations with the platform; `<div />` returns the real element.
- Rerender-less architecture with direct reactive bindings, which means extreme performance!
- Only 1kb runtime script (excluding the tiny core package).
- Built-in CSS management with a simple API and efficient CSS variables usage.

[![Try it out in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/artalar/reatom/tree/v3/examples/reatom-jsx)

## Installation

You can use `@reatom/core` instead of the framework, but we highly recommend using the framework to access the maximum features of Reatom.

```sh
npm install @reatom/framework @reatom/jsx
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@reatom/jsx"
  }
}
```

`vite.config.js`:

```js
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'hf',
    jsxInject: `import { h, hf } from "@reatom/jsx";`,
  },
})
```

### Using with different framework.

You can use different JSX pragmas in different files. For example, if you have a React project and want to speedup some of you components, you can write them with reatom/jsx with a couple of simple steps:

- create a separate package for you Reatom components
- insert `tsconfig.json` as described above, you can use [extends](https://www.typescriptlang.org/tsconfig#extends) property, to use your project configurations
- in every `*.tsx` file use the following code:

```tsx
// @jsxRuntime classic
// @jsx h
import { h } from '@reatom/jsx'
```

## Example

> Advanced example with dynamic entities you can find here: https://github.com/artalar/reatom/tree/v3/examples/reatom-jsx

Define a component:

```ts
import { atom, action } from '@reatom/core'

export const inputAtom = atom('')
const onInput = action((ctx, event) => inputAtom(ctx, event.currentTarget.value))
export const Input = () => <input value={inputAtom} on:input={onInput} />
```

Render it:

```tsx
import { connectLogger } from '@reatom/framework'
import { ctx, mount } from '@reatom/jsx'
import { App } from './App'

if (import.meta.env.MODE === 'development') {
  connectLogger(ctx)
}

mount(document.getElementById('app')!, <App />)
```

You can create `ctx` manually and use it to create a scoped render instance with `reatomJsx`.

## Reference

This library implements a common TypeScript JSX factory that creates and configures **native** DOM elements.

By default, props passed to the JSX factory are set as properties. Add `attr:` prefix to the name to set element attribute instead of property.

For all kinds of properties you can pass a primitive value or an atom with a primitive value.

The `children` prop specifies the inner content of an element, which can be one of the following:

- `false`/`null`/`undefined` to render nothing
- a string or a number to create a text node
- a native DOM node to insert it as-is
- an atom or a function returning any option listed above

### Handling events

Use `on:*` props to add event handlers. Passed functions are automatically bound to a relevant `Ctx` value: `on:input={(ctx, event) => setValue(ctx, event.currentTarget.value)}`.

### Models

For simple `AtomMut` bindings to the native input you can use `model:value` syntax, where "value" could be: `value`, `valueAsNumber`, `checked`.

```tsx
export const inputAtom = atom('')
export const Input = () => <input model:value={inputAtom} />
```

By the way, you can safely create any needed resources inside a component body, as it calls only once when it created.

```tsx
export const Input = () => {
  export const input = atom('')
  return <input model:value={input} />
}
```

### Styles

Object-valued `style` prop applies styles granularly: `style={{top: 0, display: equalsFalseForNow && 'none'}}` sets `top: 0;`.

`false`, `null` and `undefined` style values remove the property. Non-string style values are stringified (we don't add `px` to numeric values automatically).

Incorrect:

```tsx
<div style={atom((ctx) => (ctx.spy(bool) ? { top: 0 } : { bottom: 0 }))}></div>
```

Correct:

```tsx
<div
  style={atom((ctx) => ctx.spy(bool)
    ? ({top: 0; bottom: undefined})
    : ({top: undefined; bottom: 0}))}
></div>
```

To define a style property value, you should prepend the namespace `style:`:

```tsx
// <div style="top: 10px; right: 0;"></div>
<div
  style:top={atom('10px')}
  style:right={0}
  style:bottom={undefined}
  style:left={null}
></div>
```

### Class name utility

The `cn` function is designed for creating a string of CSS classes. It allows the use of multiple data types: strings, objects, arrays, functions, and atoms, which are converted into a class string.

```ts
cn('my-class') // Atom<'my-class'>

cn(['first', atom('second')]) // Atom<'first second'>

/** The `active` class will be determined by the truthiness of the data property `isActiveAtom`. */
cn({ active: isActiveAtom }) // Atom<'active' | ''>

cn((ctx) => (ctx.spy(isActiveAtom) ? 'active' : undefined)) // Atom<'active' | ''>
```

The `cn` function supports various complex data combinations, making it easier to declaratively describe classes for complex UI components.

```ts
const Button = (props) => {
  /** @example Atom<'button button--size-medium button--theme-primary button--is-active'> */
  const classNameAtom = cn((ctx) => [
    'button',
    `button--size-${props.size}`,
    `button--theme-${props.theme}`,
    {
      'button--is-disabled': props.isDisabled,
      'button--is-active': ctx.spy(props.isActive) && !ctx.spy(props.isDisabled),
    },
  ])

  return <button class={classNameAtom}>{props.children}</button>
}
```

### CSS-in-JS

We have a minimal, intuitive, and efficient styling engine tightly integrated with components. You can set a styles in `css` prop and all relative css-variables to `css:variable-name` prop.

> The example below is correctly formatted by Prettier and has syntax highlighting provided by the 'vscode-styled-components' extension

```tsx
export const HeaderInput = ({ size = 0 }) => {
  const input = atom('')
  const size = atom((ctx) => ctx.spy(input).length)
  return (
    <input
      model:value={input}
      css:size={size}
      css={`
        font-size: calc(1em + var(--size) * 0.1em);
      `}
    />
  )
}
```

Under the hood, it will create a unique class name and will be converted to this code:

```tsx
export const HeaderInput = ({ size = 0 }) => {
  const input = atom('')
  const size = atom((ctx) => ctx.spy(input).length)
  return (
    <input
      className={createAndInsertClass(`
        font-size: calc(1em + var(--size) * 0.1em);
      `)}
      style={atom((ctx) => ({
        '--size': ctx.spy(size),
      }))}
    />
  )
}
```

### Components

Components in `@reatom/jsx` are just functions returning JSX elements. They neither have state nor any lifecycle associated with them. Because component instantiation boils down into function calls, features like `$spread` are not supported in them.

You can put an atom with a list of other elements as a children of an element to archive rendering of a dynamic list. But be note that you can't put a as children a few atoms with a list and other elements, as the [fragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment) is not supported to replace itself.

> You should know that when you create a component which uses some atoms, it creates a subscription to those atoms immediately. The subscription will disposed only after you will put the elements to the `mount`ed node and if it will be unused after some condition rendering. Do not put the same elements as a children to other elements a few times! Recreate them with a component instead.

### Spreads

In Reatom, there is no concept of "rerender" like React. Instead, we have a special `$spread` prop that can be used to spread props reactively.

```tsx
<div
  $spread={atom((ctx) => (ctx.spy(valid) ? { disabled: true, readonly: true } : { disabled: false, readonly: false }))}
/>
```

### SVG

To create elements with names within the SVG namespace, you should prepend `svg:` to the tag name:

```tsx
const anSvgElement = (
  <svg:svg>
    <svg:path d="???" />
  </svg:svg>
)
```

If you need to use SVG as a string, you can choose from these options:

Option 1:

```tsx
const SvgIcon = (props: { svg: string }) => {
  const svgEl = new DOMParser().parseFromString(props.svg, 'image/svg+xml').children.item(0) as SVGElement
  return svgEl
}
```

Option 2:

```tsx
const SvgIcon = (props: {svg: string}) => {
  return (
    <svg:svg
      prop:outerHTML={props.svg}
    ><svg:svg>
  )
}
```

### Ref

The `ref` property is used to create and track references to DOM elements, allowing actions to be performed when these elements are mounted and unmounted.

```tsx
<button
  ref={(ctx: Ctx, el: HTMLButtonElement) => {
    el.focus()
    return (ctx: Ctx, el: HTMLButtonElement) => el.blur()
  }}
></button>
```

Mounting and unmounting functions are called in order from child to parent.

```tsx
<div
  ref={(ctx: Ctx, el: HTMLDivElement) => {
    console.log('mount', 'parent')
    return () => console.log('unmount', 'parent')
  }}
>
  <span
    ref={(ctx: Ctx, el: HTMLSpanElement) => {
      console.log('mount', 'child')
      return () => console.log('unmount', 'child')
    }}
  ></span>
</div>
```

When this code is executed, the console will display the following result:

```ts
mount child
mount parent
unmount child
unmount parent
```

<!-- ### Lifecycle

In Reatom, every atom has lifecycle events to which you can subscribe with `onConnect`/`onDisconnect` functions. By default, components don't have an atom associated with them, but you may wrap the component code in an atom manually to achieve the same result:

```tsx
import { onConnect, onDisconnect } from '@reatom/hooks'

const MyWidget = () => {
  const lifecycle = atom((ctx) => <div>Something inside</div>)

  onConnect(lifecycle, (ctx) => console.log('component connected'))
  onDisconnect(lifecycle, (ctx) => console.log('component disconnected'))

  return lifecycle
}
```

Because the pattern used above is somewhat verbose, `@reatom/jsx` has a built-in convenience component called `Lifecycle` that creates an atom for you:

```tsx
import { Lifecycle } from '@reatom/jsx'

const MyWidget = () => {
  return (
    <Lifecycle
      onConnect={(ctx) => console.log('component connected')}
      onDisconnect={(ctx) => console.log('component disconnected')}
    >
      Something inside
    </Lifecycle>
  )
}
``` -->

## Utilities

### css utility

You can import `css` function from `@reatom/jsx` to describe separate css-in-js styles with syntax highlight and prettier support. Also, this function skips all falsy values, except `0`.

```tsx
import { css } from '@reatom/jsx'

const styles = css`
  color: red;
  background: blue;
  ${somePredicate && 'border: 0;'}
`
```

### Bind utility

You can use `Bind` component to use all reatom/jsx features on top of existed element. For example, there are some library, which creates an element and returns it to you and you want to add some reactive properties to it.

```tsx
import { Bind } from '@reatom/jsx'

const MyComponent = () => {
  const container = new SomeLibrary()

  return <Bind element={container} class={atom((ctx) => (ctx.spy(visible) ? 'active' : 'disabled'))} />
}
```

### TypeScript

To type your custom component props accepting general HTML attributes, for example for a `div` element, you should extend `JSX.HTMLAttributes`. However, if you want to define props for a specific HTML element you should use it name in the type name, like in the code below.

```tsx
import { type JSX } from '@reatom/jsx'

// allow only plain data types
export interface InputProps extends JSX.InputHTMLAttributes {
  defaultValue?: string
}
// allow plain data types and atoms
export type InputProps = JSX.IntrinsicElements['input'] & {
  defaultValue?: string
}

export const Input = ({ defaultValue, ...props }: InputProps) => {
  props.value ??= defaultValue
  return <input {...props} />
}
```

To type an event handler you have a few options, see below.

```tsx
export const Form = () => {
  const handleSubmit = action((ctx, event: Event) => {
    event.preventDefault()
  })

  const handleInput: JSX.InputEventHandler = action((ctx, event) => {
    event.currentTarget.valueAsNumber // HTMLInputElement.valueAsNumber: number
  })

  const handleSelect: JSX.EventHandler<HTMLSelectElement> = action((ctx, event) => {
    event.currentTarget.value // HTMLSelectElement.value: string
  })

  return (
    <form on:submit={handleSubmit}>
      <input on:input={handleInput} />
      <select on:input={handleSelect} />
    </form>
  )
}
```

## Limitations

These limitations will be fixed in the feature

- No DOM-less SSR (requires a DOM API implementation like `linkedom` to be provided)
- No keyed lists support (use linked lists instead)
- A component should have no more than one root element. If this interferes with the layout, you can wrap the parent elements in another element with the style `display: "contents"`:

```tsx
<div style={'display: "contents";'}>
  <div class="parent-1">
  <div class="parent-2">
</div>
```
