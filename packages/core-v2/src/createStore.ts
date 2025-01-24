import * as v3 from '@reatom/core'
import { throwReatomError } from '@reatom/core'
import { getRootCause } from '@reatom/hooks'

import { isAction, Store } from './internal'

export function createStore({
  callSafety = v3.callSafely,
  v3ctx = v3.createCtx({
    callNearEffect: callSafety,
    callLateEffect: callSafety,
  }),
}: {
  callSafety?: typeof v3.callSafely
  v3ctx?: v3.Ctx
} = {}): Store {
  const dispatch: Store['dispatch'] = (action) => {
    const actions = Array.isArray(action) ? action : [action]

    throwReatomError(actions.length == 0 || !actions.every(isAction), `dispatch arguments`)

    v3ctx.get(() => {
      actions.forEach((action) => action.v3action(v3ctx, action.payload))
      actions.forEach(({ targets }) => targets?.forEach((target) => v3ctx.get(target.v3atom)))
    })
  }

  const getCache: Store['getCache'] = (atom) => v3ctx.get((read) => read(atom.v3atom.__reatom))

  const getState: Store['getState'] = (atom) => v3ctx.get(atom.v3atom)

  const subscribe: Store['subscribe'] = (atom, cb) => v3ctx.subscribe(atom.v3atom, (state) => cb(state, []))

  const store: Store = {
    dispatch,
    getCache,
    getState,
    subscribe,
    v3ctx,
  }

  // @ts-expect-error
  getRootCause(v3ctx.cause).v2store = store

  return store
}

export const defaultStore = createStore()
