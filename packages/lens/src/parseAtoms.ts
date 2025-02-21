import { Action, Atom, Ctx, isAction, isAtom, Rec } from '@reatom/core'
import {
  isLinkedListAtom,
  LinkedList,
  LinkedListLikeAtom,
} from '@reatom/primitives'
import { isRec } from '@reatom/utils'

type Primitive = string | number | boolean | null | undefined
type Builtin = Date | RegExp | Function

export type ParseAtoms<T> = T extends Action
  ? T
  : T extends LinkedListLikeAtom<infer T>
  ? T extends LinkedList<infer T>
  ? Array<ParseAtoms<T>>
  : never
  : T extends Atom<infer T>
  ? ParseAtoms<T>
  : T extends Map<infer K, infer T>
  ? Map<K, ParseAtoms<T>>
  : T extends Set<infer T>
  ? Set<ParseAtoms<T>>
  : T extends Array<infer T>
  ? Array<ParseAtoms<T>>
  : T extends Primitive | Builtin
  ? T
  : T extends object
  ? {
    [K in keyof T]: ParseAtoms<T[K]>
  }
  : T

export const parseAtoms = <Value>(
  ctx: Ctx,
  value: Value,
): ParseAtoms<Value> => {
  if (isAction(value)) return value as ParseAtoms<Value>

  if (isLinkedListAtom(value)) value = value.array as any

  while (isAtom(value)) value = ctx.spy ? ctx.spy(value) : ctx.get(value)

  if (typeof value !== 'object' || value === null) return value as any

  if (isRec(value)) {
    const res = {} as Rec
    for (const k in value) res[k] = parseAtoms(ctx, value[k])
    return res as any
  }

  if (Array.isArray(value)) {
    const res = []
    for (const v of value) res.push(parseAtoms(ctx, v))
    return res as any
  }

  if (value instanceof Map) {
    const res = new Map()
    for (const [k, v] of value) res.set(k, parseAtoms(ctx, v))
    return res as any
  }

  if (value instanceof Set) {
    const res = new Set()
    for (const v of value) res.add(parseAtoms(ctx, v))
    return res as any
  }

  return value as any
}
