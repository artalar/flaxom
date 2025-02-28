// TODO https://hyperfetch.bettertyped.com/docs/Getting%20Started/Comparison/
// TODO https://github.com/natemoo-re/ultrafetch

import {
  action,
  Action,
  ActionParams,
  ActionPayload,
  atom,
  Atom,
  AtomMut,
  Ctx,
  CtxParams,
  Fn,
  throwReatomError,
  __count,
  AtomCache,
  Unsubscribe,
  AtomState,
} from '@reatom/core'
import {
  __thenReatomed,
  abortCauseContext,
  getTopController,
  onCtxAbort,
  spawn,
  withAbortableSchedule,
} from '@reatom/effects'
import { onConnect } from '@reatom/hooks'
import { assign, isAbort, noop, sleep, toAbortError } from '@reatom/utils'

import { handleEffect } from './handleEffect'
export { withCache } from './withCache'
export { withStatusesAtom } from './withStatusesAtom'
export type {
  AsyncStatusesNeverPending,
  AsyncStatusesFirstPending,
  AsyncStatusesFulfilled,
  AsyncStatusesRejected,
  AsyncStatusesAnotherPending,
  AsyncStatusesPending,
  AsyncStatuses,
  AsyncStatusesAtom,
} from './withStatusesAtom'
export {
  reatomAsyncReaction,
  type AsyncReaction,
  type ResourceAtom,
  reatomResource,
} from './reatomResource'

export interface AsyncAction<Params extends any[] = any[], Resp = any>
  extends Action<Params, ControlledPromise<Resp>> {
  onFulfill: Action<[Resp], Resp>
  onReject: Action<[unknown], unknown>
  onSettle: Action<[], void>
  pendingAtom: Atom<number>

  /** @deprecated @internal */
  _handleCache?: Action<Params, ControlledPromise<Resp>>
}

export type AsyncResp<T extends AsyncAction> = ActionPayload<T['onFulfill']>

export interface AsyncCause extends AtomCache {
  controller: AbortController
}

export interface AsyncCtx extends Ctx {
  controller: AbortController
  cause: AtomCache
}

export interface AsyncOptions<Params extends any[] = any[], Resp = any> {
  name?: string
  onEffect?: Fn<[Ctx, Params, ControlledPromise<Resp>]>
  onFulfill?: Fn<[Ctx, Resp]>
  onReject?: Fn<[Ctx, unknown]>
  onSettle?: Fn<[Ctx]>
}

export interface ControlledPromise<T = any> extends Promise<T> {
  controller: AbortController
}

export const isAbortError = isAbort

export const reatomAsync = <
  Params extends [AsyncCtx, ...any[]] = [AsyncCtx, ...any[]],
  Resp = any,
>(
  effect: Fn<Params, Promise<Resp>>,
  options: string | AsyncOptions<CtxParams<Params>, Resp> = {},
): AsyncAction<CtxParams<Params>, Resp> => {
  const {
    name = __count('async'),
    onEffect: onEffectHook,
    onFulfill: onFulfillHook,
    onReject: onRejectHook,
    onSettle: onSettleHook,
  } = typeof options === 'string'
    ? ({ name: options } as AsyncOptions<CtxParams<Params>, Resp>)
    : options

  const pendingAtom = atom(0, `${name}.pendingAtom`)

  // @ts-expect-error the missed properties assigned later
  const theAsync: AsyncAction = Object.assign(
    // do not put this function inside `action` to not broke effect mocking
    (...params: Params) =>
      params[0].get((read, actualize) => {
        const { state } = actualize!(
          params[0],
          theAsync.__reatom,
          (ctx: AsyncCtx, patch: AtomCache) => {
            // userspace controller
            abortCauseContext.set(
              ctx.cause,
              (ctx.controller = new AbortController()),
            )

            const unabort = onCtxAbort(params[0], (error) => {
              // prevent unhandled error for abort
              payload?.catch(noop)
              ctx.controller.abort(error)
            })
            if (unabort) {
              ctx.controller.signal.addEventListener('abort', unabort)
            }

            params[0] = withAbortableSchedule(ctx)

            var payload = theAsync._handleCache
              ? // @ts-expect-error
                theAsync._handleCache(...params)
              : handleEffect(theAsync, params)

            // prevent ERR_UNHANDLED_REJECTION if the onReject has any handlers
            __thenReatomed(ctx, payload, undefined, () => {
              // One hook is for "onSettle"
              if (onReject.__reatom.updateHooks!.size > 1) {
                payload.catch(noop)
              }
            })

            patch.state = [...patch.state, { params: params.slice(1), payload }]
          },
        )
        return state[state.length - 1]!.payload
      }),
    action(
      // @ts-expect-error TODO need a better way to pass a custom Ctx.
      effect,
      name,
    ),
  )

  const onFulfill = action<Resp>(`${name}.onFulfill`)
  const onReject = action<unknown>(`${name}.onReject`)
  const onSettle = action(`${name}._onSettle`)

  onFulfill.onCall((ctx) => onSettle(ctx))
  onReject.onCall((ctx) => onSettle(ctx))

  if (onEffectHook) {
    theAsync.onCall((ctx, promise, params) =>
      onEffectHook(ctx, params as any, promise),
    )
  }
  if (onFulfillHook) onFulfill.onCall(onFulfillHook)
  if (onRejectHook) onReject.onCall(onRejectHook)
  if (onSettleHook) onSettle.onCall(onSettleHook)

  onConnect(pendingAtom, (ctx) => ctx.subscribe(theAsync, noop))

  return assign(theAsync, {
    onFulfill,
    onReject,
    onSettle,
    pendingAtom,
  })
}
reatomAsync.from = <Params extends any[], Resp = any>(
  effect: Fn<Params, Promise<Resp>>,
  options: string | AsyncOptions<Params, Resp> = {},
): AsyncAction<Params, Resp> => {
  // check uglification
  if (effect.name.length > 2) {
    if (typeof options === 'object') options.name ??= effect.name
    else options ??= effect.name
  }
  // @ts-expect-error
  return reatomAsync((ctx, ...a) => effect(...a), options)
}

export interface AsyncDataAtom<State = any> extends AtomMut<State> {
  reset: Action<[], void>
  mapFulfill?: Fn<[ctx: Ctx, payload: unknown, state: State], State>
}

// TODO
// @ts-ignore
export const withDataAtom: {
  <
    T extends AsyncAction & {
      dataAtom?: AsyncDataAtom<AsyncResp<T>>
    },
  >(): Fn<[T], T & { dataAtom: AsyncDataAtom<AsyncResp<T> | undefined> }>
  <
    T extends AsyncAction & {
      dataAtom?: AsyncDataAtom<AsyncResp<T>>
    },
  >(
    initState: AsyncResp<T>,
  ): Fn<[T], T & { dataAtom: AsyncDataAtom<AsyncResp<T>> }>
  <
    T extends AsyncAction & {
      dataAtom?: AsyncDataAtom<State | AsyncResp<T>>
    },
    State,
  >(
    initState: State,
  ): Fn<[T], T & { dataAtom: AsyncDataAtom<State | AsyncResp<T>> }>
  <
    T extends AsyncAction & {
      dataAtom?: AsyncDataAtom<AsyncResp<T>>
    },
  >(
    initState: AsyncResp<T>,
    map?: Fn<
      [ctx: Ctx, payload: AsyncResp<T>, state: AsyncResp<T>],
      AsyncResp<T>
    >,
  ): Fn<[T], T & { dataAtom: AsyncDataAtom<AsyncResp<T>> }>
  <
    T extends AsyncAction & {
      dataAtom?: AsyncDataAtom<State>
    },
    State,
  >(
    initState: State,
    map?: Fn<[ctx: Ctx, payload: AsyncResp<T>, state: State], State>,
  ): Fn<[T], T & { dataAtom: AsyncDataAtom<State> }>
} =
  (initState: any, mapFulfill?: Fn) =>
  // @ts-ignore
  (anAsync: AsyncAction & { dataAtom?: AsyncDataAtom }) => {
    if (!anAsync.dataAtom) {
      const dataAtom: AsyncDataAtom = (anAsync.dataAtom = Object.assign(
        atom(initState, `${anAsync.__reatom.name}.dataAtom`),
        {
          reset: action((ctx) => {
            dataAtom(ctx, initState)
          }, `${anAsync.__reatom.name}.dataAtom.reset`),
          mapFulfill,
        },
      ) as AsyncDataAtom)
      dataAtom.__reatom.computer = (ctx, state) => {
        ctx.spy(anAsync.onFulfill, ({ payload }) => {
          state = mapFulfill ? mapFulfill(ctx, payload, state) : payload
        })
        return state
      }
      anAsync.onFulfill.onCall((ctx) => {
        ctx.get(dataAtom)
      })

      onConnect(dataAtom, (ctx) => ctx.subscribe(anAsync, noop))
    }

    return anAsync
  }

export const withErrorAtom =
  <
    T extends AsyncAction & {
      errorAtom?: AtomMut<EmptyError | Err> & { reset: Action }
    },
    Err = Error,
    EmptyError = undefined,
  >(
    parseError: Fn<[Ctx, unknown], Err> = (ctx, e) =>
      (e instanceof Error ? e : new Error(String(e))) as Err,
    {
      initState,
      resetTrigger = 'onEffect',
    }: {
      initState?: EmptyError
      resetTrigger?:
        | null
        | 'onEffect'
        | 'onFulfill'
        | ('dataAtom' extends keyof T ? 'dataAtom' : null)
    } = {},
  ): Fn<
    [T],
    T & { errorAtom: AtomMut<EmptyError | Err> & { reset: Action } }
  > =>
  (anAsync) => {
    if (!anAsync.errorAtom) {
      const errorAtomName = `${anAsync.__reatom.name}.errorAtom`
      const resetTriggerAtom =
        resetTrigger &&
        ({ ...anAsync, onEffect: anAsync }[resetTrigger] as Atom)
      const errorAtom = (anAsync.errorAtom = assign(
        atom(initState as EmptyError | Err, errorAtomName),
        {
          reset: action((ctx) => {
            errorAtom(ctx, initState as EmptyError)
          }, `${errorAtomName}.reset`),
        },
      ))
      errorAtom.__reatom.computer = (ctx, state) => {
        if (resetTriggerAtom) {
          ctx.spy(resetTriggerAtom, (ctx) => {
            state = initState
          })
        }

        ctx.spy(anAsync.onReject, ({ payload }) => {
          state = parseError(ctx, payload)
        })

        return state
      }

      // enforce the atom not be outdated, as the `spy` is lazy
      const triggers: Array<Atom> = [anAsync.onReject]
      if (resetTriggerAtom) triggers.push(resetTriggerAtom)
      triggers.forEach((trigger) =>
        trigger.onChange((ctx) => {
          ctx.get(errorAtom)
        }),
      )
    }

    return anAsync as T & { errorAtom: Atom<EmptyError | Err> }
  }

export const withAbort =
  <
    T extends AsyncAction & {
      abort?: Action<[reason?: string], void>
      onAbort?: Action<[Error], Error>
      abortControllerAtom?: Atom<AbortController | null>
    },
  >({
    strategy = 'last-in-win',
  }: { strategy?: 'none' | 'last-in-win' | 'first-in-win' } = {}): Fn<
    [T],
    T & {
      abort: Action<[reason?: string], void>
      onAbort: Action<[Error], Error>
      abortControllerAtom: Atom<AbortController | null>
    }
  > =>
  (anAsync) => {
    throwReatomError(
      'promiseAtom' in anAsync,
      'Can\'t apply "withAbort" to "reatomResource", it already has its own abort strategy',
    )
    if (!anAsync.abort) {
      const abortControllerAtom = (anAsync.abortControllerAtom = atom(
        (ctx, state = new AbortController()) => {
          ctx.spy(anAsync, ({ payload: promise }) => {
            if (strategy === 'last-in-win') {
              const controller = state

              ctx.schedule(() => {
                controller.abort(
                  toAbortError('abort (last-in-win) ' + ctx.cause.proto.name),
                )
              })
            }

            if (
              strategy === 'first-in-win' &&
              ctx.get(anAsync.pendingAtom) > 1
            ) {
              const error = toAbortError('abort (first-in-win)' + ctx.cause.proto.name)
              promise.controller.abort(error)
              anAsync.onAbort!(ctx, error)
              return
            }

            state = promise.controller

            const handleAbort = () => {
              anAsync.onAbort!(ctx, toAbortError(state.signal.reason))
            }

            state.signal.addEventListener('abort', handleAbort)

            const removeAbortHandler = () =>
              state.signal.removeEventListener('abort', handleAbort)

            __thenReatomed(ctx, promise, removeAbortHandler, removeAbortHandler)
          })

          return state
        },
        `${anAsync.__reatom.name}._abortControllerAtom`,
      ))
      // force track computed atom
      anAsync.onCall((ctx) => void ctx.get(abortControllerAtom))

      anAsync.abort = action((ctx, reason?: string) => {
        const controller = ctx.get(abortControllerAtom)
        if (controller) {
          const error = toAbortError(reason)
          ctx.schedule(() => controller.abort(error))
        }
      }, `${anAsync.__reatom.name}.abort`)
      anAsync.onAbort = action<Error>(`${anAsync.__reatom.name}.onAbort`)
    }

    return anAsync as T & {
      abort: Action<[reason?: string], void>
      onAbort: Action<[Error], Error>
      abortControllerAtom: Atom<AbortController | null>
    }
  }

export const withRetry =
  <
    T extends AsyncAction & {
      paramsAtom?: Atom<Params | ActionParams<T>>
      retry?: Action<[after?: number], ActionPayload<T>>
      retriesAtom?: Atom<number>
    },
    Params extends ActionParams<T> | undefined = undefined,
  >({
    fallbackParams,
    onReject,
  }: {
    fallbackParams?: Params
    onReject?: Fn<[ctx: Ctx, error: unknown, retries: number], void | number>
  } = {}): Fn<
    [T],
    T & {
      paramsAtom: Atom<undefined | ActionParams<T>>
      retry: Action<[after?: number], ActionPayload<T>>
      retriesAtom: Atom<number>
    }
  > =>
  (anAsync) => {
    if (!anAsync.paramsAtom) {
      const paramsAtom = (anAsync.paramsAtom = atom(
        fallbackParams as Params,
        `${anAsync.__reatom.name}._paramsAtom`,
      ))
      anAsync.onCall((ctx, payload, params) =>
        paramsAtom(ctx, params as Params),
      )

      anAsync.retry = action(
        // @ts-expect-error
        async (ctx, after = 0): ActionPayload<T> => {
          throwReatomError(after < 0, 'wrong timeout')

          const topController = getTopController(ctx.cause)
          const controller = new AbortController()

          abortCauseContext.set(ctx.cause, controller)

          let params = ctx.get(anAsync.paramsAtom!)
          // @ts-expect-error
          if (anAsync.promiseAtom) params ??= []
          throwReatomError(!params, 'no cached params')

          retriesAtom(ctx, (s) => s + 1)

          if (after > 0) {
            const asyncStateInstance = ctx.get(anAsync)
            await sleep(after)
            const abortReason =
              (topController?.signal.aborted && topController.signal.reason) ||
              (asyncStateInstance !== ctx.get(anAsync) && 'outdated retry')
            if (abortReason) {
              retriesAtom(ctx, 0)
              throw toAbortError(abortReason)
            }
          }

          const result = anAsync(ctx, ...params!) as ActionPayload<T>

          topController?.signal.addEventListener('abort', () => {
            controller.abort(topController.signal.reason)
          })

          return result
        },
        `${anAsync.__reatom.name}.retry`,
      )

      const retriesAtom = (anAsync.retriesAtom = atom(
        0,
        `${anAsync.__reatom.name}.retriesAtom`,
      ))

      if (onReject) {
        anAsync.onCall((ctx, payload) => {
          __thenReatomed(
            ctx,
            payload,
            () => retriesAtom(ctx, 0),
            (error) => {
              const timeout = isAbort(error)
                ? -1
                : onReject(ctx, error, ctx.get(retriesAtom)) ?? -1

              if (timeout < 0) {
                retriesAtom(ctx, 0)
              } else {
                anAsync.retry!(ctx, timeout).catch(noop)
              }
            },
          )
        })
      }
    }

    return anAsync as T & {
      paramsAtom: Atom<undefined | ActionParams<T>>
      retry: Action<[], ActionPayload<T>>
      retriesAtom: Atom<number>
    }
  }

/** @deprecated use `withRetry` instead */
export const withRetryAction = withRetry

export interface MappedAsyncAction<
  Params extends any[] = unknown[],
  Payload = unknown,
> extends AsyncAction<Params, Payload> {
  /**
   * Function that unsubscribes from source atom
   * @experimental
   */
  unstable_unhook: Unsubscribe
}

/**
 * Transform atom state into reatomAsync arguments
 */
export function mapToAsync<T extends Atom, Res>(
  effect: Fn<[AsyncCtx, AtomState<T>], Promise<Res>>,
  options: AsyncOptions<[AtomState<T>], Res> = {},
): Fn<[T], MappedAsyncAction<[AtomState<T>], Res>> {
  return (sourceAtom: Atom) => {
    const asyncAction = reatomAsync(effect, {
      ...options,
      name: options.name ?? `${sourceAtom.__reatom.name}.mapToAsync`,
    }) as MappedAsyncAction<[AtomState<T>], Res>
    asyncAction.unstable_unhook = sourceAtom.onChange(asyncAction)

    return asyncAction
  }
}
