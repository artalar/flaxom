import type { Ctx, CtxSpy, Atom, Unsubscribe } from '@reatom/core'
import { atom, throwReatomError } from '@reatom/core'
import { nonNullable } from '@reatom/utils'
import { LitElement, PropertyValues } from 'lit'

type Constructor<T> = new (...args: any[]) => T

const isShallowEqual = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((el, i) => el === b[i])

let ctx: Ctx

/**
 * Set context for all classes wraped by withReatom
 *
 * Call it once
 *
 * @param value {Ctx} - Reatom context
 */
export const setupCtx = (value: Ctx): void => {
  throwReatomError(ctx, 'Ctx is already set')
  ctx = value
}

/**
 * Mixin subscribes for atoms used in component render
 *
 * @param superClass - LitElement extended class
 *
 * @returns class with ctx property
 */
export const withReatom = <T extends Constructor<LitElement>>(superClass: T): T & Constructor<{ ctx: CtxSpy }> => {
  return class ReatomLit extends superClass {
    private unsub?: Unsubscribe
    private deps: Array<Atom> = []
    private depsListAtom = atom<Array<Atom>>([])
    private depsTrackAtom = atom((ctx) => ctx.spy(this.depsListAtom).map(ctx.spy))
    ctx?: CtxSpy

    private tryConnectCtx() {
      if (this.ctx) {
        return
      }
      this.ctx = {
        ...ctx,
        spy: (anAtom) => {
          this.deps.push(anAtom)
          return ctx.get(anAtom)
        },
      }
    }

    willUpdate(_changedProperties: PropertyValues) {
      super.willUpdate(_changedProperties)
      this.deps = []
      this.tryConnectCtx()
    }

    updated(_changedProperties: PropertyValues) {
      super.updated(_changedProperties)
      if (!this.ctx) {
        return
      }
      if (!isShallowEqual(this.deps, this.ctx.get(this.depsListAtom))) {
        this.depsListAtom(this.ctx, this.deps)
      }
    }

    connectedCallback() {
      super.connectedCallback()
      let prevDepsList = this.deps
      this.tryConnectCtx()

      const ctx = nonNullable(this.ctx, 'Ctx is no set')

      this.unsub = ctx.subscribe(this.depsTrackAtom, () => {
        const depsList = ctx.get(this.depsListAtom)
        // skip updates from the deps change during render
        if (isShallowEqual(prevDepsList, depsList)) {
          this.requestUpdate()
        } else {
          prevDepsList = depsList
        }
      })
    }

    disconnectedCallback() {
      super.disconnectedCallback()
      this.unsub?.()
    }
  } as T & Constructor<{ ctx: CtxSpy }>
}
