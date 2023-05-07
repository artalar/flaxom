import {
  Atom,
  AtomCache,
  AtomReturn,
  Ctx,
  throwReatomError,
  Unsubscribe,
} from '@reatom/core'
import { AbortError, throwIfAborted, toAbortError } from '@reatom/utils'

/** Handle abort signal from a cause */
export const onCtxAbort = (ctx: Ctx, cb: (error: AbortError) => any) => {
  let cause: null | (AtomCache & { controller?: AbortController }) = ctx.cause
  while (cause && !cause.controller) cause = cause.cause
  const controller = cause?.controller

  throwIfAborted(controller)

  controller?.signal.addEventListener('abort', () =>
    cb(toAbortError(controller.signal.reason)),
  )
}

const LISTENERS = new WeakMap<
  Promise<any>,
  {
    then: Array<(...args: any[]) => any>
    catch: Array<(...args: any[]) => any>
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
  promise: Promise<T>,
  onFulfill?: (
    value: T,
    read: (...args: any[]) => any,
    actualize: (...args: any[]) => any,
  ) => any,
  onReject?: (
    error: unknown,
    read: (...args: any[]) => any,
    actualize: (...args: any[]) => any,
  ) => any,
) => {
  let listeners = LISTENERS.get(promise)
  if (!listeners) {
    LISTENERS.set(promise, (listeners = { then: [], catch: [] }))

    promise.then(
      (value: any) =>
        ctx.get((read, actualize) =>
          listeners!.then.forEach((cb) => cb(value, read, actualize)),
        ),
      (error: any) =>
        ctx.get((read, actualize) =>
          listeners!.catch.forEach((cb) => cb(error, read, actualize)),
        ),
    )
  }

  onFulfill && listeners.then.push(onFulfill)
  onReject && listeners.catch.push(onReject)
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

export const take = <T extends Atom, Res = AtomReturn<T>>(
  ctx: Ctx & { controller?: AbortController },
  anAtom: T,
  mapper: (ctx: Ctx, arg: Awaited<AtomReturn<T>>) => Res = (ctx, v: any) => v,
): Promise<Awaited<Res>> =>
  new Promise<Awaited<Res>>((res: (...args: any[]) => any, rej) => {
    onCtxAbort(ctx, rej)

    let skipFirst = true,
      un = ctx.subscribe(anAtom, (state) => {
        if (skipFirst) return (skipFirst = false)
        un()
        if (anAtom.__reatom.isAction) state = state[0].payload
        if (state instanceof Promise) {
          state.then((v) => res(mapper(ctx, v)), rej)
        } else {
          res(mapper(ctx, state))
        }
      })
    ctx.schedule(un, -1)
  })

export const takeNested = <I extends any[]>(
  ctx: Ctx & { controller?: AbortController },
  cb: (ctx: Ctx, ...rest: I) => any,
  ...params: I
): Promise<void> =>
  new Promise<void>((res, rej) => {
    onCtxAbort(ctx, rej)

    let i = 0,
      { schedule } = ctx

    return cb(
      Object.assign({}, ctx, {
        schedule(
          this: Ctx,
          cb: (...args: any[]) => any,
          step?: -1 | 0 | 1 | 2,
        ) {
          return schedule.call<Ctx, Parameters<Ctx['schedule']>, Promise<any>>(
            this,
            (ctx) => {
              const result = cb(ctx)
              if (result instanceof Promise) {
                ++i
                result.finally(() => --i === 0 && res())
              }
              return result
            },
            step,
          )
        },
      }),
      ...params,
    )
  })
