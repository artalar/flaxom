import {
  Atom,
  AtomMut,
  Ctx,
  CtxSpy,
  createCtx,
  throwReatomError,
} from '@reatom/core'
import { App, ref, Ref, onScopeDispose, inject, InjectionKey } from 'vue'

const reatomCtxKey = Symbol('reatomCtxKey') as InjectionKey<Ctx>

export const createReatomVue =
  (ctx = createCtx()) =>
  (app: App) => {
    app.provide(reatomCtxKey, ctx)
  }

export const reatomRef = ((target: any, ctx = inject(reatomCtxKey)!) => {
  throwReatomError(
    !ctx,
    'ctx is not passed explicitly nor provided with "createReatomVue"',
  )

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
