import {
  __count,
  action,
  Action,
  atom,
  Atom,
  AtomCache,
  AtomProto,
  AtomReturn,
  Ctx,
  CtxSpy,
  Fn,
  isAtom,
  throwReatomError,
  Unsubscribe,
} from '@reatom/core'
import {
  AbortError,
  isAbort,
  merge,
  noop,
  throwIfAborted,
  toAbortError,
} from '@reatom/utils'

export class CauseContext<T> extends WeakMap<AtomCache, T> {
  has(cause: AtomCache): boolean {
    return super.has(cause) || (cause.cause !== null && this.has(cause.cause))
  }
  get(cause: AtomCache): T | undefined {
    while (!super.has(cause) && cause.cause) {
      cause = cause.cause
    }
    return super.get(cause)
  }
}

export const abortCauseContext = new CauseContext<AbortController | undefined>()

export const getTopController = (
  patch: AtomCache & { controller?: AbortController },
): null | AbortController => abortCauseContext.get(patch) ?? null

/** Handle abort signal from a cause */
export const onCtxAbort = (
  ctx: Ctx,
  cb: Fn<[AbortError]>,
): undefined | Unsubscribe => {
  const controller = getTopController(ctx.cause)

  if (controller) {
    const handler = () => cb(toAbortError(controller.signal.reason))
    const cleanup = () =>
      controller.signal.removeEventListener('abort', handler)

    if (controller.signal.aborted) handler()
    else {
      controller.signal.addEventListener('abort', handler)
      return cleanup
    }
  }
}

const CHAINS = new WeakMap<
  Promise<any>,
  {
    promise: Promise<any>
    then: Array<Fn>
    catch: Array<Fn>
  }
>()
// TODO `reatomPromise`
/**
 * Subscribe to promise result with batching
 * @internal
 * @deprecated
 */
export const __thenReatomed = <T>(
  ctx: Ctx,
  origin: Promise<T>,
  onFulfill?: Fn<[value: T, read: Fn, actualize: Fn]>,
  onReject?: Fn<[error: unknown, read: Fn, actualize: Fn]>,
): Promise<T> => {
  let chain = CHAINS.get(origin)
  if (!chain) {
    const promise = origin.then(
      (value: any) => {
        ctx.get((read, actualize) =>
          chain!.then.forEach((cb) => cb(value, read, actualize)),
        )
        return value
      },
      (error: any) => {
        ctx.get((read, actualize) =>
          chain!.catch.forEach((cb) => cb(error, read, actualize)),
        )
        // prevent Uncaught DOMException for aborts
        if (isAbort(error)) promise.catch(noop)
        throw error
      },
    )

    CHAINS.set(origin, (chain = { promise, then: [], catch: [] }))
    CHAINS.set(promise, chain)
  }

  onFulfill && chain.then.push(onFulfill)
  onReject && chain.catch.push(onReject)

  return chain.promise
}

/** @deprecated use `ctx.controller` which is AbortController instead */
export const disposable = (
  ctx: Ctx,
): Ctx & {
  dispose: Unsubscribe
} => {
  const _ctx = Object.assign({}, ctx)
  let isDisposed = false

  for (const key in ctx) {
    // @ts-expect-error
    const value = ctx[key]

    if (typeof value !== 'function') continue

    Object.assign(_ctx, {
      [key](...a: Array<any>) {
        throwReatomError(isDisposed, 'access to disposed context branch')

        if (key === 'schedule') {
          const [effect] = a
          a[0] = (...a: Array<any>) => {
            try {
              var promise = Promise.resolve(effect(...a))
            } catch (error) {
              promise = Promise.reject(error)
            }

            return promise.finally(() => {
              // stack it forever
              if (isDisposed) return new Promise(() => {})
            })
          }
        }

        return value.apply(this, a)
      },
    })
  }

  return Object.assign(_ctx, {
    dispose() {
      isDisposed = true
    },
  })
}

const skip: unique symbol = Symbol()
type skip = typeof skip
export const take = <T extends Atom, Res = AtomReturn<T>>(
  ctx: Ctx,
  anAtom: T,
  mapper: Fn<[Ctx, Awaited<AtomReturn<T>>, skip], Res | skip> = (ctx, v: any) =>
    v,
  name?: string,
): Promise<Awaited<Res>> => {
  name &&= `${ctx.cause.proto.name}.${name}`

  const cleanups: Array<Fn> = []

  if (name) action(name)(ctx)

  return new Promise<Awaited<Res>>((res: Fn, rej) => {
    cleanups.push(
      onCtxAbort(ctx, rej) ?? noop,
      ctx.subscribe(anAtom, async (state) => {
        // skip the first sync call
        if (!cleanups.length) return

        try {
          if (anAtom.__reatom.isAction) state = state[0].payload
          const value = await state
          const result = mapper(ctx, value, skip)
          if (result !== skip) {
            res(result)
            if (name) action<any>(`${name}.resolve`)(ctx, result)
          }
        } catch (error) {
          rej(error)
          if (name) action<any>(`${name}.reject`)(ctx, error)
        }
      }),
    )
  }).finally(() => cleanups.forEach((cb) => cb()))
}

export const takeNested = <I extends any[]>(
  ctx: Ctx,
  cb: Fn<[Ctx, ...I]>,
  ...params: I
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const unabort = onCtxAbort(ctx, reject)

    let i = 1 // one for extra check
    const { schedule } = ctx
    const check = () => {
      if (i === 0) {
        unabort?.()
        resolve()
      }

      // add extra tick to make sure there is no microtask races
      if (--i === 0) Promise.resolve().then(check)
    }

    const result = cb(
      Object.assign({}, ctx, {
        schedule(this: Ctx, cb: Fn, step?: -1 | 0 | 1 | 2) {
          return schedule.call<Ctx, Parameters<Ctx['schedule']>, Promise<any>>(
            this,
            (ctx) => {
              const result = cb(ctx)
              if (result instanceof Promise) {
                ++i
                result.finally(check).catch(noop)
              }
              return result
            },
            step,
          )
        },
      }),
      ...params,
    )

    check()

    return result
  })

const _isCausedBy = (cause: AtomCache, proto: AtomProto): boolean =>
  cause.cause !== null &&
  (cause.cause.proto === proto || isCausedBy(cause.cause, proto))

export const isCausedBy = (
  caused: Ctx | AtomCache,
  by: Atom | AtomProto,
): boolean =>
  _isCausedBy(
    'subscribe' in caused ? caused.cause : caused,
    '__reatom' in by ? by.__reatom : by,
  )

export const withAbortableSchedule = <T extends Ctx>(ctx: T): T => {
  const { schedule } = ctx

  return merge(ctx, {
    schedule(
      this: Ctx,
      cb: Parameters<typeof schedule>[0],
      step: Parameters<typeof schedule>[1] = 1,
    ) {
      if (step < 1) return schedule.call(this, cb, step)

      let resolve: Fn
      let reject: Fn
      const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
      })
      // do not wait the effect if the abort occurs
      const unabort = onCtxAbort(this, (error) => {
        // prevent unhandled error for abort
        promise.catch(noop)
        reject(error)
      })
      schedule
        .call(
          this,
          async (_ctx) => {
            try {
              const controller = getTopController(this.cause)
              throwIfAborted(controller)
              const value = await cb(_ctx)
              throwIfAborted(controller)
              resolve(value)
            } catch (error) {
              reject(error)
            }
            unabort?.()
          },
          step,
        )
        .catch((error) => {
          reject(error)
          unabort?.()
        })

      return promise
    },
  })
}

export const concurrentControllers = new WeakMap<
  Fn,
  Atom<null | AbortController>
>()
export const concurrent: {
  <T extends (ctx: Ctx, ...a: any[]) => any>(fn: T, strategy?: 'last-in-win'): T
  <T extends (ctx: CtxSpy, ...a: any[]) => any>(
    fn: T,
    strategy?: 'last-in-win',
  ): T
  <T extends (ctx: Ctx, ...a: any[]) => Promise<any>>(
    fn: T,
    strategy: 'first-in-win',
  ): T
  <T extends (ctx: CtxSpy, ...a: any[]) => Promise<any>>(
    fn: T,
    strategy: 'first-in-win',
  ): T
} = (fn: Fn, strategy: 'last-in-win' | 'first-in-win' = 'last-in-win'): Fn => {
  const abortControllerAtom = atom<null | AbortController>(
    null,
    `${__count('_concurrent')}.abortControllerAtom`,
  )

  const target = action(
    (ctx: Ctx, topCtx: Ctx, ...a: any[]) => {
      const prevController = ctx.get(abortControllerAtom)
      const controller = new AbortController()
      // do it outside of the schedule to save the call stack
      const abort = toAbortError('concurrent')

      if (strategy === 'first-in-win') {
        if (prevController) {
          const rej = Promise.reject(abort)
          rej.catch(noop)
          return rej
        } else {
          abortControllerAtom(ctx, controller)
        }
      }
      if (strategy === 'last-in-win') {
        abortControllerAtom(ctx, controller)

        prevController?.abort(abort)
      }

      const unabort = onCtxAbort(topCtx, (error) => {
        if (error !== abort) {
          // prevent unhandled error for abort
          if (result instanceof Promise) result.catch(noop)
          controller.abort(error)
        }
      })

      abortCauseContext.set(ctx.cause, controller)

      var result = fn(
        withAbortableSchedule({ ...ctx, spy: topCtx.spy }) as CtxSpy,
        ...a,
      )
      if (result instanceof Promise) {
        result = result.finally(() => {
          if (strategy === 'first-in-win') {
            abortControllerAtom(ctx, null)
          }

          unabort?.()
          // prevent uncaught rejection for the abort
          if (controller.signal.aborted) result.catch(noop)
        })
        // prevent uncaught rejection for the abort
        controller.signal.addEventListener('abort', () => {
          result.catch(noop)
        })
      } else {
        throwReatomError(
          strategy === 'first-in-win',
          'can\'t apply "first-in-win" strategy for non-async function',
        )
      }
      return result
    },
    isAtom(fn) ? `${fn.__reatom.name}._concurrent` : '_concurrent',
  )

  const result = Object.assign(
    (ctx: Ctx, ...a: any[]) => target(ctx, ctx, ...a),
    target,
    // if the `fn` is an atom we need to assign all related properties
    fn,
  )

  concurrentControllers.set(result, abortControllerAtom)

  return result
}

export const withConcurrency: {
  <T extends Action>(strategy?: 'last-in-win'): (target: T) => T
  <T extends Action<any[], Promise<any>>>(
    strategy: 'first-in-win',
  ): (target: T) => T
} =
  (strategy?: 'last-in-win' | 'first-in-win') =>
  (target: Action): Action =>
    concurrent(target, strategy as any)

/** Internal spawn action which is used to redefine the cause abort controller */
export const _spawn = action(
  (ctx, fn: Fn, controller: AbortController, ...args: any[]) => {
    abortCauseContext.set(ctx.cause, controller)
    return fn(ctx, ...args)
  },
  '_spawn',
)

export const spawn = <Args extends any[], Payload>(
  ctx: Ctx,
  fn: Fn<[Ctx, ...Args], Payload>,
  args: Args = [] as any[] as Args,
  controller = new AbortController(),
): Payload => {
  return _spawn(ctx, fn, controller, ...args)
}

export interface ReactionAtom<Payload> extends Atom<Payload> {
  unsubscribe: Unsubscribe
}

export interface Reaction<Params extends any[], Payload>
  extends Action<Params, ReactionAtom<Payload>> {}

export const reaction = <Params extends any[], Payload>(
  cb: (ctx: CtxSpy, ...params: Params) => Payload,
  name = __count('reaction'),
): Reaction<Params, Payload> =>
  action((ctx, ...params: Params) => {
    const reducer = concurrent((ctx) => cb(ctx as CtxSpy, ...params))
    const reactionAtom = atom(reducer, __count(name))
    const abort = (reason: any) => {
      const controllerAtom = concurrentControllers.get(reducer)
      if (controllerAtom) {
        ctx.get(controllerAtom)?.abort(toAbortError(reason))
      }
    }
    const un = ctx.subscribe(reactionAtom, noop)
    const unabort = onCtxAbort(ctx, (error) => {
      un()
      abort(error)
    })
    const unsubscribe = () => {
      un()
      unabort?.()
      abort('unsubscribe')
    }

    return { ...reactionAtom, unsubscribe } as ReactionAtom<Payload>
  })
