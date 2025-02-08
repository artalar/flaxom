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
type EnumAtom<
  T extends string,
  Format extends 'camelCase' | 'snake_case' = 'camelCase',
> = ZodAtom<T> & ReatomEnumAtom<T, Format>
export interface RecordAtom<T extends Rec>
  extends ZodAtom<T>,
    ReatomRecordAtom<T> {}
export interface MapAtom<Key, Element>
  extends ZodAtom<[Key, Element]>,
    ReatomMapAtom<Key, Element> {}
export interface SetAtom<T> extends ZodAtom<[T]>, ReatomSetAtom<T> {}
export interface LinkedListAtom<
  Params extends any[] = any[],
  Model extends Rec = Rec,
> extends ZodAtom<Array<Model>>,
    ReatomLinkedListAtom<Params, Model> {}

type DistributeIntersection<U, T> = U extends any ? U & T : never;

export type ZodAtomization<T extends z.ZodFirstPartySchemaTypes, Union = never, Intersection = unknown> = T extends z.ZodAny
  ? AtomMut<(any & Intersection) | Union>
  : T extends z.ZodUnknown
    ? AtomMut<(unknown & Intersection) | Union>
    : T extends z.ZodNever
      ? never
      : T extends z.ZodReadonly<infer Type>
        ? (z.infer<Type> & Intersection) | Union
        : T extends z.ZodUndefined
          ? AtomMut<(undefined & Intersection) | Union>
          : T extends z.ZodVoid
            ? (undefined & Intersection) | Union
            : T extends z.ZodNaN
              ? (number & Intersection) | Union
              : T extends z.ZodNull
                ? AtomMut<(null & Intersection) | Union>
                : T extends z.ZodLiteral<infer T>
                  ? (T & Intersection) | Union
                  : T extends z.ZodBoolean
                    ? [Union] extends [never]
                      ? BooleanAtom
                      : AtomMut<(boolean & Intersection) | Union>
                    : T extends z.ZodNumber
                      ? [Union] extends [never]
                        ? NumberAtom
                        : AtomMut<(number & Intersection) | Union>
                      : T extends z.ZodBigInt
                        ? AtomMut<(bigint & Intersection) | Union>
                        : T extends z.ZodString
                          ? AtomMut<(string & Intersection) | Union>
                          : T extends z.ZodSymbol
                            ? AtomMut<(symbol & Intersection) | Union>
                            : T extends z.ZodDate
                              ? AtomMut<(Date & Intersection) | Union>
                              : T extends z.ZodArray<infer T>
                                ? LinkedListAtom<[void | Partial<z.infer<T>>], ZodAtomization<T>> // FIXME Union
                                : T extends z.ZodTuple<infer Tuple>
                                  ? AtomMut<(z.infer<Tuple[number]> & Intersection) | Union>
                                  : T extends z.ZodObject<infer Shape>
                                    ? [Union] extends [never]
                                      ? {
                                          [K in keyof Shape]: ZodAtomization<Shape[K]>;
                                        } & Intersection
                                      : AtomMut<({ 
                                          [K in keyof Shape]: ZodAtomization<Shape[K]> 
                                        } & Intersection) | Union>
                                    : T extends z.ZodRecord<infer KeyType, infer ValueType>
                                      ? [Union] extends [never]
                                        ? RecordAtom<Record<z.infer<KeyType>, ZodAtomization<ValueType>>>
                                        : AtomMut<(Record<z.infer<KeyType>, ZodAtomization<ValueType>> & Intersection) | Union>
                                      : T extends z.ZodMap<infer KeyType, infer ValueType>
                                        ? [Union] extends [never]
                                          ? MapAtom<z.infer<KeyType>, ZodAtomization<ValueType>>
                                          : AtomMut<(Map<z.infer<KeyType>, ZodAtomization<ValueType>> & Intersection) | Union>
                                        : T extends z.ZodSet<infer ValueType>
                                          ? [Union] extends [never]
                                            ? SetAtom<z.infer<ValueType>>
                                            : AtomMut<(Set<z.infer<ValueType>> & Intersection) | Union>
                                          : T extends z.ZodEnum<infer Enum>
                                            ? [Union] extends [never]
                                              ? EnumAtom<Enum[number]>
                                              : AtomMut<(Enum[number] & Intersection) | Union>
                                            : T extends z.ZodNativeEnum<infer Enum>
                                              ? [Union] extends [never]
                                                ? // @ts-expect-error шо?
                                                  EnumAtom<Enum[keyof Enum]>
                                                : AtomMut<(Enum[keyof Enum] & Intersection) | Union>
                                              : T extends z.ZodDefault<infer T>
                                                ? ZodAtomization<T, Union extends undefined ? never : Union, Intersection>
                                                : T extends z.ZodOptional<infer T>
                                                  ? ZodAtomization<T, undefined | Union, Intersection>
                                                  : T extends z.ZodCatch<infer T>
                                                    ? ZodAtomization<T, Union, Intersection>
                                                    : T extends z.ZodBranded<infer T, infer Brand>
                                                      ? ZodAtomization<T, Union, z.BRAND<Brand> & Intersection>
                                                      : T extends z.ZodEffects<infer T, infer Output>
                                                        ? ZodAtomization<T, Union | Output, Intersection>
                                                        : T extends z.ZodPipeline<infer T, infer Output>
                                                          ? ZodAtomization<Output>
                                                          : T extends z.ZodLazy<infer T>
                                                            ? ZodAtomization<T>
                                                            : T extends z.ZodNullable<infer T>
                                                              ? ZodAtomization<T, null | Union, Intersection>
                                                              : T extends z.ZodUnion<infer T>
                                                                ? AtomMut<DistributeIntersection<z.infer<T[number]>, Intersection> | Union>
                                                                : T extends z.ZodDiscriminatedUnion<infer K, infer T>
                                                                  ? [Union] extends [never]
                                                                    ? T extends Array<z.ZodObject<infer Shape>>
                                                                      ? Atom<{
                                                                          [K in keyof Shape]: ZodAtomization<Shape[K]>;
                                                                        }> &
                                                                          ((
                                                                            ctx: Ctx,
                                                                            value: {
                                                                              [K in keyof Shape]: z.infer<Shape[K]>;
                                                                            },
                                                                          ) => void)
                                                                      : unknown
                                                                    : unknown
                                                                  : T;

                                                                  
type Primitive = null | undefined | string | number | boolean | symbol | bigint;
type BuiltIns = Primitive | Date | RegExp;
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

export const EXTENSIONS = new Array<
  Fn<[AtomMut, z.ZodFirstPartyTypeKind], AtomMut>
>()

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
          create: (ctx, initState) =>
            reatomZod(def.type, { sync, initState, name: __count(name) }),
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
      state =
        def.options.find(
          (type: z.ZodDefault<any>) => type._def.defaultValue?.(),
        ) ?? initState
      break
    }
    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion: {
      const getState = (initState: any) => {
        const state = def.options.find(
          (type: z.ZodDiscriminatedUnionOption<string>) => {
            try {
              type.parse(initState)
            } catch {
              return undefined
            }

            return type
          },
        )

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
    case z.ZodFirstPartyTypeKind.ZodCatch: {
      try {
        def.innerType.parse(state)
      } 
      catch (error) {
        if(error instanceof z.ZodError)
          state = def.catchValue({ error, input: state })
      }
            
      return reatomZod(def.innerType, { sync, initState: state, name })
    }
    case z.ZodFirstPartyTypeKind.ZodEffects: {
      return reatomZod(def.schema, { sync, initState, name })
    }
    case z.ZodFirstPartyTypeKind.ZodBranded: {
      return reatomZod(def.type, { sync, initState, name })
    }
    case z.ZodFirstPartyTypeKind.ZodPipeline: {
      return reatomZod(def.out, { sync, initState, name })
    }
    case z.ZodFirstPartyTypeKind.ZodLazy: {
      return reatomZod(def.getter(), { sync, initState, name })
    }
    case z.ZodFirstPartyTypeKind.ZodIntersection: {
      throw new TypeError(`Unsupported Zod type: ${def.typeName}. Please use .merge instead`)
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

  return EXTENSIONS.reduce(
    (anAtom, ext) => ext(anAtom as AtomMut, def.typeName),
    theAtom,
  ) as ZodAtomization<Schema>
}
