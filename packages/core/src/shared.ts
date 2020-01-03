import { Tree, TreeId } from './kernel'
import { Atom } from './declareAtom'
import { PayloadActionCreator } from './declareAction'

export { TreeId }
export type GenId = (name: string | [string]) => TreeId
export const TREE = Symbol('@@Reatom/TREE')

export type Unit = { [TREE]: Tree }

export type NonUndefined<T> = Exclude<T, undefined>

/**
 * Helper for retrieving the data type used in an atom or action
 * @example
 * type MyAtomType = InferType<typeof myAtom>
 * type MyActionType = InferType<typeof myAction>
 */
export type InferType<T> = T extends (
  | Atom<infer R>
  | PayloadActionCreator<infer R>)
  ? R
  : never

export function noop() {}

export const assign = Object.assign

export function getTree(thing: Unit): Tree {
  return thing && thing[TREE]
}

export function getIsAtom(thing: any): thing is Atom<any> {
  const vertex = getTree(thing)
  return Boolean(vertex && !vertex.isLeaf)
}

export function getIsAction(thing: any): thing is Atom<any> {
  const vertex = getTree(thing)
  return Boolean(vertex && vertex.isLeaf)
}

let id = 0
export function nameToIdDefault(name: string | [string]): TreeId {
  return Array.isArray(name)
    ? safetyStr(name[0], 'name')
    : `${safetyStr(name, 'name')} [${++id}]`
}
let _nameToId: GenId
export function nameToId(name: string | [string]): TreeId {
  return _nameToId ? _nameToId(name) : nameToIdDefault(name)
}

export function setNameToId(gen: GenId) {
  _nameToId = safetyFunc(gen, 'gen')
}

export function throwError(error: string) {
  // TODO: add link to docs with full description
  throw new Error('[reatom] ' + error)
}
export function safetyStr(str: string, name: string): string {
  if (typeof str !== 'string' || str.length === 0) throwError(`Invalid ${name}`)
  return str
}
export function safetyFunc<T extends Function>(
  func: T | undefined,
  name: string,
): T {
  if (typeof func !== 'function') throwError(`Invalid ${name}`)
  return func as T
}
