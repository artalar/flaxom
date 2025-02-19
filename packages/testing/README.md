Small context wrapper simplify your mocking and testing.

## Installation

```sh
npm i @reatom/testing
```

## Usage

We recommend to use [vitest](https://vitest.dev/) as helper library for test description, as it could be used in any runtime (and even browser!) and superfast. To clarify, with vitest you allow to run your test files with node / deno / bun / graalvm / [esbuild-kit/tsx](https://github.com/esbuild-kit/tsx) and browser just out of the box. But `@reatom/testing` is not coupled to vitest, you could use any testing framework.

```ts
import { createTestCtx, mockFn } from '@reatom/testing'
```

```ts
export interface TestCtx extends Ctx {
  mock<T>(anAtom: Atom<T>, fallback: T): Unsubscribe

  mockAction<T>(anAction: Action<any[], T>, cb: Fn<[Ctx], T>): Unsubscribe

  subscribeTrack<T, F extends Fn<[T]>>(
    anAtom: Atom<T>,
    cb?: F,
  ): F & {
    unsubscribe: Unsubscribe
    calls: ReturnType<typeof mockFn<[T], any>>['calls']
    lastInput: ReturnType<typeof mockFn<[T], any>>['lastInput']
  }
}

declare function mockFn<I extends any[], O>(
  fn?: (...input: I) => O,
): ((...input: I) => O) & {
  calls: Array<{ i: I; o: O }>
  lastInput: Fn<[], I[0]>
}
```
