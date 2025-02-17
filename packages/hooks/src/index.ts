import {
  action,
  Action,
  atom,
  Atom,
  AtomCache,
  AtomProto,
  AtomState,
  Ctx,
  CtxSpy,
  Fn,
  throwReatomError,
  Unsubscribe,
} from '@reatom/core'
import { noop, toAbortError } from '@reatom/utils'
import {
  abortCauseContext,
  onCtxAbort,
  withAbortableSchedule,
} from '@reatom/effects'

export const getRootCause = (cause: AtomCache): AtomCache =>
  cause.cause === null ? cause : getRootCause(cause.cause)

export const isSameCtx = (ctx1: Ctx, ctx2: Ctx) =>
  getRootCause(ctx1.cause) === getRootCause(ctx2.cause)

export const addOnConnect = (anAtom: Atom, cb: Fn<[Ctx]>) =>
  (anAtom.__reatom.connectHooks ??= new Set()).add(cb)

export const addOnDisconnect = (anAtom: Atom, cb: Fn<[Ctx]>) =>
  (anAtom.__reatom.disconnectHooks ??= new Set()).add(cb)

export const addOnUpdate = <T extends Atom>(
  anAtom: T,
  cb: Fn<[Ctx, AtomCache<AtomState<T>>]>,
) => (anAtom.__reatom.updateHooks ??= new Set()).add(cb)

export const withInit =
  <T extends Atom>(
    createState: Fn<[Ctx, T['__reatom']['initState']], AtomState<T>>,
  ): Fn<[T], T> =>
  (anAtom) => {
    const { initState, isAction } = anAtom.__reatom

    throwReatomError(isAction, 'action state is not manageable')

    anAtom.__reatom.initState = (ctx) => createState(ctx, initState)

    return anAtom
  }

export const _onConnect = action(
  (ctx, anAtom: Atom, fn: Fn, controller: AbortController) => {
    ctx.cause.cause = getRootCause(ctx.cause)
    abortCauseContext.set(ctx.cause, controller)
    const result = fn(
      withAbortableSchedule({
        ...ctx,
        controller,
        isConnected: () => isConnected(ctx, anAtom),
      }),
    )
    if (result instanceof Promise) {
      controller.signal.addEventListener('abort', () => result.catch(noop))
    }
    return result
  },
  '_onConnect',
)

export const onConnect = (
  anAtom: Atom,
  cb: Fn<
    [Ctx & { controller: AbortController; isConnected(): boolean }],
    (() => void) | unknown
  >,
): Unsubscribe => {
  const connectHook = (ctx: Ctx) => {
    const controller = new AbortController()
    const cleanup = _onConnect(ctx, anAtom, cb, controller)

    if (cleanup instanceof Promise) cleanup.catch(noop)

    // TODO: abort on `connectHooks.delete`?
    const cleanupHook = (_ctx: Ctx) => {
      if (
        isSameCtx(ctx, _ctx) &&
        disconnectHooks.delete(cleanupHook) &&
        connectHooks.has(connectHook)
      ) {
        controller.abort(toAbortError(`${anAtom.__reatom.name} disconnect`))
        typeof cleanup === 'function' && cleanup()
      }
    }

    const disconnectHooks = addOnDisconnect(anAtom, cleanupHook)
  }

  const connectHooks = addOnConnect(anAtom, connectHook)

  return () => connectHooks.delete(connectHook)
}

export const onDisconnect = (anAtom: Atom, cb: Fn<[Ctx]>): Unsubscribe =>
  onConnect(anAtom, (ctx) => () => cb(ctx))

// @ts-expect-error
const _onUpdate: {
  <Params extends any[], Payload>(
    anAction: Action<Params, Payload> & { deps?: Array<Atom> },
    cb?: Fn<
      [
        Ctx,
        Payload,
        AtomCache<AtomState<Action<Params, Payload>>> & { params: Params },
      ]
    >,
  ): Unsubscribe
  <T>(
    anAtom: Atom<T> & { deps?: Array<Atom> },
    cb?: Fn<[Ctx, T, AtomCache<T>]>,
  ): Unsubscribe
} = <T>(
  anAtom: Action<any[], T> | Atom<T>,
  cb: Fn<[Ctx, T, AtomCache<T>]> = noop,
) => {
  const hook = (ctx: Ctx, patch: AtomCache & { params?: unknown[] }) => {
    let { state } = patch
    if (anAtom.__reatom.isAction) {
      if (patch.state.length === 0) return
      const call = state.at(-1)!
      state = call.payload
      patch.params = call.params
    }
    cb(ctx, state, patch)
  }

  const hooks = addOnUpdate(anAtom, hook)

  return () => hooks.delete(hook)
}

export const onUpdate: typeof _onUpdate = (anAtom: Atom, cb = noop) =>
  ((anAtom as Atom & { deps?: Array<Atom> }).deps ?? []).reduce(
    (acc, dep) => {
      const un = onUpdate(dep, (ctx) => ctx.get(anAtom))
      return () => {
        un()
        acc()
      }
    },
    _onUpdate(anAtom, cb) as Unsubscribe,
  )

/** @deprecated use the second parameter of `ctx.spy` instead */
// @ts-ignore
export const spyChange: {
  <Params extends any[], Payload>(
    ctx: CtxSpy,
    anAction: Action<Params, Payload>,
    handler?: Fn<[{ params: Params; payload: Payload }]>,
  ): boolean
  <T>(ctx: CtxSpy, anAtom: Atom<T>, handler?: Fn<[T, T?]>): boolean
} = (ctx: CtxSpy, anAtom: Atom, handler?: Fn) => {
  let isChanged = false
  ctx.spy(anAtom, (newState, prevState) => {
    isChanged = true
    handler?.(newState, prevState)
  })
  return isChanged
}

export const controlConnection =
  <T>(
    initState = true,
    name?: string,
  ): Fn<
    [Atom<T>],
    Atom<T> & { toggleConnection: Action<[boolean?], boolean> }
  > =>
  (anAtom) => {
    name ??= `${anAtom.__reatom.name}.controlConnection`

    const isActiveAtom = atom(initState, `${name}._isActiveAtom`)

    return Object.assign(
      {
        toggleConnection: action(
          (ctx, value) => isActiveAtom(ctx, (state) => value ?? !state),
          `${name}.toggleConnection`,
        ),
      },
      atom(
        (ctx, state?: any) => (ctx.spy(isActiveAtom) ? ctx.spy(anAtom) : state),
        name,
      ),
    )
  }

export const isConnected = (ctx: Ctx, { __reatom: proto }: Atom) =>
  ctx.get((read) => {
    const cache = proto.patch ?? read(proto)
    return !!cache && cache.subs.size + cache.listeners.size > 0
  })

const initializations = atom(
  null! as WeakMap<AtomProto, AtomCache>,
  'initializations',
)
initializations.__reatom.initState = () => new WeakMap()
export const isInit = (ctx: Ctx) => {
  const inits = ctx.get(initializations)
  if (!inits.has(ctx.cause.proto)) {
    inits.set(ctx.cause.proto, ctx.cause)
    return true
  }
  return inits.get(ctx.cause.proto) === ctx.cause
}
