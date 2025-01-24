import { Action, atom, Atom, AtomCache, AtomState, Ctx, Fn, isAtom, throwReatomError } from '@reatom/core'
import { onCtxAbort } from '@reatom/effects'
import { mapName } from './utils'
import { type LensAtom, type LensAction } from './'

export interface DelayOptions {
  /** The minimum amount of the delay (debounce-like)
   * @default `max`
   */
  min?: number | Atom<number>
  /** The maximum amount of the delay (throttle-like)
   * @default `min`
   */
  max?: number | Atom<number>
  /** Should the first update be captured (throttle-like)?
   * @default true
   */
  leading?: boolean
  /** Should the last update be captured (debounce-like)?
   * @default true
   */
  trailing?: boolean
  /** Should subscribe to an AbortController from the cause?
   * @default true
   */
  abortable?: boolean
}

/** Flexible updates delayer */
export const delay: {
  // TODO for some reason an atom not handled by overloads, if an action overload is first
  <T extends Atom>(
    options: DelayOptions,
    name?: string,
  ): Fn<[T], T extends Action<infer Params, infer Payload> ? LensAction<Params, Payload> : LensAtom<AtomState<T>>>
} = (options, name) => (anAtom: Atom) => {
  // listeners is a unique object for each atom instance
  const running = new WeakMap<AtomCache['listeners'], number>()
  let { min: minOption, max: maxOption, leading = true, trailing = true, abortable = true } = options

  throwReatomError(minOption === undefined && maxOption === undefined, 'wrong options')

  minOption ??= maxOption
  maxOption ??= Number.MAX_SAFE_INTEGER

  name = mapName(anAtom, 'delay', name)

  const minAtom = isAtom(minOption) ? minOption : atom(minOption, `${name}._minAtom`)
  const maxAtom = isAtom(maxOption) ? maxOption : atom(maxOption, `${name}._maxAtom`)

  // @ts-expect-error
  const theAtom: LensAtom & LensAction = atom((ctx, prevState?: any) => {
    const min = ctx.get(minAtom)
    const max = ctx.get(maxAtom)
    const startsKey = ctx.cause.listeners
    const depState = ctx.spy(anAtom)
    let state = ctx.cause.pubs.length ? prevState : proto.isAction ? [] : depState

    if (!ctx.cause.pubs.length) {
      state = proto.isAction ? [] : depState
    } else {
      const now = Date.now()
      const isRunning = running.has(startsKey)
      const start = running.get(startsKey) ?? now
      const skip = isRunning || !leading

      state = skip ? prevState : proto.isAction ? [depState[0]] : depState

      const delay = Math.max(0, Math.min(min!, max! - (now - start)))

      running.set(startsKey, start!)
      ctx.schedule(() => running.delete(startsKey), -1)

      const timeoutId = setTimeout(
        () =>
          ctx.get((read, acualize) => {
            if (read(proto) === ctx.cause) {
              running.delete(startsKey)
              if (trailing && skip) {
                acualize!(ctx, proto, (patchCtx: Ctx, patch: AtomCache) => {
                  patch.state = proto.isAction ? [depState.at(-1)] : depState
                })
              }
            }
          }),
        delay,
      )
      timeoutId.unref?.()
      ctx.schedule(() => clearTimeout(timeoutId), -1)
      if (abortable) onCtxAbort(ctx, () => clearTimeout(timeoutId))
    }

    return state
  }, name)
  const proto = theAtom.__reatom
  proto.isAction = anAtom.__reatom.isAction
  theAtom.deps = [anAtom]

  return theAtom as any
}

/** Delay updates by timeout */
export const debounce: {
  // TODO for some reason an atom not handled by overloads, if an action overload is first
  <T extends Atom>(
    wait: DelayOptions['min'],
    name?: string,
  ): Fn<[T], T extends Action<infer Params, infer Payload> ? LensAction<Params, Payload> : LensAtom<AtomState<T>>>
} =
  (min = 1, name) =>
  (anAtom) =>
    // @ts-expect-error
    delay({ min, leading: false, trailing: true }, mapName(anAtom, 'debounce', name))(anAtom)

/** Skip updates by interval */
export const throttle: {
  // TODO for some reason an atom not handled by overloads, if an action overload is first
  <T extends Atom>(
    wait: DelayOptions['max'],
    name?: string,
  ): Fn<[T], T extends Action<infer Params, infer Payload> ? LensAction<Params, Payload> : LensAtom<AtomState<T>>>
} =
  (max = 1, name) =>
  (anAtom) =>
    // @ts-expect-error
    delay({ max, leading: true, trailing: false }, mapName(anAtom, 'throttle', name))(anAtom)
