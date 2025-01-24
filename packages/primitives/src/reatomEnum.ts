import { action, Action, atom, AtomMut, Ctx, throwReatomError } from '@reatom/core'

export type EnumFormat = 'camelCase' | 'snake_case'

export type EnumAtom<T extends string, Format extends EnumFormat = 'camelCase'> = AtomMut<T> & {
  [Variant in T as Format extends 'camelCase'
    ? `set${Capitalize<Variant>}`
    : Format extends 'snake_case'
    ? `set_${Variant}`
    : never]: Action<[], Variant>
} & {
  reset: Action<[], T>
  enum: { [K in T]: K }
}

export type EnumAtomOptions<T extends string, Format extends EnumFormat = 'camelCase'> = {
  name?: string
  format?: Format
  initState?: T
}

export const reatomEnum = <const T extends string, Format extends 'camelCase' | 'snake_case' = 'camelCase'>(
  variants: ReadonlyArray<T>,
  options: string | EnumAtomOptions<T, Format> = {},
) => {
  const {
    name,
    format = 'camelCase' as Format,
    initState = variants[0],
  }: EnumAtomOptions<T, Format> = typeof options === 'string' ? { name: options } : options

  const stateAtom = atom(initState, name) as EnumAtom<T, Format>
  const enumAtom: typeof stateAtom = Object.assign((ctx: Ctx, update: any) => {
    const state = stateAtom(ctx, update)
    throwReatomError(!variants.includes(state), `invalid enum value "${state}" for "${name}" enum`)
    return state
  }, stateAtom)
  const cases = (enumAtom.enum = {} as { [K in T]: K })

  enumAtom.reset = action((ctx) => enumAtom(ctx, initState!), `${name}.reset`)

  for (const variant of variants) {
    cases[variant] = variant
    const setterName = variant.replace(
      /^./,
      (firstLetter) => 'set' + (format === 'camelCase' ? firstLetter.toUpperCase() : `_${firstLetter}`),
    )

    ;(enumAtom as any)[setterName] = action((ctx) => enumAtom(ctx, variant)!, `${name}.${setterName}`)
  }

  return enumAtom as EnumAtom<T, Format>
}
