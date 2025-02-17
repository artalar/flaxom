import { atom, Atom, AtomMaybe, CtxSpy, isAtom } from '@reatom/core'
import { isObject } from '@reatom/utils'

export type ClassNameValue = AtomMaybe<
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<ClassNameValue>
  | Atom<ClassNameValue>
  | Record<
      string,
      AtomMaybe<string | number | boolean | null | undefined | object>
    >
  | ((ctx: CtxSpy) => ClassNameValue)
>

export const cn = (value: ClassNameValue): Atom<string> =>
  atom((ctx) => parseClasses(ctx, value))

const parseClasses = (ctx: CtxSpy, value: ClassNameValue): string => {
  let className = ''
  while (isAtom(value)) value = ctx.spy(value)
  if (typeof value === 'string') {
    className = value
  } else if (typeof value === 'function') {
    className = parseClasses(ctx, value(ctx))
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const parsed = parseClasses(ctx, value[i])
      if (parsed !== '') className += className === '' ? parsed : ' ' + parsed
    }
  } else if (isObject(value)) {
    for (const name in value) {
      let val = value[name]
      while (isAtom(val)) val = ctx.spy(val)
      if (val) className += className === '' ? name : ' ' + name
    }
  }
  return className
}
