import {
  __root,
  Action,
  atom,
  Atom,
  AtomCache,
  AtomMut,
  AtomState,
  Ctx,
  Fn,
  Rec,
  throwReatomError,
  Unsubscribe,
} from '@reatom/core'
import { onConnect } from '@reatom/hooks'
import { MAX_SAFE_TIMEOUT, random } from '@reatom/utils'

export interface PersistRecord<T = unknown> {
  data: T
  /** @deprecated not needed anymore */
  fromState: boolean
  id: number
  timestamp: number
  version: number
  /**
   * Time stamp after which the record is cleared.
   */
  to: number
}

export interface PersistStorage {
  name: string
  get(ctx: Ctx, key: string): null | PersistRecord
  set(ctx: Ctx, key: string, rec: PersistRecord): void
  clear?(ctx: Ctx, key: string): void
  subscribe?(ctx: Ctx, key: string, callback: Fn<[]>): Unsubscribe
}

export interface WithPersistOptions<T> {
  /**
   * Key of the storage record.
   */
  key: string
  /**
   * Custom snapshot serializer.
   */
  toSnapshot?: Fn<[ctx: Ctx, state: T], unknown>
  /**
   * Custom snapshot deserializer.
   */
  fromSnapshot?: Fn<[ctx: Ctx, snapshot: unknown, state?: T], T>
  /**
   * A callback to call if the version of a stored snapshot is older than `version` option.
   */
  migration?: Fn<[ctx: Ctx, persistRecord: PersistRecord], T>
  /**
   * Determines whether the atom is updated on storage updates.
   * @defaultValue true
   */
  subscribe?: boolean
  /**
   * Number of milliseconds from the snapshot creation time after which it will be deleted.
   * @defaultValue MAX_SAFE_TIMEOUT
   */
  time?: number
  /**
   * Version of the stored snapshot. Triggers `migration`.
   * @defaultValue 0
   */
  version?: number
}

export interface WithPersist {
  <T extends Atom>(
    ...args: [key: string] | [options: WithPersistOptions<AtomState<T>>]
  ): (anAtom: T) => T & {
    /** Internal sync atom with `PersistRecord` state. Do not follow it when applying a few persist adapters! */
    __persistRecordAtom: Atom<PersistRecord | null>
  }
}

export const reatomPersist = (
  storage: PersistStorage,
): WithPersist & {
  storageAtom: AtomMut<PersistStorage>
} => {
  const storageAtom = atom(storage, `storageAtom#${storage.name}`)

  // @ts-expect-error
  const withPersist: WithPersist =
    <T extends Atom>(options: string | WithPersistOptions<AtomState<T>>) =>
    (anAtom: T): T => {
      const {
        key,
        fromSnapshot = (ctx, data: any) => data,
        migration,
        subscribe = !!storage.subscribe,
        time = MAX_SAFE_TIMEOUT,
        toSnapshot = (ctx, data: any) => data,
        version = 0,
      }: WithPersistOptions<AtomState<T>> = typeof options === 'string'
        ? { key: options }
        : options
      const proto = anAtom.__reatom
      const { initState, isAction } = proto

      throwReatomError(isAction, 'cannot apply persist to an action')

      const getPersistRecord = (
        ctx: Ctx,
        state: PersistRecord | null = null,
      ) => {
        const rec = ctx.get(storageAtom).get(ctx, key)

        return rec?.id === state?.id ? state : rec ?? state
      }

      const fromPersistRecord = (
        ctx: Ctx,
        rec: null | PersistRecord = getPersistRecord(ctx),
        state?: AtomState<T>,
      ) =>
        rec === null || (rec.version !== version && migration === undefined)
          ? initState(ctx)
          : fromSnapshot(
              ctx,
              rec.version !== version ? migration!(ctx, rec) : rec.data,
              state,
            )

      const toPersistRecord = (
        ctx: Ctx,
        state: AtomState<T>,
      ): PersistRecord => ({
        data: toSnapshot(ctx, state),
        fromState: true,
        id: random(),
        timestamp: Date.now(),
        to: Date.now() + time,
        version,
      })

      throwReatomError(!key, 'missed key')

      const persistRecordAtom = atom<PersistRecord | null>(
        null,
        `${anAtom.__reatom.name}._${storage.name}Atom`,
      )
      // @ts-expect-error TODO
      persistRecordAtom.__reatom.computer = getPersistRecord

      if (subscribe) {
        const { computer } = anAtom.__reatom
        // @ts-expect-error hard to type optional `state`
        anAtom.__reatom.computer = (ctx, state?: AtomState<T>) => {
          ctx.spy(persistRecordAtom, (rec) => {
            state = fromPersistRecord(ctx, rec, state)
          })

          if (computer) {
            const { pubs } = ctx.cause

            const isInit = pubs.length === 0
            const hasOtherDeps = pubs.length > 1

            if (
              isInit ||
              (hasOtherDeps &&
                pubs.some(
                  (pub, i) =>
                    i !== 0 &&
                    !Object.is(
                      pub.state,
                      // @ts-expect-error
                      ctx.get({ __reatom: pub.proto }),
                    ),
                ))
            ) {
              state = computer(ctx, state) as typeof state
            } else {
              for (let index = 1; index < pubs.length; index++) {
                // @ts-expect-error
                ctx.spy({ __reatom: pubs[index]!.proto })
              }
            }
          }

          return state
        }

        onConnect(
          anAtom,
          (ctx) =>
            ctx.get(storageAtom).subscribe?.(ctx, key, () => {
              // this will rerun the computed
              persistRecordAtom(ctx, (state) => state)
            }),
        )
      } else {
        anAtom.__reatom.initState = fromPersistRecord
      }

      anAtom.onChange((ctx, state) => {
        const { cause: patch } = ctx
        const rootCause = ctx.get((read) => read(__root))!
        // put a patch to the proto
        ctx.get(persistRecordAtom)
        let recPatch: AtomCache = ctx.get((read, actualize) =>
          actualize!(ctx, persistRecordAtom.__reatom),
        )

        if (patch.cause === recPatch && recPatch.cause === patch) {
          recPatch.cause = rootCause
        }

        if (
          (anAtom.__reatom.patch === patch ||
            Object.is(anAtom.__reatom.patch!.state, patch.state)) &&
          patch.cause !== recPatch
        ) {
          const { subs } = recPatch
          // @ts-expect-error hack to prevent cycles
          recPatch.subs = new Set()
          const rec = persistRecordAtom(ctx, toPersistRecord(ctx, state))!
          // @ts-expect-error hack to prevent cycles
          ;(recPatch = recPatch.proto.patch).subs = recPatch.subs = subs

          recPatch.cause = rootCause

          const idx = patch.pubs.findIndex(
            ({ proto }) => proto === recPatch.proto,
          )
          patch.pubs[idx] = recPatch

          ctx.get(storageAtom).set(ctx, key, rec)
        }
      })

      return Object.assign(anAtom, { __persistRecordAtom: persistRecordAtom })
    }

  return Object.assign(withPersist, { storageAtom })
}

export const createMemStorage = ({
  name,
  mutable = true,
  snapshot = {},
  subscribe = true,
}: {
  name: string
  mutable?: boolean
  snapshot?: Rec
  subscribe?: boolean
}): PersistStorage & { snapshotAtom: AtomMut<Rec<PersistRecord>> } => {
  const timestamp = Date.now()
  const to = timestamp + MAX_SAFE_TIMEOUT
  const initState = Object.entries(snapshot).reduce(
    (acc, [key, data]) => (
      (acc[key] = {
        data,
        fromState: false,
        id: 0,
        timestamp,
        to,
        version: 0,
      }),
      acc
    ),
    {} as Rec<PersistRecord>,
  )
  const snapshotAtom = atom(initState, `${name}._snapshotAtom`)
  snapshotAtom.__reatom.initState = () => ({ ...initState })

  const listenersInitState = new Map<string, Set<Fn<[PersistRecord]>>>()
  const listenersAtom = atom(listenersInitState, `${name}._listenersAtom`)
  listenersAtom.__reatom.initState = () => new Map(listenersInitState)

  return {
    name,
    get: (ctx, key) => ctx.get(snapshotAtom)[key] ?? null,
    set: (ctx, key, rec) => {
      if (mutable) {
        const snapshot = ctx.get(snapshotAtom)
        const prev = snapshot[key]
        snapshot[key] = rec
        ctx.schedule(() => (snapshot[key] = prev!), -1)
      } else {
        snapshotAtom(ctx, (snapshot) => ({ ...snapshot, [key]: rec }))
      }

      ctx.schedule(
        () =>
          ctx
            .get(listenersAtom)
            .get(key)
            ?.forEach((cb) => cb(rec)),
      )
    },
    subscribe: subscribe
      ? (ctx, key, callback) => {
          const listeners = ctx.get(listenersAtom)
          listeners.set(key, (listeners.get(key) ?? new Set()).add(callback))

          const cleanup = () => {
            const keyListeners = listeners.get(key)
            if (keyListeners) {
              keyListeners.delete(callback)
              if (keyListeners.size === 0) listeners.delete(key)
            }
          }

          ctx.schedule(cleanup, -1)

          return cleanup
        }
      : undefined,
    snapshotAtom,
  }
}
