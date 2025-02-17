import {
  type Atom,
  type Action,
  type Ctx,
  type Rec,
  atom,
  action,
  type Fn,
  type CtxSpy,
  throwReatomError,
  withInit,
  __count,
} from '@reatom/framework'

const readonly = <T extends Atom>(
  anAtom: T,
): {
  [K in keyof T]: T[K]
} => ({
  ...anAtom,
})

interface ListMapAtom<Model extends Rec = Rec, Key = any>
  extends Atom<Map<Key, Model>> {
  get: (ctx: Ctx, key: Key) => Model
  has: (ctx: CtxSpy, key: Key) => boolean
  spy: (ctx: CtxSpy, key: Key) => Model
}

export interface ListAtom<
  Params extends any[] = any[],
  Model extends Rec = Rec,
  Key = any,
> extends Atom<Array<Model>> {
  create: Action<Params, Model>
  createMany: Action<Array<Params>, Array<Model>>
  remove: Action<[Key], undefined | Model>
  removeMany: Action<[Array<Key>], Array<Model>>
  swap: Action<[a: number, b: number], Array<Model>>
  clear: Action<[], void>

  map: ListMapAtom<Model, Key>

  reatomMap: <T>(
    cb: (ctx: CtxSpy, el: Model) => T,
    name?: string,
  ) => Atom<Array<Atom<T>>>
}

export const reatomList: {
  /** an index will be used as a key */
  <Params extends any[], Model extends Rec>(
    create: (ctx: Ctx, ...params: Params) => Model,
    name: string,
  ): ListAtom<Params, Model, number>
  /** an index will be used as a key */
  <Params extends any[], Model extends Rec>(
    options: {
      create: (ctx: Ctx, ...params: Params) => Model
      initState?: Array<Model>
    },
    name: string,
  ): ListAtom<Params, Model, number>
  /** a model property will be used as a key if the model is an object */
  <Params extends any[], Model extends Rec, Key extends keyof Model>(
    options: {
      create: (ctx: Ctx, ...params: Params) => Model
      key: Key
      initState?: Array<Model>
    },
    name: string,
  ): ListAtom<Params, Model, Model[Key]>
} = (
  options:
    | Fn
    | {
        create: Fn
        initState?: Array<any>
        key?: string
      },
  name: string,
): ListAtom => {
  const {
    create: createFn,
    initState = [],
    key: KEY = undefined,
  } = typeof options === 'function' ? { create: options } : options

  const list = atom(initState, name)

  const create = action((ctx, ...params: any[]) => {
    const model = createFn(ctx, ...params)
    const listState = ctx.get(list)
    const mapState = ctx.get(map)

    if (ctx.cause.cause?.proto === createMany.__reatom) {
      const idx = listState.push(model) - 1
      mapState.set(KEY ? model[KEY] : idx, model)
    } else {
      const idx = list(ctx, [...listState, model]).length - 1
      map(ctx, new Map(mapState).set(KEY ? model[KEY] : idx, model))
    }

    return model
  }, `${name}.create`)

  const createMany = action((ctx, paramsList: any[][]) => {
    list(ctx, (listState) => [...listState])

    return paramsList.map((params) => create(ctx, ...params))
  }, `${name}.createMany`)

  const remove = action((ctx, key: any): undefined | Rec => {
    const mapState = new Map(ctx.get(map))
    const model = mapState.get(key)

    if (model && ctx.cause.cause?.proto !== removeMany.__reatom) {
      list(ctx, (listState) => listState.filter((el) => el !== model))
      mapState.delete(key)
      map(ctx, mapState)
    }

    return model
  }, `${name}.remove`)

  const removeMany = action((ctx, keys: any[]) => {
    const result = keys.map((key) => remove(ctx, key)).filter(Boolean)
    if (result.length) {
      list(ctx, (listState) => listState.filter((el) => !result.includes(el)))
      const mapState = new Map(ctx.get(map))
      result.forEach((key) => mapState.delete(key))
      map(ctx, mapState)
    }
    return result
  }, `${name}.removeMany`)

  const swap = action(
    (ctx, a: number, b: number) =>
      list(ctx, (listState) => {
        if (a === b) {
          return listState
        }
        if ([a, b].some((index) => index < 0 || index >= listState.length)) {
          throw new RangeError('Index out of range')
        }

        const newList = [...listState]
        const aValue = newList[a]
        newList[a] = newList[b]
        newList[b] = aValue

        return newList
      }),
    `${name}.move`,
  )

  const clear = action((ctx) => {
    list(ctx, [])
    map(ctx, new Map())
  }, `${name}.clear`)

  const map = Object.assign(
    atom(new Map(), `${name}.map`).pipe(
      withInit(
        (ctx) =>
          new Map(
            ctx.get(list).map((model, i) => [KEY ? model[KEY] : i, model]),
          ),
      ),
    ),
    {
      get: (ctx: Ctx, key: any) => {
        const model = ctx.get(map).get(key)
        throwReatomError(!model, `Key "${key}" not found in "${name}" list`)
        return model
      },
      // TODO @artalar optimize it
      spy: (ctx: CtxSpy, key: any) => {
        const model = ctx.spy(map).get(key)
        throwReatomError(!model, `Key "${key}" not found in "${name}" list`)
        return model
      },
      // TODO @artalar optimize it
      has: (ctx: CtxSpy, key: any) => ctx.spy(map).has(key),
    },
  )

  list.onChange((ctx) => ctx.get(map))

  const reatomMap = <T>(
    cb: (ctx: CtxSpy, el: any) => T,
    mapName = __count(`${name}.reatomMap`),
  ): Atom<Array<Atom<T>>> => {
    const atomsMap = atom(new WeakMap<any, any>(), `${mapName}._atomsMap`).pipe(
      withInit(() => new WeakMap()),
    )

    return atom(
      (ctx, state: any[] = []) =>
        ctx.spy(list).map((el) => {
          const atoms = ctx.get(atomsMap)
          let theAtom = atoms.get(el)
          if (!theAtom) {
            atoms.set(el, (theAtom = atom((ctx) => cb(ctx, el))))
          }
          return theAtom
        }),
      mapName,
    )
  }

  // TODO @artalar
  // @ts-expect-error generics?
  return Object.assign(list.pipe(readonly), {
    create,
    createMany,
    remove,
    removeMany,
    swap,
    clear,

    map: map.pipe(readonly) as ListMapAtom<Map<any, any>>,

    reatomMap,
  })
}
