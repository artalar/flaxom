This package have a set of methods to handle a state history for an atom or a set of atoms. Useful for complex forms, WYSIWYG and so on.

## Installation

```sh
npm i @reatom/undo
```

## Usage

All methods reuse `WithUndo` interface which includes the following atoms and actions.

- `jump` action allows you to navigate entire history by passed index.
- `undo` action is a shortcut to `jump(ctx, -1)`.
- `redo` action is a shortcut to `jump(ctx, +1)`.
- `clearHistory` action clear the whole history.
- `isUndoAtom` atom with a boolean state which represent the current position (is it possible to do "undo").
- `isRedoAtom` atom with a boolean state which represent the current position (is it possible to do "redo").
- `positionAtom` atom with a number state which represent the index of current history position.
- `historyAtom` atom with a list of states, it could help you to know the size of the history. You shouldn't change it by yourself!

All methods accepts the optional properties:

- `length` is the max amount of state records, **30** by default
- `shouldUpdate` function allows you to ignore some updates, by default it skips state updates which is equal to the last history record
- `shouldReplace` function allows you define what to do with the new update, replace the last history record (`true`) or add a new record (`false` - by default)
- `withPersist` - `WithPersist` instance from one of the adapter of [@reatom/persist](https://www.reatom.dev/package/persist). It will persist data from `historyAtom` and `persistAtom`, the target atom init state may be derived from the history, if it preserve.

### withUndo

`withUndo` adds extra methods for an existing atom to handle the state history and navigate through it.

```ts
import { atom } from '@reatom/core'
import { withUndo } from '@reatom/undo'

const inputAtom = atom('').pipe(withUndo())
```

#### shouldReplace

Example: https://codesandbox.io/s/reatom-react-undo-7g2cwg?file=/src/App.tsx

This option helps you store only important updates by replacing the last state with the new one. It is useful when you need to store the fresh data but separate it into parts.

For example, we want to save in the history all user input, but the each record of the history should include only words, not a letters.

```ts
const inputAtom = atom('').pipe(
  withUndo({ shouldReplace: (ctx, state) => !state.endsWith(' ') }),
)

for (const letter of 'This is a test') {
  inputAtom(ctx, (s) => s + letter)
}
ctx.get(inputAtom) // 'This is a test'
ctx.get(inputAtom.historyAtom).length // 4

inputAtom.undo(ctx)
ctx.get(inputAtom) // 'This is a'

inputAtom.undo(ctx)
inputAtom.undo(ctx)
ctx.get(inputAtom) // 'This'
```

### reatomUndo

`reatomUndo` creates a computed atom that collects the states of the passed atoms and manages them in a single history line. You can read the state of the resulting atom as a snapshot of all the states of the passed atoms.

The second argument accepts all `withUndo` options.

```ts
import { atom } from '@reatom/core'
import { reatomUndo } from '@reatom/undo'

const formUndoAtom = reatomUndo([emailAtom, passwordAtom], { length: 50 })
```

### reatomDynamicUndo

`reatomDynamicUndo` accepts a callback to spy a dynamic list of atoms and manage their changes in a single history line. It is useful when you want to use [atomization pattern](https://www.reatom.dev/recipes/atomization/). It is a more powerful version of `reatomUndo`, but it requires proper subscription to function correctly. Also, the state of this atom is not useful, do not read it.

The second argument accepts all `withUndo` options.

Example: https://codesandbox.io/s/reatom-react-atomization-undo-65rmfm?file=/src/model.ts
