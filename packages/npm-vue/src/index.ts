import {
  Atom,
  AtomMut,
  Ctx,
  CtxSpy,
  Fn,
  __count,
  action,
  atom,
  isAction,
  isAtom,
  throwReatomError,
} from '@reatom/core'
import { Binded, bind } from '@reatom/lens'
import { App, ref, Ref, onScopeDispose, inject } from 'vue'

const ReatomCtxKey = 'ReatomCtxKey'

export const createReatomVue = (ctx: Ctx) => (app: App) => {
  app.provide(ReatomCtxKey, ctx)
}

export const useCtx = () => {
  const ctx = inject<Ctx>(ReatomCtxKey)!
  throwReatomError(!ctx, 'Reatom context not available')
  return ctx!
}

export const reatomRef = ((target: any, ctx = useCtx()) => {
  if (!isAtom(target) && typeof target === 'function') target = atom(target)

  const vueState = ref()
  const readonly = typeof target !== 'function'

  onScopeDispose(ctx.subscribe(target, (state) => (vueState.value = state)))

  return {
    __v_isRef: true,
    get value() {
      return vueState.value
    },
    set value(next) {
      throwReatomError(readonly, 'Cannot write to a readonly atom')
      ;(target as AtomMut)(ctx, next)
    },
  } as any
}) as {
  <T>(atom: AtomMut<T>, ctx?: Ctx): Ref<T>
  <T>(atom: Atom<T> | ((ctx: CtxSpy) => T), ctx?: Ctx): Readonly<Ref<T>>
}

const binder = (ctx: Ctx, fn: Fn) => bind(ctx, fn)
export const useCtxBinder = (
  ctx = useCtx(),
): (<T extends Fn>(fn: T) => Binded<T>) => bind(ctx, binder)

interface UseActionConfig {
  name?: string
  ctx?: Ctx
}

export const useAction = <T extends Fn<[Ctx, ...Array<any>]>>(
  fn: T,
  config: string | UseActionConfig = {},
) => {
  if (typeof config === 'string') config = { name: config }

  return bind(
    config.ctx ?? useCtx(),
    isAction(fn) //
      ? fn
      : action(fn, config.name ?? __count('useAction')),
  )
}
