import {
  type Rec,
  type Fn,
  type Ctx,
  type Atom,
  type AtomMut as ReatomAtomMut,
  atom,
  __count,
  action,
  Action,
  throwReatomError,
} from '@reatom/core'
import { isCausedBy } from '@reatom/effects'
import {
  type BooleanAtom as ReatomBooleanAtom,
  type LinkedListAtom as ReatomLinkedListAtom,
  type NumberAtom as ReatomNumberAtom,
  type EnumAtom as ReatomEnumAtom,
  type RecordAtom as ReatomRecordAtom,
  type MapAtom as ReatomMapAtom,
  type SetAtom as ReatomSetAtom,
  reatomBoolean,
  reatomEnum,
  reatomLinkedList,
  reatomNumber,
  reatomRecord,
  reatomMap,
  reatomSet,
} from '@reatom/primitives'

import { z } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ZodAtom<T> {}
export interface AtomMut<T = any> extends ZodAtom<T>, ReatomAtomMut<T> {}
export interface BooleanAtom extends ZodAtom<boolean>, ReatomBooleanAtom {}
export interface NumberAtom extends ZodAtom<number>, ReatomNumberAtom {}
type EnumAtom<T extends string, Format extends 'camelCase' | 'snake_case' = 'camelCase'> = ZodAtom<T> &
  ReatomEnumAtom<T, Format>
export interface RecordAtom<T extends Rec> extends ZodAtom<T>, ReatomRecordAtom<T> {}
export interface MapAtom<Key, Element> extends ZodAtom<[Key, Element]>, ReatomMapAtom<Key, Element> {}
export interface SetAtom<T> extends ZodAtom<[T]>, ReatomSetAtom<T> {}
export interface LinkedListAtom<Params extends any[] = any[], Model extends Rec = Rec>
  extends ZodAtom<Array<Model>>,
    ReatomLinkedListAtom<Params, Model> {}

export type ZodAtomization<T extends z.ZodFirstPartySchemaTypes, Union = never> = T extends z.ZodAny
  ? AtomMut<any | Union>
  : T extends z.ZodUnknown
  ? AtomMut<unknown | Union>
  : T extends z.ZodNever
  ? never
  : T extends z.ZodReadonly<infer Type>
  ? z.infer<Type> | Union
  : T extends z.ZodUndefined
  ? AtomMut<undefined | Union>
  : T extends z.ZodVoid
  ? undefined | Union
  : T extends z.ZodNaN
  ? number | Union
  : T extends z.ZodNull
  ? AtomMut<null | Union>
  : T extends z.ZodLiteral<infer T>
  ? T | Union
  : T extends z.ZodBoolean
  ? never extends Union
    ? BooleanAtom
    : AtomMut<boolean | Union>
  : T extends z.ZodNumber
  ? never extends Union
    ? NumberAtom
    : AtomMut<number | Union>
  : T extends z.ZodBigInt
  ? AtomMut<bigint | Union>
  : T extends z.ZodString
  ? AtomMut<string | Union>
  : T extends z.ZodSymbol
  ? AtomMut<symbol | Union>
  : T extends z.ZodDate
  ? AtomMut<Date | Union>
  : T extends z.ZodArray<infer T>
  ? LinkedListAtom<[void | Partial<z.infer<T>>], ZodAtomization<T>> // FIXME Union
  : T extends z.ZodTuple<infer Tuple>
  ? AtomMut<z.infer<Tuple[number]> | Union>
  : T extends z.ZodObject<infer Shape>
  ? never extends Union
    ? {
        [K in keyof Shape]: ZodAtomization<Shape[K]>
      }
    : AtomMut<Shape | Union>
  : T extends z.ZodRecord<infer KeyType, infer ValueType>
  ? never extends Union
    ? RecordAtom<Record<z.infer<KeyType>, ZodAtomization<ValueType>>>
    : AtomMut<Record<z.infer<KeyType>, ZodAtomization<ValueType>> | Union>
  : T extends z.ZodMap<infer KeyType, infer ValueType>
  ? never extends Union
    ? MapAtom<z.infer<KeyType>, ZodAtomization<ValueType>>
    : AtomMut<Map<z.infer<KeyType>, ZodAtomization<ValueType>> | Union>
  : T extends z.ZodSet<infer ValueType>
  ? never extends Union
    ? SetAtom<z.infer<ValueType>>
    : AtomMut<Set<z.infer<ValueType>> | Union>
  : T extends z.ZodEnum<infer Enum>
  ? never extends Union
    ? EnumAtom<Enum[number]>
    : AtomMut<Enum[number] | Union>
  : T extends z.ZodNativeEnum<infer Enum>
  ? never extends Union
    ? // @ts-expect-error шо?
      EnumAtom<Enum[keyof Enum]>
    : AtomMut<Enum[keyof Enum] | Union>
  : T extends z.ZodDefault<infer T>
  ? ZodAtomization<T, Union extends undefined ? never : Union>
  : T extends z.ZodOptional<infer T>
  ? ZodAtomization<T, undefined | Union>
  : T extends z.ZodNullable<infer T>
  ? ZodAtomization<T, null | Union>
  : T extends z.ZodUnion<infer T>
  ? AtomMut<z.infer<T[number]> | Union>
  : T extends z.ZodDiscriminatedUnion<infer K, infer T>
  ? never extends Union
    ? T extends Array<z.ZodObject<infer Shape>>
      ? Atom<{
          [K in keyof Shape]: ZodAtomization<Shape[K]>
        }> &
          ((
            ctx: Ctx,
            value: {
              [K in keyof Shape]: z.infer<Shape[K]>
            },
          ) => void)
      : unknown
    : unknown
  : T

type Primitive = null | undefined | string | number | boolean | symbol | bigint
type BuiltIns = Primitive | Date | RegExp
export type PartialDeep<T> = T extends BuiltIns
  ? T | undefined
  : T extends object
  ? T extends ReadonlyArray<any>
    ? T
    : {
        [K in keyof T]?: PartialDeep<T[K]>
      }
  : unknown

export const silentUpdate = action((ctx, cb: Fn<[Ctx]>) => {
  cb(ctx)
})

export const EXTENSIONS = new Array<Fn<[AtomMut, z.ZodFirstPartyTypeKind], AtomMut>>()

export const reatomZod = <Schema extends z.ZodFirstPartySchemaTypes>(
  { _def: def }: Schema,
  {
    sync,
    initState,
    name = __count(`reatomZod.${def.typeName}`),
  }: {
    sync?: Fn<[Ctx]>
    initState?: PartialDeep<z.infer<Schema>>
    name?: string
  } = {},
): ZodAtomization<Schema> => {
  let state: any = initState
  let theAtom: Atom

  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodNever: {
      throw new Error('Never type')
    }
    case z.ZodFirstPartyTypeKind.ZodNaN: {
      return NaN as ZodAtomization<Schema>
    }
    case z.ZodFirstPartyTypeKind.ZodReadonly:
    case z.ZodFirstPartyTypeKind.ZodVoid: {
      return initState as ZodAtomization<Schema>
    }
    case z.ZodFirstPartyTypeKind.ZodUnknown:
    case z.ZodFirstPartyTypeKind.ZodUndefined: {
      break
    }
    case z.ZodFirstPartyTypeKind.ZodNull: {
      // TODO @artalar why this behaves not like `undefined`??
      state ??= null
      break
    }
    case z.ZodFirstPartyTypeKind.ZodLiteral: {
      return state ?? def.value
    }
    case z.ZodFirstPartyTypeKind.ZodString: {
      if (state === undefined) state = ''
      break
    }
    case z.ZodFirstPartyTypeKind.ZodNumber: {
      theAtom = reatomNumber(state, name)
      break
    }
    case z.ZodFirstPartyTypeKind.ZodDate: {
      if (typeof state === 'number') {
        state = new Date(state)
      } else {
        if (state === undefined) state = new Date()
      }
      break
    }
    case z.ZodFirstPartyTypeKind.ZodBoolean: {
      theAtom = reatomBoolean(state, name)
      break
    }
    // case z.ZodFirstPartyTypeKind.ZodSymbol: {
    //   if (state === undefined) state = Symbol();
    //   break;
    // }
    case z.ZodFirstPartyTypeKind.ZodObject: {
      const obj = {} as Rec
      for (const [key, child] of Object.entries(def.shape())) {
        obj[key] = reatomZod(child as z.ZodFirstPartySchemaTypes, {
          sync,
          initState: (initState as any)?.[key],
          name: `${name}.${key}`,
        })
      }
      return obj as ZodAtomization<Schema>
    }
    case z.ZodFirstPartyTypeKind.ZodTuple: {
      if (state === undefined) {
        state = def.items.map((item: z.ZodFirstPartySchemaTypes, i: number) =>
          reatomZod(item, { sync, name: `${name}#${i}` }),
        )
      }
      break
    }
    case z.ZodFirstPartyTypeKind.ZodArray: {
      // TODO @artalar generate a better name, instead of using `__count`
      theAtom = reatomLinkedList(
        {
          create: (ctx, initState) => reatomZod(def.type, { sync, initState, name: __count(name) }),
          initState: (initState as any[] | undefined)?.map((initState: any) =>
            reatomZod(def.type, { sync, initState, name: __count(name) }),
          ),
        },
        name,
      )
      break
    }
    case z.ZodFirstPartyTypeKind.ZodRecord: {
      theAtom = reatomRecord(state ?? {}, name)
      break
    }
    case z.ZodFirstPartyTypeKind.ZodMap: {
      theAtom = reatomMap(state ? new Map(state) : new Map(), name)
      break
    }
    case z.ZodFirstPartyTypeKind.ZodSet: {
      theAtom = reatomSet(state ? new Set(state) : new Set(), name)
      break
    }
    case z.ZodFirstPartyTypeKind.ZodEnum: {
      theAtom = reatomEnum(def.values, { initState, name })
      break
    }
    case z.ZodFirstPartyTypeKind.ZodNativeEnum: {
      theAtom = reatomEnum(Object.values(def.values), { initState, name })
      break
    }
    case z.ZodFirstPartyTypeKind.ZodUnion: {
      state = def.options.find((type: z.ZodDefault<any>) => type._def.defaultValue?.()) ?? initState
      break
    }
    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion: {
      const getState = (initState: any) => {
        const state = def.options.find((type: z.ZodDiscriminatedUnionOption<string>) => {
          try {
            type.parse(initState)
          } catch {
            return undefined
          }

          return type
        })

        throwReatomError(!state, 'Missed init state for discriminated union')

        return reatomZod(state, { sync, initState, name })
      }

      const originAtom = atom(getState(initState), name)
      theAtom = Object.assign((ctx: Ctx, value: any) => {
        originAtom(ctx, getState(value))
      }, originAtom)
      break
    }
    case z.ZodFirstPartyTypeKind.ZodOptional: {
      // TODO @artalar allow `undefined` in innerType
      return reatomZod(def.innerType, { sync, initState, name })
    }
    case z.ZodFirstPartyTypeKind.ZodNullable: {
      // TODO @artalar allow `undefined` in innerType
      return reatomZod(def.innerType, {
        sync,
        initState: initState ?? null,
        name,
      })
    }
    case z.ZodFirstPartyTypeKind.ZodDefault: {
      // TODO @artalar allow `undefined` in innerType (replace it with `defaultValue`)
      return reatomZod(def.innerType, {
        sync,
        initState: initState ?? def.defaultValue(),
        name,
      })
    }

    default: {
      // @ts-expect-error // TODO
      const typeName: never = def.typeName

      if (typeName) throw new TypeError(`Unsupported Zod type: ${typeName}`)

      theAtom = atom(initState, name)
    }
  }

  theAtom ??= atom(state, name)

  theAtom.onChange((ctx, value) => {
    if (isCausedBy(ctx, silentUpdate)) return
    // TODO @artalar the parse is required for using the default values
    // type.parse(parseAtoms(ctx, value));
    sync?.(ctx)
  })

  return EXTENSIONS.reduce((anAtom, ext) => ext(anAtom as AtomMut, def.typeName), theAtom) as ZodAtomization<Schema>
}
