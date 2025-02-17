import { AtomMut, Fn } from '@reatom/core'
import { AsyncAction, AsyncCtx, ControlledPromise } from '.'
import { assign, isAbort, throwIfAborted, toAbortError } from '@reatom/utils'
import { __thenReatomed } from '@reatom/effects'

export const handleEffect = (
  anAsync: AsyncAction,
  params: readonly [AsyncCtx, ...any[]],
  {
    shouldPending = true,
    shouldFulfill = true,
    shouldReject = true,
    // @ts-expect-error could be reassigned by the testing package
    effect = anAsync.__reatom.unstable_fn as Fn,
  } = {},
): ControlledPromise => {
  const pendingAtom = anAsync.pendingAtom as AtomMut<number>
  const [ctx] = params

  if (shouldPending) pendingAtom(ctx, (s) => ++s)

  const origin = ctx.schedule(
    () =>
      new Promise((res, rej) => {
        throwIfAborted(ctx.controller)
        effect(...params).then(res, rej)
        ctx.controller.signal.addEventListener('abort', () =>
          rej(toAbortError(ctx.controller.signal.reason)),
        )
      }),
  )

  return assign(
    __thenReatomed(
      ctx,
      origin,
      (v) => {
        if (shouldFulfill) anAsync.onFulfill(ctx, v)
        if (shouldPending) pendingAtom(ctx, (s) => --s)
      },
      (e) => {
        if (shouldReject && !isAbort(e)) anAsync.onReject(ctx, e)
        if (shouldPending) pendingAtom(ctx, (s) => --s)
      },
    ),
    { controller: ctx.controller },
  )
}
