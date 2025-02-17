import {
  Action,
  action,
  ActionParams,
  atom,
  Atom,
  AtomState,
  Ctx,
  Fn,
} from '@reatom/core'
import { MapAtom, reatomMap, withAssign } from '@reatom/primitives'
import { isDeepEqual, MAX_SAFE_TIMEOUT, setTimeout } from '@reatom/utils'
import { type WithPersistOptions } from '@reatom/persist'
import { onConnect } from '@reatom/hooks'
import {
  __thenReatomed,
  abortCauseContext,
  getTopController,
  spawn,
  // spawnAction
} from '@reatom/effects'

import { handleEffect } from './handleEffect'
import {
  AsyncAction,
  AsyncCtx,
  AsyncDataAtom,
  AsyncResp,
  ControlledPromise,
} from '.'

export interface CacheRecord<T = any, Params extends any[] = unknown[]> {
  clearTimeoutId: ReturnType<typeof setTimeout>
  /** It is more like **"lastRequest"**,
   * which is expected for failed fetching,
   * we don't want to remove the cache,
   * if we couldn't fetch new one. */
  lastUpdate: number
  params: Params
  promise: undefined | Promise<T>
  controller: AbortController
  value: undefined | T
  /** value version */
  version: number
}

export interface CacheAtom<T = any, Params extends any[] = unknown[]>
  extends MapAtom<unknown, CacheRecord<T, Params>> {
  /** Clear all records and call the effect with the last params. */
  invalidate: Action<[], null | ControlledPromise<T>>
  setWithParams: Action<[params: Params, value: T]>
  deleteWithParams: Action<[params: Params]>
  options: WithCacheOptions
}

type CacheMapRecord<T extends AsyncAction = AsyncAction> =
  | undefined
  | CacheRecord<AsyncResp<T>, ActionParams<T>>

export type WithCacheOptions<T extends AsyncAction = AsyncAction> = {
  /** Define if the effect should be prevented from abort.
   * The outer abort strategy is not affected, which means that all hooks and returned promise will behave the same.
   * But the effect execution could be continued even if abort appears, to save the result in the cache.
   * @default true
   */
  ignoreAbort?: boolean

  // TODO how to handle if `withDataAtom` defined after `withCache`?
  // /** Define if the last cache should be used as init state of `dataAtom`.
  //  * Useful when `withPersist` defined.
  //  * @default true
  //  */
  // initData?: boolean

  /** Maximum amount of cache records.
   * @default 5
   */
  length?: number

  /** The number of excepted parameters, which will used as a cache key.
   * @default undefined (all)
   */
  paramsLength?: number

  /** The amount of milliseconds after which a cache record cleanups.
   * @default 5 * 60 * 1000 ms (5 minutes)
   */
  staleTime?: number

  /** (stale while revalidate) Define if fetching should be triggered even if the cache is exists.
   * A boolean value applies to all options
   * @default true
   */
  swr?:
    | boolean
    | {
        /**
         * success revalidation should trigger `onFulfill` to notify about the fresh data
         * @default true
         */
        shouldFulfill?: boolean

        /**
         * pendingAtom should follow SWR promises too
         * @default false
         */
        shouldPending?: boolean

        /**
         * error revalidation trigger `onReject` to notify about the error
         * @default false
         */
        shouldReject?: boolean
      }

  /** Persist adapter, which will used with predefined optimal parameters */
  withPersist?: (
    options: WithPersistOptions<
      AtomState<CacheAtom<AsyncResp<T>, ActionParams<T>>>
    >,
  ) => (
    anAsync: CacheAtom<AsyncResp<T>, ActionParams<T>>,
  ) => CacheAtom<AsyncResp<T>, ActionParams<T>>
} & (
  | {
      /** Convert params to stable string and use as a map key.
       * Alternative to `isEqual`.
       * Disabled by default.
       */
      paramsToKey?: (ctx: Ctx, params: ActionParams<T>) => string
    }
  | {
      /** Check the equality of a cache record and passed params to find the cache.
       * Alternative to `paramsToKey`.
       * @default `isDeepEqual` from @reatom/utils
       */
      isEqual?: (
        ctx: Ctx,
        prev: ActionParams<T>,
        next: ActionParams<T>,
      ) => boolean
    }
)

type Find<T extends AsyncAction> = Fn<
  [
    ctx: Ctx,
    params: ActionParams<T>,
    state?: AtomState<CacheAtom<AsyncResp<T>, ActionParams<T>>>,
  ],
  { cached?: CacheMapRecord<T>; key: unknown }
>

const NOOP_TIMEOUT_ID = -1 as unknown as ReturnType<typeof setTimeout>

export const withCache =
  <
    T extends AsyncAction & {
      dataAtom?: AsyncDataAtom
      cacheAtom?: CacheAtom<AsyncResp<T>, ActionParams<T>>
      swrPendingAtom?: Atom<number>
    },
  >({
    ignoreAbort = true,
    // initData = true,
    length = 5,
    paramsLength,
    staleTime = 5 * 60 * 1000,
    swr: swrOptions = true,
    withPersist,
    // @ts-expect-error
    paramsToKey,
    // @ts-expect-error
    isEqual = (ctx: Ctx, a: any, b: any) => isDeepEqual(a, b),
  }: WithCacheOptions<T> = {}): Fn<
    [T],
    T & {
      cacheAtom: CacheAtom<AsyncResp<T>, ActionParams<T>>
      swrPendingAtom: Atom<number>
    }
  > =>
  // @ts-ignore
  (anAsync) => {
    if (!anAsync.cacheAtom) {
      type ThisParams = ActionParams<T>
      type ThisCacheAtom = CacheAtom<AsyncResp<T>, ThisParams>
      type ThisCacheRecord = CacheRecord<AsyncResp<T>, ThisParams>

      const swr = !!swrOptions
      const {
        // @ts-expect-error valid and correct JS
        shouldPending = false,
        // @ts-expect-error valid and correct JS
        shouldFulfill = swr,
        // @ts-expect-error valid and correct JS
        shouldReject = false,
      } = swrOptions
      if (staleTime !== Infinity)
        staleTime = Math.min(MAX_SAFE_TIMEOUT, staleTime)

      const find: Find<T> = paramsToKey
        ? (ctx, params, state = ctx.get(cacheAtom)) => {
            const key = paramsToKey(ctx, params)
            return { cached: state.get(key), key }
          }
        : (ctx, params, state = ctx.get(cacheAtom)) => {
            for (const [key, cached] of state) {
              if (isEqual(ctx, key, params)) return { cached, key }
            }
            return { cached: undefined, key: params }
          }

      const findLatestWithValue = (ctx: Ctx, state = ctx.get(cacheAtom)) => {
        for (const cached of state.values()) {
          if (
            cached.version > 0 &&
            (!latestCached || cached.lastUpdate > latestCached.lastUpdate)
          ) {
            var latestCached: undefined | ThisCacheRecord = cached
          }
        }
        return latestCached
      }

      const deleteOldest = (cache: Map<unknown, ThisCacheRecord>) => {
        for (const [key, cached] of cache) {
          if (!oldestCached || oldestCached.lastUpdate > cached.lastUpdate) {
            var oldestKey = key
            var oldestCached: undefined | ThisCacheRecord = cached
          }
        }
        // it is ok to mutate the cache,
        // as it was just created from the set method
        // and wasn't touched by anything.
        if (oldestCached) cache.delete(oldestKey)
      }

      const planCleanup = (ctx: Ctx, key: unknown, time = staleTime) => {
        const clearTimeoutId =
          staleTime === Infinity
            ? NOOP_TIMEOUT_ID
            : setTimeout(() => {
                if (
                  cacheAtom.get(ctx, key)?.clearTimeoutId === clearTimeoutId
                ) {
                  cacheAtom.delete(ctx, key)
                }
              }, time)

        clearTimeoutId.unref?.()
        ctx.schedule(() => clearTimeout(clearTimeoutId), -1)

        return clearTimeoutId
      }

      const cacheAtom = (anAsync.cacheAtom = reatomMap(
        new Map(),
        `${anAsync.__reatom.name}._cacheAtom`,
      ).pipe(
        withAssign((target, name) => ({
          setWithParams: action(
            (ctx, params: ThisParams, value: AsyncResp<T>) => {
              const { cached, key } = find(ctx, params)

              cacheAtom.set(ctx, key, {
                clearTimeoutId: planCleanup(ctx, key),
                promise: undefined,
                value,
                version: cached ? cached.version + 1 : 1,
                controller: new AbortController(),
                lastUpdate: Date.now(),
                params,
              })

              // TODO ?
              // cached?.controller.abort()
            },
          ),
          deleteWithParams: action((ctx, params: ThisParams) => {
            const { cached, key } = find(ctx, params)
            if (cached) cacheAtom.delete(ctx, key)
          }),
        })),
      ) as ThisCacheAtom)

      cacheAtom.invalidate = action((ctx) => {
        const latest = findLatestWithValue(ctx)

        cacheAtom.clear(ctx)

        if ('promiseAtom' in anAsync) return anAsync(ctx)

        return latest ? anAsync(ctx, ...latest.params) : null
      }, `${cacheAtom.__reatom.name}.invalidate`)

      cacheAtom.options = {
        ignoreAbort,
        length,
        paramsLength,
        staleTime,
        swr,
        // @ts-expect-error
        withPersist,
      }

      if (withPersist) {
        // TODO the key could be provided by a decorator function
        // like `withPersist: options => withLocalStorage({ ...options, key: 'key' })`
        // how to check it??
        // throwReatomError(
        //   anAsync.__reatom.name!.includes('#'),
        //   'the async name is not unique',
        // )

        cacheAtom.pipe(
          withPersist({
            key: cacheAtom.__reatom.name!,
            // @ts-expect-error snapshot unknown type
            fromSnapshot: (
              ctx,
              snapshot: Array<[unknown, ThisCacheRecord]>,
              state = new Map(),
            ) => {
              if (
                snapshot.length <= state?.size &&
                snapshot.every(([, { params, value }]) => {
                  const { cached } = find(ctx, params, state)
                  return !!cached && isDeepEqual(cached.value, value)
                })
              ) {
                return state
              }

              const newState = new Map(snapshot)

              for (const [key, rec] of newState) {
                const restStaleTime = staleTime - (Date.now() - rec.lastUpdate)
                if (restStaleTime <= 0) {
                  newState.delete(key)
                } else {
                  rec.clearTimeoutId = planCleanup(
                    ctx,
                    key,
                    staleTime - (Date.now() - rec.lastUpdate),
                  )
                }
              }

              for (const [key, rec] of state) {
                if (rec.promise) {
                  const { cached } = find(ctx, rec.params, newState)
                  if (cached) {
                    cached.promise = rec.promise
                  } else {
                    newState.set(key, rec)
                  }
                }
              }

              return newState
            },
            time: Math.min(staleTime, MAX_SAFE_TIMEOUT),
            toSnapshot: (ctx, cache) =>
              [...cache].filter(([, rec]) => !rec.promise),
          }),
        )
      }

      const swrPendingAtom = (anAsync.swrPendingAtom = atom(
        0,
        `${anAsync.__reatom.name}.swrPendingAtom`,
      ))

      const handlePromise = (
        ctx: Ctx,
        key: unknown,
        cached: ThisCacheRecord,
        swr: boolean,
      ) => {
        cached.clearTimeoutId = planCleanup(ctx, key)
        // the case: the whole cache was cleared and a new fetching was started
        const isSame = () =>
          cacheAtom.get(ctx, key)?.clearTimeoutId === cached.clearTimeoutId

        // @ts-expect-error could be reassigned by the testing package
        const { unstable_fn } = anAsync.__reatom
        let res: Fn, rej: Fn
        cached.promise = new Promise<AsyncResp<T>>((...a) => ([res, rej] = a))

        return async (...a: Parameters<T>) => {
          try {
            const value = await (ignoreAbort
              ? spawn(
                  a[0],
                  (ctx, ...a) =>
                    unstable_fn(
                      { ...ctx, controller: getTopController(ctx.cause) },
                      ...a,
                    ),
                  a.slice(1),
                )
              : unstable_fn(...a))
            res(value)

            ctx.get(() => {
              if (isSame()) {
                cacheAtom.set(ctx, key, {
                  ...cached,
                  promise: undefined,
                  value,
                  version: cached.version + 1,
                })
              }
              if (swr) swrPendingAtom(ctx, (s) => s - 1)
            })
          } catch (error) {
            rej(error)

            ctx.get(() => {
              if (isSame()) {
                if (cached.version > 0) {
                  cacheAtom.set(ctx, key, {
                    ...cached,
                    promise: undefined,
                  })
                } else {
                  cacheAtom.delete(ctx, key)
                }
              }
              if (swr) swrPendingAtom(ctx, (s) => s - 1)
            })
          }
          return cached.promise
        }
      }

      // @ts-ignore
      anAsync._handleCache = action(
        // @ts-expect-error can't type the context
        (...params: [AsyncCtx, ...ThisParams]): ControlledPromise => {
          const [ctx] = params
          const controller = getTopController(ctx.cause.cause!)!
          abortCauseContext.set(ctx.cause, (ctx.controller = controller))

          const paramsKey = params.slice(
            1,
            1 + (paramsLength ?? params.length),
          ) as ThisParams

          let {
            cached = {
              clearTimeoutId: NOOP_TIMEOUT_ID,
              promise: undefined,
              value: undefined,
              version: 0,
              controller,
              lastUpdate: -1,
              params: [],
            },
            key,
          } = find(ctx, paramsKey)

          const prevController = cached.controller

          cached = {
            ...cached,
            lastUpdate: Date.now(),
            params: paramsKey,
            controller,
          }

          // let lastUpdate = Date.now()
          // if (cached.lastUpdate === lastUpdate) lastUpdate += 0.001
          // cached.lastUpdate = lastUpdate

          const cache = cacheAtom.set(ctx, key, cached)
          if (cache.size > length) deleteOldest(cache)

          if (
            (cached.version === 0 && !cached.promise) ||
            (cached.promise && prevController.signal.aborted)
          ) {
            return handleEffect(anAsync, params, {
              effect: handlePromise(ctx, key, cached, false),
            })
          }

          // have a value
          if (cached.version > 0) anAsync.onFulfill(ctx, cached.value)

          if (cached.promise || !swr) {
            return handleEffect(anAsync, params, {
              effect: async () => cached.promise ?? cached.value,
              shouldPending: false,
              shouldFulfill,
              shouldReject,
            })
          }

          if (swr) swrPendingAtom(ctx, (s) => s + 1)

          return handleEffect(anAsync, params, {
            effect: handlePromise(ctx, key, cached, swr),
            shouldPending,
            shouldFulfill,
            shouldReject,
          })
        },
        `${anAsync.__reatom.name}._handleCache`,
      )

      // TODO make it an option
      if ('dataAtom' in anAsync) {
        const { initState } = anAsync.dataAtom!.__reatom
        anAsync.dataAtom!.__reatom.initState = (ctx) => {
          const cached = findLatestWithValue(ctx)
          const iniState = initState(ctx)
          return cached
            ? anAsync.dataAtom!.mapFulfill
              ? anAsync.dataAtom!.mapFulfill(ctx, cached.value, iniState)
              : cached.value
            : iniState
        }
      }

      // TODO handle it in dataAtom too to not couple to the order of operations
      if (withPersist && 'dataAtom' in anAsync) {
        onConnect(anAsync.dataAtom!, (ctx) =>
          ctx.subscribe(cacheAtom, () => {}),
        )
      }
    }

    return anAsync
  }
