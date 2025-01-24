import { History, Location, To, Blocker } from 'history'

import { action, atom, Atom, AtomMut, Action, throwReatomError } from '@reatom/core'
import { onUpdate } from '@reatom/hooks'
import { isShallowEqual } from '@reatom/utils'

export interface HistoryAtom extends AtomMut<History> {
  back: Action<[]>
  block: Action<[blocker: Blocker], () => void>
  forward: Action<[]>
  go: Action<[delta: number]>
  location: Atom<Location>
  push: Action<[to: To, state?: any]>
  replace: Action<[to: To, state?: any]>
}

// @ts-expect-error
export const historyAtom: HistoryAtom = atom(null, 'historyAtom')
onUpdate(historyAtom, (ctx, history) => {
  history.listen(
    () =>
      isShallowEqual(ctx.get(locationAtom), history.location) ||
      // @ts-expect-error
      locationAtom(ctx, history.location),
  )
  // @ts-expect-error
  locationAtom(ctx, history.location)
})

// @ts-expect-error
const locationAtom: HistoryAtom['location'] = atom(null, 'historyAtom.location')
locationAtom.__reatom.computer = (ctx) => Object.assign({}, ctx.spy(historyAtom).location)

const push: HistoryAtom['push'] = action((ctx, to: To, state?: any) => {
  const history = ctx.get(historyAtom)
  history.push(to, state)
  locationAtom.__reatom.patch!.cause = ctx.cause
}, 'historyAtom.push')

const replace: HistoryAtom['replace'] = action((ctx, to: To, state?: any) => {
  const history = ctx.get(historyAtom)
  history.replace(to, state)
  locationAtom.__reatom.patch!.cause = ctx.cause
}, 'historyAtom.replace')

const go: HistoryAtom['go'] = action((ctx, delta: number) => {
  const history = ctx.get(historyAtom)
  history.go(delta)
  locationAtom.__reatom.patch!.cause = ctx.cause
}, 'historyAtom.go')

const back: HistoryAtom['back'] = action((ctx) => {
  const history = ctx.get(historyAtom)
  history.back()
  locationAtom.__reatom.patch!.cause = ctx.cause
}, 'historyAtom.back')

const forward: HistoryAtom['forward'] = action((ctx) => {
  const history = ctx.get(historyAtom)
  history.forward()
  locationAtom.__reatom.patch!.cause = ctx.cause
}, 'historyAtom.forward')

const block: HistoryAtom['block'] = action((ctx, blocker: Blocker) => {
  const history = ctx.get(historyAtom)
  const unblock = history.block(blocker)
  locationAtom.__reatom.patch!.cause = ctx.cause

  return unblock
}, 'historyAtom.block')

historyAtom.back = back
historyAtom.block = block
historyAtom.forward = forward
historyAtom.go = go
historyAtom.location = locationAtom
historyAtom.push = push
historyAtom.replace = replace
