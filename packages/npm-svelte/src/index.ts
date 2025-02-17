import {
  Atom,
  AtomState,
  createCtx,
  Ctx,
  CtxParams,
  Fn,
  isAtom,
  throwReatomError,
  Unsubscribe,
} from '@reatom/core'
import { getContext, setContext } from 'svelte'

const KEY = 'reatomCtx'

export const setupCtx = (ctx = createCtx()) => setContext(KEY, ctx)

export const withSvelte = <
  T extends Atom & {
    subscribe?: Fn<[Fn<[any]>], Unsubscribe>
    set?: Fn<[any]>
  },
>(
  anAtom: T,
): T & {
  subscribe: Fn<[Fn<[AtomState<T>]>], Unsubscribe>
  set: T extends Fn ? Fn<CtxParams<T>, ReturnType<T>> : never
} => {
  throwReatomError(!isAtom(anAtom), 'atom expected')

  const ctx = getContext<Ctx>(KEY)

  anAtom.subscribe = (cb) => ctx.subscribe(anAtom, cb)

  // @ts-expect-error
  if (typeof anAtom === 'function') anAtom.set = (...a) => anAtom(ctx, ...a)

  // @ts-expect-error
  return anAtom
}
