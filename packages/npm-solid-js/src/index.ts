import { Atom, AtomMut, AtomState, Ctx, CtxSpy, Fn, __count, atom, isAtom, throwReatomError } from '@reatom/core'
import { bind } from '@reatom/lens'
import { Accessor, createContext, from, getOwner, useContext } from 'solid-js'

export const reatomContext = createContext<Ctx>()

export const useCtx = (): Ctx => {
  let ctx = useContext(reatomContext)

  throwReatomError(!ctx, 'ctx is not set, you probably forgot to specify the ctx provider')

  return ctx!
}

// @ts-ignore
export const useAtom: {
  <T extends Atom>(
    atom: T,
  ): [
    get: Accessor<AtomState<T>>,
    updater: T extends Fn<[Ctx, ...infer Args], infer Res> ? Fn<Args, Res> : undefined,
    atom: T,
  ]
  <T>(computed: (ctx: CtxSpy) => T, name?: string): [get: Accessor<T>, updater: undefined, atom: Atom<T>]
  <T>(init: T, name?: string): [get: Accessor<T>, updater: Fn<[T | Fn<[T, Ctx], T>], T>, atom: AtomMut<T>]
} = (init, name): [any, any, Atom] => {
  const theAtom: Atom = isAtom(init)
    ? init
    : atom(init, name ?? __count(`${getOwner()?.owner?.name?.replace('[solid-refresh]', '') ?? 'use'}Atom`))
  const ctx = useCtx()

  return [
    from((set) => ctx.subscribe(theAtom, set)),
    typeof theAtom === 'function' ? bind(ctx, theAtom) : undefined,
    theAtom,
  ]
}
