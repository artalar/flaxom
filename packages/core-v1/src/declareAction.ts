import * as v3 from '@reatom/core'
import { Leaf, Tree, BaseAction } from './kernel'
import { TREE, nameToId, Unit, getName, getStoreByCtx, __onConnect, __onDisconnect } from './shared'
import { Store } from './createStore'

export type ActionType = Leaf
export type Reaction<T> = (payload: T, store: Store) => any

export type Action<Payload, Type extends ActionType = string> = BaseAction<Payload> & {
  type: Type
  reactions?: Reaction<Payload>[]
}

export type BaseActionCreator<Type extends string = string> = {
  getType: () => Type
  v3action: v3.Action
} & Unit

export type ActionCreator<Type extends string = string> = BaseActionCreator<Type> & (() => Action<undefined, Type>)

export type PayloadActionCreator<Payload, Type extends string = string> = BaseActionCreator<Type> &
  ((payload: Payload) => Action<Payload, Type>)

export const actions = new Map<Leaf, ActionCreator>()

export function declareAction(
  name?: string | Reaction<undefined>,
  ...reactions: Reaction<undefined>[]
): ActionCreator<string>

export function declareAction<Type extends ActionType>(
  name: [Type],
  ...reactions: Reaction<undefined>[]
): ActionCreator<Type>

export function declareAction<Payload>(
  name?: string | Reaction<Payload>,
  ...reactions: Reaction<Payload>[]
): PayloadActionCreator<Payload, string>

export function declareAction<Payload, Type extends ActionType>(
  name: [Type],
  ...reactions: Reaction<Payload>[]
): PayloadActionCreator<Payload, Type>

export function declareAction<Payload = undefined, Type extends ActionType = string>(
  name: string | [Type] | Reaction<Payload> = 'action',
  ...reactions: Reaction<Payload>[]
): ActionCreator<Type> | PayloadActionCreator<Payload, Type> {
  // @ts-expect-error
  if (Array.isArray(name) && actions.has(name[0])) return actions.get(name[0])!

  if (typeof name === 'function') {
    reactions.unshift(name)
    name = 'action'
  }
  const id = nameToId(name)

  const ACTree = new Tree(id, true)

  const v3action = v3.action((ctx, payload, r: Array<Reaction<Payload>> = reactions) => {
    r.forEach((cb) => ctx.schedule(() => cb(payload, getStoreByCtx(ctx)!)))

    return payload
  }, getName(id))
  ;(v3action.__reatom.connectHooks = new Set()).add((ctx) => __onConnect(ctx, v3action))
  ;(v3action.__reatom.disconnectHooks = new Set()).add((ctx) => __onDisconnect(ctx, v3action))

  const actionCreator = function actionCreator(payload?: Payload) {
    return {
      type: id,
      payload,
      reactions,
      v3action,
    }
  } as BaseActionCreator & v3.Fn

  actionCreator[TREE] = ACTree
  actionCreator.getType = () => id as Type
  actionCreator.v3action = v3action

  // @ts-expect-error
  actions.set(id, actionCreator)

  return actionCreator as any
}
