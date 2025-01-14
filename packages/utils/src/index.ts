import { SetTimeout } from './setTimeout'

export type UndefinedToOptional<T extends object> = Partial<T> & PickValues<T, {} | null>

// We don't have type literal for NaN but other values are presented here
// https://stackoverflow.com/a/51390763
export type Falsy = false | 0 | '' | null | undefined

// TODO infer `Atom` and `AtomMut` signature
/** Remove named generics, show plain type. */
export type Plain<Intersection> = Intersection extends (...a: infer I) => infer O
  ? ((...a: I) => O) & {
      [Key in keyof Intersection]: Intersection[Key]
    }
  : Intersection extends new (...a: any[]) => any
  ? Intersection
  : Intersection extends object
  ? {
      [Key in keyof Intersection]: Intersection[Key]
    }
  : Intersection

export type Values<T> = T[keyof T]

export type OmitValuesKeys<T, V> = Values<{
  [K in keyof T]: T[K] extends V ? never : K
}>
export type OmitValues<T, V> = {
  [K in OmitValuesKeys<T, V>]: T[K]
}

export type PickValuesKeys<T, V> = Values<{
  [K in keyof T]: T[K] extends V ? K : never
}>
export type PickValues<T, V> = {
  [K in PickValuesKeys<T, V>]: T[K]
}

export const noop: (...a: any[]) => any = () => {}

export const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms))

/** Extract Object type or intersect the thing with `Record<string | number | symbol, unknown>` */
export const isObject = <T>(
  thing: T,
  // @ts-expect-error
): thing is T extends Record<string | number | symbol, unknown> ? T : Record<string | number | symbol, unknown> =>
  typeof thing === 'object' && thing !== null

export const isRec = (thing: unknown): thing is Record<string, unknown> => {
  if (!isObject(thing)) return false
  const proto = Reflect.getPrototypeOf(thing)
  return !proto || !Reflect.getPrototypeOf(proto)
}

// TODO infer `b` too
// export const is: {
//   <A, B>(a: A, b: B): a is B
// } = Object.is

/** Shallow compare of primitives, objects and dates, arrays, maps, sets. */
export const isShallowEqual = (a: any, b: any, is = Object.is) => {
  if (Object.is(a, b)) return true

  if (!isObject(a) || !isObject(b) || a.__proto__ !== b.__proto__ || a instanceof Error) {
    return false
  }

  if (Symbol.iterator in a) {
    let equal: typeof is = a instanceof Map ? (a, b) => is(a[0], b[0]) && is(a[1], b[1]) : is
    let aIter = a[Symbol.iterator]()
    let bIter = b[Symbol.iterator]()
    while (1) {
      let aNext = aIter.next()
      let bNext = bIter.next()
      if (aNext.done || bNext.done || !equal(aNext.value, bNext.value)) {
        return aNext.done && bNext.done
      }
    }
  }

  if (a instanceof Date) return a.getTime() === b.getTime()
  if (a instanceof RegExp) return String(a) === String(b)

  for (let k in a) {
    if (k in b === false || !is(a[k], b[k])) {
      return false
    }
  }

  // let aSymbols = Object.getOwnPropertySymbols(a)
  // let bSymbols = Object.getOwnPropertySymbols(b)

  return (
    // aSymbols.length === bSymbols.length &&
    // aSymbols.every((s) => s in b && is(a[s], b[s])) &&
    Object.keys(a).length === Object.keys(b).length
  )
}

/** Recursive compare of primitives, objects and dates, arrays, maps, sets. Cyclic references supported */
export const isDeepEqual = (a: any, b: any) => {
  const visited = new WeakMap()

  const is = (a: any, b: any) => {
    if (isObject(a)) {
      if (visited.has(a)) return visited.get(a) === b
      visited.set(a, b)
    }
    return isShallowEqual(a, b, is)
  }

  return isShallowEqual(a, b, is)
}

export type Assign<T1, T2, T3 = {}, T4 = {}> = Plain<
  (T1 extends (...a: infer I) => infer O ? (...a: I) => O : {}) &
    Omit<T1, keyof T2 | keyof T3 | keyof T4> &
    Omit<T2, keyof T3 | keyof T4> &
    Omit<T3, keyof T4> &
    T4
>

/** `Object.assign` with fixed types, equal properties replaced instead of changed to a union */
export const assign: {
  <T1, T2, T3 = {}, T4 = {}>(a1: T1, a2: T2, a3?: T3, a4?: T4): Assign<T1, T2, T3, T4>
} = Object.assign

/** `Object.assign` which set an empty object to the first argument */
export const merge: typeof assign = (...a) => Object.assign({}, ...a)

export const keys: {
  <T extends object>(thing: T): Array<keyof T>
} = Object.keys

export const entries: {
  <T extends object>(thing: T): Array<[keyof T, T[keyof T]]>
} = Object.entries

/** Get a new object only with the passed keys*/
export const pick = <T, K extends keyof T>(target: T, keys: Array<K>): Plain<Pick<T, K>> => {
  const result: any = {}
  for (const key of keys) result[key] = target[key]
  return result
}

/** Get a new object without the passed keys*/
export const omit = <T, K extends keyof T>(target: T, keys: Array<K>): Plain<Omit<T, K>> => {
  const result: any = {}
  for (const key in target) {
    if (!keys.includes(key as any)) result[key] = target[key]
  }
  return result
}

/** Typesafe shortcut to `JSON.parse(JSON.stringify(value))`.
 * `structuredClone` is a better solution
 * https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
 */
export const jsonClone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

let _random = (min = 0, max = Number.MAX_SAFE_INTEGER - 1) => Math.floor(Math.random() * (max - min + 1)) + min
/** Get random integer. Parameters should be integers too. */
export const random: typeof _random = (min, max) => _random(min, max)

/** Pass a callback to replace the exported random function. Returned function restores the original random behavior. */
export const mockRandom = (fn: typeof random) => {
  const origin = _random
  _random = fn
  return () => {
    _random = origin
  }
}

/**
 * Asserts that the value is not `null` or `undefined`.
 */
export const nonNullable = <T>(value: T, message?: string): NonNullable<T> => {
  if (value == null) {
    throw new TypeError(message || 'Value is null or undefined')
  }
  return value
}

const { toString } = Object.prototype
const { toString: toStringArray } = []
const visited = new WeakMap<{}, string>()
/** Stringify any kind of data with some sort of stability.
 * Support: an object keys sorting, `Map`, `Set`, circular references, custom classes, functions and symbols.
 * The optional `immutable` could memoize the result for complex objects if you think it will never change
 */
export const toStringKey = (thing: any, immutable = true): string => {
  var tag = typeof thing

  if (tag === 'symbol') return `[reatom Symbol]${thing.description || 'symbol'}`

  if (tag !== 'function' && (tag !== 'object' || thing === null || thing instanceof Date || thing instanceof RegExp)) {
    return `[reatom ${tag}]` + thing
  }

  if (visited.has(thing)) return visited.get(thing)!

  var name = Reflect.getPrototypeOf(thing)?.constructor.name || toString.call(thing).slice(8, -1)
  // get a unique prefix for each type to separate same array / map
  // thing could be a circular or not stringifiable object from a userspace
  var result = `[reatom ${name}#${random()}]`
  if (tag === 'function') {
    visited.set(thing, (result += thing.name))
    return result
  }
  visited.set(thing, result)

  var proto = Reflect.getPrototypeOf(thing)
  if (
    proto &&
    Reflect.getPrototypeOf(proto) &&
    thing.toString !== toStringArray &&
    Symbol.iterator in thing === false
  ) {
    return result
  }

  var iterator = Symbol.iterator in thing ? thing : Object.entries(thing).sort(([a], [b]) => a.localeCompare(b))
  for (let item of iterator) result += toStringKey(item, immutable)

  if (immutable) {
    visited.set(thing, result)
  } else {
    visited.delete(thing)
  }

  return result
}

export interface AbortError extends DOMException {
  name: 'AbortError'
}

export const toAbortError = (reason: any): AbortError => {
  if (reason instanceof Error === false || reason.name !== 'AbortError') {
    if (reason instanceof Error) {
      var options: undefined | ErrorOptions = { cause: reason }
      reason = reason.message
    } else {
      reason = isObject(reason) ? toString.call(reason) : String(reason)
    }

    if (typeof DOMException === 'undefined') {
      reason = new Error(reason, options)
      reason.name = 'AbortError'
    } else {
      reason = assign(new DOMException(reason, 'AbortError'), options)
    }
  }

  return reason as AbortError
}

export const throwIfAborted = (controller?: void | null | AbortController) => {
  if (controller?.signal.aborted) {
    throw toAbortError(controller.signal.reason)
  }
}

export const isAbort = (thing: any): thing is AbortError => thing instanceof Error && thing.name === 'AbortError'

export const throwAbort = (message: string, controller?: AbortController): never => {
  const error = toAbortError(message)
  controller?.abort(error)
  throw error
}

export const setTimeout: SetTimeout = Object.assign((...a: Parameters<SetTimeout>) => {
  const intervalId = globalThis.setTimeout(...a)
  return typeof intervalId === 'number'
    ? intervalId
    : Object.assign(intervalId, {
        toJSON() {
          return -1
        },
      })
}, globalThis.setTimeout)

/** @link https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value */
export const MAX_SAFE_TIMEOUT = 2 ** 31 - 1
