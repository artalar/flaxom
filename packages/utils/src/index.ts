// TODO infer `Atom` and `AtomMut` signature
/** Remove named generics, show plain type. */
export type Plain<Intersection> = Intersection extends (
  ...a: infer I
) => infer O
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
): thing is T extends Record<string | number | symbol, unknown>
  ? T
  : Record<string | number | symbol, unknown> =>
  typeof thing === 'object' && thing !== null

// TODO infer `b` too
// export const is: {
//   <A, B>(a: A, b: B): a is B
// } = Object.is

/** Shallow compare of primitives, objects and dates, arrays, maps, sets. */
export const isShallowEqual = (a: any, b: any, is = Object.is) => {
  if (Object.is(a, b)) return true

  if (
    !isObject(a) ||
    !isObject(b) ||
    a.__proto__ !== b.__proto__ ||
    a instanceof Error
  ) {
    return false
  }

  if (Symbol.iterator in a) {
    let equal: typeof is =
      a instanceof Map ? (a, b) => is(a[0], b[0]) && is(a[1], b[1]) : is
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
  <T1, T2, T3 = {}, T4 = {}>(a1: T1, a2: T2, a3?: T3, a4?: T4): Assign<
    T1,
    T2,
    T3,
    T4
  >
} = Object.assign

/** `Object.assign` which set an empty object to the first argument */
export const merge: typeof assign = (...a) => Object.assign({}, ...a)

/** Get a new object only with the passed keys*/
export const pick = <T, K extends keyof T>(
  target: T,
  keys: Array<K>,
): Plain<Pick<T, K>> => {
  const result: any = {}
  for (const key of keys) result[key] = target[key]
  return result
}

/** Get a new object without the passed keys*/
export const omit = <T, K extends keyof T>(
  target: T,
  keys: Array<K>,
): Plain<Omit<T, K>> => {
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

/** Get random integer. Parameters should be integers too. */
export const random = (min = 0, max = Number.MAX_SAFE_INTEGER - 1) =>
  Math.floor(Math.random() * (max - min + 1)) + min

/**
 * Returns non nullable type of value
 */
export const nonNullable = <T>(value: T, message?: string): NonNullable<T> => {
  if (value != null) return value as NonNullable<T>
  throw new TypeError(message || 'Value is null or undefined')
}

const { toString } = Object.prototype
const visited = new WeakMap<{}, string>()
/** Stringify any kind of data with some sort of stability.
 * Support: an object keys sorting, `Map`, `Set`, circular references, custom classes, functions and symbols.
 * The optional `immutable` could memoize the result for complex objects if you think it will never change
 */
export const toStringKey = (thing: any, immutable = true): string => {
  var tag = typeof thing
  var isNominal = tag === 'function' || tag === 'symbol'

  if (
    !isNominal &&
    (tag !== 'object' ||
      thing === null ||
      thing instanceof Date ||
      thing instanceof RegExp)
  ) {
    return tag + thing
  }

  if (visited.has(thing)) return visited.get(thing)!

  // get a unique prefix for each type to separate same array / map
  var result = toString.call(thing)
  var unique = result + random()
  // thing could be a circular or not stringifiable object from a userspace
  visited.set(thing, unique)

  if (
    isNominal ||
    (thing.constructor !== Object && Symbol.iterator in thing === false)
  ) {
    return unique
  }

  for (let item of Symbol.iterator in thing
    ? thing
    : Object.entries(thing).sort(([a], [b]) => a.localeCompare(b)))
    result += toStringKey(item, immutable)

  immutable ? visited.set(thing, result) : visited.delete(thing)

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

export const throwIfAborted = (controller?: void | AbortController) => {
  if (controller?.signal.aborted) {
    throw toAbortError(controller.signal.reason)
  }
}

export const isAbort = (thing: any): thing is AbortError =>
  thing instanceof Error && thing.name === 'AbortError'

/** @link https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value */
export const MAX_SAFE_TIMEOUT = 2 ** 31 - 1
