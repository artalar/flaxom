import * as v3 from '@reatom/core'
import { Action, ActionCreator, Atom, defaultStore } from './internal'

export const callSafety = v3.callSafely

export const noop: v3.Fn = () => {}

export function pushUnique<T>(list: Array<T>, el: T): void {
  if (!list.includes(el)) list.push(el)
}

export function isString(thing: any): thing is string {
  return typeof thing === 'string'
}

export function isObject(thing: any): thing is Record<keyof any, any> {
  return typeof thing === 'object' && thing !== null
}

export function isFunction(thing: any): thing is Function {
  return typeof thing === 'function'
}

export function isAtom<State>(thing: Atom<State>): thing is Atom<State>
export function isAtom(thing: any): thing is Atom
export function isAtom(thing: any): thing is Atom {
  return isFunction(thing) && `types` in thing
}

export function isActionCreator(thing: any): thing is ActionCreator {
  return isFunction(thing) && `type` in thing
}

export function isAction(thing: any): thing is Action {
  return isObject(thing) && isString(thing.type) && 'payload' in thing
}

export function getState<State>(atom: Atom<State>, store = defaultStore): State {
  return store.getState(atom)
}
