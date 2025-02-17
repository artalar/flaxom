import * as v3 from '@reatom/core'

/* UTILITY */

export type Fn<Args extends any[] = any[], Return = any> = (
  ...a: Args
) => Return

export type Rec<Values = any> = Record<string, Values>

export type Merge<Intersection> = Intersection extends (...a: any[]) => any
  ? Intersection
  : Intersection extends new (...a: any[]) => any
  ? Intersection
  : Intersection extends object
  ? {
      [Key in keyof Intersection]: Intersection[Key]
    }
  : Intersection

export type Values<T> = Merge<T[keyof T]>

export type OmitValues<Collection, Target> = Merge<
  Omit<
    Collection,
    // @ts-ignore
    Values<{
      [K in keyof Collection]: Collection[K] extends Target ? K : never
    }>
  >
>

export type PickValues<Collection, Target> = Merge<
  Pick<
    Collection,
    Values<{
      [K in keyof Collection]: Collection[K] extends Target ? K : never
    }>
  >
>

/* DOMAIN */

export type Unsubscribe = () => void

export type Cache<State = any> = {
  /** The source of this cache */
  readonly atom: Atom<State>

  /** Cause of the state update */
  readonly cause: Cause

  /** Local mutable context */
  readonly ctx: Rec<unknown>

  /** Immutable public data */
  readonly state: State

  /**
   * tracks useful for testing and debugging.
   * Also this helps to handle the case when cache was created
   * then all listeners / children was removed
   * then tracks change their value
   * then the atom returns to active
   * and may been stale.
   */
  readonly tracks: Array<Cache>

  readonly listeners?: Set<AtomListener<State>>

  // readonly v3Cache?: v3.AtomCache<State>
}

export type CacheTemplate<State = any> = Merge<
  Omit<Cache<State>, `state` | `tracks`> & {
    state: undefined | State
    tracks: undefined | Array<Cache>
  }
>

export type Atom<State = any> = {
  /** Transaction reducer */
  (transaction: Transaction, cache?: CacheTemplate<State>): Cache<State>

  /**
   * Unique identifier of the atom.
   * It is used to read and write a snapshot data.
   */
  id: string

  /**
   * Set of all dependency types which this atom should handle
   */
  types: Array<Action['type']>

  v3atom: v3.Atom<State>
}

export type AtomBindings<State = any> = {
  /** Read (or recalculate) state (`defaultStore`) */
  getState(): State

  /** Immediately receive current state and subscribe to it changes (`defaultStore`) */
  subscribe(cb: AtomListener<State>): Unsubscribe
}

export type AtomBinded<State = any> = Atom<State> & AtomBindings<State>

export type TrackReducer<
  State = any,
  Deps extends Rec<Fn | Atom> = Rec<Fn | Atom>,
> = {
  (track: Track<Deps>): State
  // TODO: how to infer type from default value of optional argument?
  // jsdoc?
  // (track: Track<Deps>, state?: undefined | State): State
}

export type CacheReducer<State = any> = Fn<
  [transaction: Transaction, cache: CacheTemplate<State>],
  Cache<State>
>

export type AtomListener<State> = Fn<[state: State, ctx: Causes]>

export type AtomEffect<Ctx extends Cache['ctx'] = Cache['ctx']> = Fn<
  [dispatch: Store['dispatch'], ctx: Ctx, causes: Causes]
>

export type DepsPayloadMappers<
  Deps extends Rec<Fn | Atom | ActionCreator> = Rec<Fn | Atom | ActionCreator>,
> = OmitValues<Deps, Atom | ActionCreator>

export type DepsActionCreators<
  Deps extends Rec<Fn | Atom | ActionCreator> = Rec<Fn | Atom>,
> = {
  [K in keyof Deps]: Deps[K] extends ActionCreator ? Deps[K] : never
}

export type DepsAtoms<
  Deps extends Rec<Fn | Atom | ActionCreator> = Rec<Fn | Atom>,
> = {
  [K in keyof Deps]: Deps[K] extends Atom ? Deps[K] : never
}

export type Track<
  Deps extends Rec<Fn | Atom | ActionCreator> = Rec<Fn | Atom>,
> = {
  /** Create action */
  create: <Name extends keyof DepsPayloadMappers<Deps>>(
    name: Name,
    ...params: Parameters<DepsPayloadMappers<Deps>[Name]>
  ) => Action<ReturnType<DepsPayloadMappers<Deps>[Name]>>

  /** Subscribe to atom state changes and receive it */
  get<Name extends keyof DepsAtoms<Deps>>(
    name: Name,
  ): AtomState<DepsAtoms<Deps>[Name]>

  /** Get atom state without subscribing to it! */
  getUnlistedState<State>(atom: Atom<State>): State

  /** React to action dispatch */
  onAction<Name extends keyof OmitValues<Deps, Atom>>(
    name: Name,
    reaction: Fn<
      [
        payload: Name extends keyof PickValues<Deps, ActionCreator>
          ? // TODO
            // @ts-ignore
            ActionPayload<Deps[Name]>
          : // TODO
            // @ts-ignore
            ReturnType<Deps[Name]>,
      ]
    >,
  ): void

  /** Subscribe to atom state changes and react to it */
  onChange<Name extends keyof DepsAtoms<Deps>>(
    name: Name,
    reaction: Fn<
      [
        newState: AtomState<DepsAtoms<Deps>[Name]>,
        oldState: undefined | AtomState<DepsAtoms<Deps>[Name]>,
      ]
    >,
  ): void

  /** React only at first reducer call */
  onInit(reaction: Fn<[]>): void

  /** Schedule effect */
  schedule(effect: AtomEffect): void

  v3ctx: v3.CtxSpy
}

export type Action<Payload = any> = {
  /** Payload data from userspace */
  payload: Payload

  /** Action indeteficator */
  type: string

  v3action: v3.Action //<[Payload], Payload>

  /** Atoms which will forced achieve this action  */
  targets?: Array<Atom>

  [K: string]: unknown
}

export type ActionData<Payload = any> = Merge<
  Omit<Action<Payload>, 'type'> & {
    type?: never
  }
>

type CustomAction<Data extends Rec, Args extends any[] = any[]> = Merge<
  Data & {
    type: Action['type']
    v3action: v3.Action //<Args, Data['payload']>
  }
>

export type ActionCreator<
  Args extends any[] = any[],
  Data extends ActionData = { payload: Args[0] },
> = {
  (...a: Args): CustomAction<Data, Args>

  type: Action['type']

  v3action: v3.Action //<Args, Data['payload']>
}

export type ActionCreatorBindings<Args extends any[] = any[]> = {
  /** Create the action creator action and dispatch it to the `defaultStore` */
  dispatch(...args: Args): ReturnType<Store['dispatch']>
}

export type ActionCreatorBinded<
  Args extends any[] = any[],
  Data extends ActionData = { payload: Args[0] },
> = ActionCreator<Args, Data> & ActionCreatorBindings<Args>

export type AtomsCache = WeakMap<Atom, Cache>

export type Effect = Fn<[dispatch: Store['dispatch']]>

export type Patch = Map<Atom, Cache>

export type Snapshot = Rec<any>

export type Cause = Atom['id'] | Action['type'] | string
// export type Causes = [TransactionResult, ...(Array<Cause> | Causes)]
export type Causes = Array<Cause | TransactionResult>

export type TransactionEffect = Fn<
  [dispatch: Store['dispatch'], causes: Causes]
>

export type Store = {
  /**
   * Accept action or pack of actions for a batch.
   * Return a promise which resolves when all effects resolves
   */
  dispatch(action: Action | Array<Action>, causes?: Causes): void

  getCache<State>(atom: Atom<State>): undefined | v3.AtomCache<State>

  getState<State>(atom: Atom<State>): State

  /** Subscribe to dispatch */
  subscribe<State>(atom: Atom<State>, cb: Fn<[State, Causes]>): Unsubscribe

  v3ctx: v3.Ctx
}

/**
 * Transaction is a dispatch context
 * with pack of actions (batch)
 * and `effects` queue for effect scheduling
 */
export type Transaction = {
  /* List of changes intentions */
  readonly actions: ReadonlyArray<Action>

  readonly getCache: Store['getCache']

  /** Memoize atom recalculation during transaction */
  process<T>(atom: Atom<T>, cache?: Cache<T> | CacheTemplate<T>): Cache<T>

  /** Schedule effect */
  schedule(cb: TransactionEffect, cause?: Cause): void

  v3ctx: v3.Ctx
}

export type TransactionResult = {
  readonly actions: ReadonlyArray<Action>

  readonly patch: Patch
}

export type TransactionData = TransactionResult & {
  causes: Causes
  start: number
  end: number
}

export type AtomState<T extends Atom | Cache<any>> = T extends Atom<infer State>
  ? State
  : T extends Cache<infer State>
  ? State
  : never

export type ActionPayload<T extends ActionCreator | Action> =
  T extends ActionCreator<any[], { payload: infer Payload }>
    ? Payload
    : T extends Action<infer Payload>
    ? Payload
    : never

export type ActionCreatorData<T extends ActionCreator> =
  T extends ActionCreator<any[], infer Data> ? Data : never
