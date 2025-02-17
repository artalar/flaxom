import {
  Atom,
  AtomCache,
  Ctx,
  Fn,
  __count,
  atom,
  throwReatomError,
  Unsubscribe,
  AtomProto,
  action,
} from '@reatom/core'
import {
  CauseContext,
  __thenReatomed,
  abortCauseContext,
  getTopController,
  onCtxAbort,
  withAbortableSchedule,
} from '@reatom/effects'
import { merge, noop, toAbortError } from '@reatom/utils'

import { reatomAsync, AsyncAction, ControlledPromise, AsyncCtx } from '.'
import { isConnected, onConnect } from '@reatom/hooks'
import { CacheAtom } from './withCache'

export interface ResourceAtom<Resp = any> extends AsyncAction<[], Resp> {
  promiseAtom: Atom<ControlledPromise<Resp>>
  init(ctx: Ctx): Unsubscribe
  reset(ctx: Ctx): void
}

/**
 * @deprecated use ResourceAtom instead
 */
export interface AsyncReaction<Resp = any> extends ResourceAtom<Resp> {}

export interface AsyncCtxSpy extends AsyncCtx {
  spy: {
    <T>(anAtom: Atom<T>): T
  }
}

const resolved = new WeakSet<Promise<any>>()

export const reatomResource = <T>(
  asyncComputed: (ctx: AsyncCtxSpy) => Promise<T>,
  name = __count('asyncAtom'),
): ResourceAtom<T> => {
  const promises = new CauseContext<Promise<any>>()

  const theAsync = reatomAsync((ctx) => {
    const promise = promises.get(ctx.cause)
    throwReatomError(!promise, 'reaction manual call')
    return promise!
  }, name)
  const promiseAtom = atom((_ctx, state?: ControlledPromise<T>) => {
    if (state && !_ctx.cause.pubs.length) return state

    const params: any[] = []

    const ctx = merge(_ctx, {
      spy(anAtom: Atom, cb?: Fn) {
        throwReatomError(cb, 'spy reactions are unsupported in ResourceAtom')
        const value = _ctx.spy(anAtom)
        params.push(value)
        return value
      },
    }) as AsyncCtx

    const abortError = toAbortError('concurrent')
    const controller = new AbortController()
    const unabort = onCtxAbort(ctx, (error) => {
      if (
        abortError !== error && // recursion
        !isConnected(ctx, theReaction)
      ) {
        controller.abort(error)
      }
    })
    if (unabort) controller.signal.addEventListener('abort', unabort)
    abortCauseContext.set(ctx.cause, (ctx.controller = controller))

    const computedPromise = asyncComputed(
      withAbortableSchedule(ctx) as AsyncCtxSpy,
    )
    computedPromise.catch(noop)
    promises.set(ctx.cause, computedPromise)

    const pendingBefore = ctx.get(theAsync.pendingAtom)
    const fulfillCallsBefore = ctx.get(theAsync.onFulfill)
    let promise = theAsync(
      ctx,
      // @ts-expect-error needed for cache handling
      ...params,
    )

    promise.controller.signal.addEventListener('abort', () => {
      type ReactionWithCache = ResourceAtom & {
        cacheAtom?: CacheAtom
      }
      if (!(theReaction as ReactionWithCache).cacheAtom?.options.ignoreAbort) {
        controller.abort(promise.controller.signal.reason)
      }
    })

    const cached = pendingBefore === ctx.get(theAsync.pendingAtom)
    const fulfillCalls = ctx.get(theAsync.onFulfill)
    if (cached) controller.abort(toAbortError('cached'))
    if (cached && fulfillCallsBefore !== fulfillCalls) {
      promise = Object.assign(
        Promise.resolve(fulfillCalls[fulfillCalls.length - 1]!.payload),
        { controller },
      )
    }

    __thenReatomed(
      ctx,
      promise,
      () => resolved.add(promise),
      () => resolved.add(promise),
    ).catch(noop)

    state?.controller.abort(abortError)

    return promise
  }, `${name}._promiseAtom`)

  // `dataAtom`, `promiseAtom`, `statusesAtom` subscribes to the async action when it gets a connection to itself.
  // So we should activate the promise as long as there are any subscribers to the promise meta.
  onConnect(theAsync, (ctx) => ctx.subscribe(promiseAtom, noop))
  onConnect(promiseAtom, (ctx) => /* disconnect */ () => {
    ctx.get((read) => {
      const state = read(promiseAtom.__reatom)?.state

      state?.controller.abort(ctx.controller.signal.reason)
      if (!resolved.has(state)) {
        reset(ctx, promiseAtom.__reatom, ctx.controller.signal.reason)
      }
    })
  })

  const theReaction = Object.assign(
    (ctx: Ctx) =>
      ctx.get((read, actualize) => {
        reset(ctx, promiseAtom.__reatom, toAbortError('force'))
        // force update (needed if the atom is connected)
        actualize!(ctx, promiseAtom.__reatom, noop)
        const state = ctx.get(theAsync)
        const payload = state[state.length - 1]?.payload
        throwReatomError(
          !payload,
          'unexpectedly failed invalidation. Please, report the issue',
        )
        return payload!
      }),
    theAsync,
    {
      promiseAtom,
      init(ctx: Ctx) {
        return ctx.subscribe(promiseAtom, noop)
      },
      reset: action((ctx: Ctx) => {
        reset(ctx, promiseAtom.__reatom, toAbortError('reset'))
      }, `${name}.reset`),
    },
  ) as ResourceAtom<T>

  // `withCache` could be added only after theReaction return
  Object.defineProperty(theAsync, '_handleCache', {
    get() {
      return theReaction._handleCache
    },
  })

  return theReaction
}

const reset = (ctx: Ctx, proto: AtomProto, reason: any) =>
  ctx.get((read, actualize) => {
    if (read(proto)) {
      const { computer } = proto
      proto.computer = null
      try {
        actualize!(ctx, proto, (patchCtx: Ctx, patch: AtomCache) => {
          patch.state?.controller.abort(reason)
          patch.pubs = []
          patch.state = undefined
        })
      } finally {
        proto.computer = computer
      }
    }
  })

/**
 * @deprecated use reatomResource instead
 */
export const reatomAsyncReaction = reatomResource
