import { Ctx, Fn, Unsubscribe } from '@reatom/core'
import { onCtxAbort } from '@reatom/effects'

export type EventOfTarget<
  Target extends EventTarget,
  Type extends string,
> = Target extends Record<`on${Type}`, infer Cb>
  ? // @ts-expect-error `Cb extends Fn` broke the inference for some reason
    Parameters<Cb>[0] // correct type
  : Target extends Record<'onEvent', (type: Type, cb: infer Cb) => any>
  ? // @ts-expect-error `Cb extends Fn` broke the inference for some reason
    Parameters<Cb>[0] // general type
  : never

// @ts-ignore
export const onEvent: {
  <
    Target extends EventTarget,
    Type extends Target extends Record<`on${infer Type}`, Fn> ? Type : string,
  >(
    ctx: Ctx,
    target: Target,
    type: Type,
  ): Promise<EventOfTarget<Target, Type>>
  <Event>(ctx: Ctx, target: EventTarget, type: string): Promise<Event>
  <
    Target extends EventTarget,
    Type extends Target extends Record<`on${infer Type}`, Fn> ? Type : string,
  >(
    ctx: Ctx,
    target: Target,
    type: Type,
    cb: (value: EventOfTarget<Target, Type>) => any,
    options?: AddEventListenerOptions
  ): Unsubscribe
  <Event>(
    ctx: Ctx,
    target: EventTarget,
    type: string,
    cb: (value: Event) => any,
    options?: AddEventListenerOptions
  ): Unsubscribe
} = (ctx: Ctx, target: EventTarget, type: string, listener: Fn) => {
  let un
  if (!listener) {
    return new Promise((r) => (un = onEvent(ctx, target, type, r))).finally(un)
  }
  target.addEventListener(type, listener)
  un = () => target.removeEventListener(type, listener)
  onCtxAbort(ctx, un)
  return un
}

// export const withEvent: {
//   <
//     A extends AtomMut,
//     Type extends Target extends Record<`on${infer Type}`, Fn> ? Type : string,
//     Target extends EventTarget,
//   >(
//     type: Type,
//     target: Target,
//     map: (
//       ctx: Ctx,
//       event: EventOfTarget<Target, Type>,
//       state: AtomState<A>,
//     ) => AtomState<A>,
//   ): (anAtom: A) => A
// } = (type, target, map) => (anAtom) => {
//   onConnect(anAtom, (ctx) =>
//     onEvent(ctx, target, type, (event) => {
//       // @ts-expect-error
//       anAtom(ctx, (state) => map(ctx, event, state))
//     }),
//   )
//   return anAtom
// }

// export const reatomEvent: {
//   <
//     Type extends Target extends Record<`on${infer Type}`, Fn> ? Type : string,
//     Target extends EventTarget = Window,
//   >(
//     type: Type,
//     target?: Target,
//     filter?: (event: EventOfTarget<Target, Type>) => boolean,
//   ): Action<[EventOfTarget<Target, Type>], EventOfTarget<Target, Type>>
// } = (type, target, filter = () => true) => {
//   const event = action(`event.${type}`)
//   onConnect(event, (ctx) =>
//     onEvent(ctx, target ?? window, type, (e) => {
//       if (filter(e)) event(ctx, e)
//     }),
//   )
//   return event
// }
