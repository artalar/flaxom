import * as v3 from '@reatom/core'
import { isConnected } from '@reatom/hooks'
import { Tree, State, TreeId, Leaf } from './kernel'
import {
  TREE,
  nameToId,
  NonUndefined,
  Unit,
  throwError,
  getTree,
  safetyFunc,
  getIsAction,
  assign,
  getName,
  getOwnKeys,
  __onConnect,
  __onDisconnect,
} from './shared'
import { Action, declareAction, PayloadActionCreator } from './declareAction'

const DEPS = Symbol('@@Reatom/DEPS')
const DEPS_SHAPE = Symbol('@@Reatom/DEPS_SHAPE')

// action for set initialState of each atom to global state
export const init = declareAction(['@@Reatom/init'])
export const initAction = init()
export const replace =
  v3.action<Record<string | symbol, any>>('@@Reatom/replace')

type AtomName = TreeId | [string]
type AtomsMap = { [key: string]: Atom<any> }
type Reducer<TState, TValue> = (state: TState, value: TValue) => TState

/**
 * This interface needed for correct type inference with TypeScript 3.5
 * @see https://github.com/artalar/reatom/issues/301
 */
interface DependencyMatcherOn<TState> {
  <T>(dependency: Atom<T>, reducer: Reducer<TState, T>): void
  <T>(dependency: PayloadActionCreator<T>, reducer: Reducer<TState, T>): void
  <T>(
    dependency: Atom<T> | PayloadActionCreator<T>,
    reducer: Reducer<TState, T>,
  ): void
}
type DependencyMatcher<TState> = (on: DependencyMatcherOn<TState>) => any

export interface Atom<T> extends Unit {
  (state?: State, action?: Action<any>): Record<string, T | any>
  v3atom: v3.Atom<T>
  [DEPS]: Set<TreeId>
  [DEPS_SHAPE]?: AtomsMap | TupleOfAtoms
}

export function declareAtom<TState>(
  initialState: TState,
  dependencyMatcher: DependencyMatcher<TState>,
): Atom<TState>
export function declareAtom<TState>(
  name: AtomName,
  initialState: TState,
  dependencyMatcher: DependencyMatcher<TState>,
): Atom<TState>
export function declareAtom<TState>(
  name: AtomName | TState,
  initialState: TState | DependencyMatcher<TState>,
  dependencyMatcher?: DependencyMatcher<TState>,
): Atom<TState> {
  if (!dependencyMatcher) {
    dependencyMatcher = initialState as DependencyMatcher<TState>
    initialState = name as TState
    name = 'atom'
  }

  const id = nameToId(name as AtomName)

  name = getName(id)

  if (initialState === undefined)
    throwError(`Atom "${name}". Initial state can't be undefined`)

  const deps: Array<{ dep: v3.Atom; reducer: Reducer<any, any> }> = []
  const tree = new Tree(id)
  const depsIds = new Set<TreeId>()

  const v3atom = v3.atom((ctx, state?: any) => {
    const connected = isConnected(ctx, v3atom)
    if (!connected) {
      state = ctx.get(init.v3action).at(-1)?.payload[id] ?? initialState
      // TODO dirty hack for case in `stale unconnected atom` test
      // needed to retriger `spy`es
      ctx.cause.pubs.length = 0
    }

    ctx.spy(replace).forEach(({ payload }) => (state = payload[id] ?? state))

    for (const { dep, reducer } of deps) {
      ctx.spy(dep, (payload) => {
        if (dep !== init.v3action || !connected) {
          const { isAction, name } = dep.__reatom
          state = reducer(state, isAction ? payload.payload : payload)

          if (state === undefined) {
            const idx = 1 + deps.findIndex((el) => el.reducer === reducer)
            throwError(
              `Invalid state. Reducer number ${idx} in "${name}" atom returns undefined`,
            )
          }
        }
      })
    }

    return state
  }, id as string)
  ;(v3atom.__reatom.connectHooks = new Set()).add((ctx) =>
    __onConnect(ctx, v3atom),
  )
  ;(v3atom.__reatom.disconnectHooks = new Set()).add((ctx) =>
    __onDisconnect(ctx, v3atom),
  )
  const initialPhase = true

  function on<T>(
    dep: Unit | PayloadActionCreator<T>,
    reducer: Reducer<TState, T>,
  ) {
    if (!initialPhase)
      throwError("Can't define dependencies after atom initialization")

    safetyFunc(reducer, 'reducer')

    // @ts-ignore
    deps.push({ dep: dep.v3atom ?? dep.v3action, reducer })

    const depTree = getTree(dep as Unit)
    if (!depTree) throwError('Invalid dependency')
    const depId = depTree.id

    const isDepActionCreator = getIsAction(dep)

    tree.union(depTree)

    function update() {}
    update._ownerAtomId = id

    if (isDepActionCreator) return tree.addFn(update, depId as Leaf)
    if (depsIds.has(depId)) throwError('One of dependencies has the equal id')
    depsIds.add(depId)
    depTree.fnsMap.forEach((_, key) => tree.addFn(update, key))
  }

  dependencyMatcher(on)

  const atom = function atom(
    state: State = {},
    action: Action<any> = initAction,
  ) {
    const ctx = v3.createCtx()

    ctx.subscribe((logs) => {
      if (logs.length > 0) state = assign({}, state)
      logs.forEach(
        (patch) =>
          patch.proto.isAction || (state[patch.proto.name!] = patch.state),
      )
    })

    ctx.get(() => {
      if (action.v3action !== init.v3action || action.payload) {
        action.v3action(ctx, action.payload)
      }
      init.v3action(ctx, state)
      ctx.get(v3atom)
    })

    return state
  } as Atom<TState>

  atom[TREE] = tree
  atom[DEPS] = depsIds
  atom.v3atom = v3atom
  ;(v3atom.__reatom.disconnectHooks ??= new Set()).add((ctx) =>
    ctx.get((read) => {
      const cache = read(v3atom.__reatom)!
      cache.state = undefined
      cache.pubs = []
    }),
  )
  // @ts-expect-error
  v3atom.v1atom = atom

  return atom
}

export function getState<T>(state: State, atom: Atom<T>): T | undefined {
  return state[atom[TREE].id as string] as T | undefined
}

export function map<T, TSource = unknown>(
  source: Atom<TSource>,
  mapper: (dependedAtomState: TSource) => NonUndefined<T>,
): Atom<T>
export function map<T, TSource = unknown>(
  name: AtomName,
  source: Atom<TSource>,
  mapper: (dependedAtomState: TSource) => NonUndefined<T>,
): Atom<T>
export function map<T, TSource = unknown>(
  name: AtomName | Atom<TSource>,
  source: ((dependedAtomState: TSource) => T) | Atom<TSource>,
  mapper?: (dependedAtomState: TSource) => NonUndefined<T>,
) {
  if (!mapper) {
    mapper = source as (dependedAtomState: TSource) => NonUndefined<T>
    source = name as Atom<TSource>
    name = Symbol(`${getName(getTree(source).id)} [map]`)
  }
  safetyFunc(mapper, 'mapper')

  return declareAtom<T>(
    name as AtomName,
    // FIXME: initialState for `map` :thinking:
    null as any,
    (handle) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      handle(source as Atom<TSource>, (state, payload) => mapper!(payload)),
  )
}

type TupleOfAtoms = [Atom<unknown>] | Atom<unknown>[]

export function combine<T extends AtomsMap | TupleOfAtoms>(
  shape: T,
): Atom<{ [key in keyof T]: T[key] extends Atom<infer S> ? S : never }>
export function combine<T extends AtomsMap | TupleOfAtoms>(
  name: AtomName,
  shape: T,
): Atom<{ [key in keyof T]: T[key] extends Atom<infer S> ? S : never }>
export function combine<T extends AtomsMap | TupleOfAtoms>(
  name: AtomName | T,
  shape?: T,
) {
  if (arguments.length === 1) shape = name as T

  const isArray = Array.isArray(shape)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const keys = getOwnKeys(shape!) as TreeId[]

  if (arguments.length === 1)
    name = isArray
      ? Symbol(
          `[${keys
            .map((k) => getName(getTree((shape as TupleOfAtoms)[k as any]!).id))
            .join()}]`,
        )
      : Symbol(`{${keys.map(getName).join()}}`)

  const atom = declareAtom(name as AtomName, isArray ? [] : {}, (on) =>
    keys.forEach((key) =>
      on((shape as any)[key], (state, payload) => {
        const newState: any = isArray
          ? (state as any[]).slice(0)
          : assign({}, state)
        newState[key] = payload
        return newState
      }),
    ),
  )
  atom[DEPS_SHAPE] = shape
  return atom
}

export function getDepsShape(
  thing: Atom<any>,
): AtomsMap | TupleOfAtoms | undefined {
  return thing[DEPS_SHAPE]
}

export function v3toV1<T>(anAtom: v3.Atom<T>): Atom<T> {
  // @ts-expect-error
  if (anAtom.v1atom) return anAtom.v1atom

  const name = (anAtom.__reatom.name ??= nameToId('atom') as string)

  // @ts-expect-error
  const v1atom: Atom<T> = (anAtom.v1atom = declareAtom(
    [name],
    null as any,
    (on) => [],
  ))
  v1atom.v3atom = anAtom

  return v1atom
}
