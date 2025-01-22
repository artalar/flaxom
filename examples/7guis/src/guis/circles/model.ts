import {
  action,
  atom,
  reatomArray,
  random,
  parseAtoms,
} from '@reatom/framework'
import { reatomDynamicUndo } from '@reatom/undo'
import type { Atom, AtomMut } from '@reatom/framework'

export interface Circle {
  name: string
  xAtom: AtomMut<number>
  yAtom: AtomMut<number>
  diameterAtom: AtomMut<number>
  hoveredAtom: Atom<boolean>
  selectedAtom: Atom<boolean>
  activeAtom: Atom<boolean>
}

export const circlesAtom = reatomArray<Circle>([], 'circlesAtom')

export const undoAtom = reatomDynamicUndo(
  (ctx) => {
    parseAtoms(ctx, circlesAtom)
  },
  {
    name: 'undoAtom',
    shouldUpdate: (_ctx, state) => {
      return typeof state.cause?.state !== 'boolean'
    },
  },
)

export const selectedAtom = atom<Circle | null>(null, 'selectedAtom')
export const hoveredAtom = atom<Circle | null>(null, 'hoveredAtom')

export const reatomCircle = (
  x: number,
  y: number,
  diameter: number,
): Circle => {
  const name = `circle#${random(1, 1e10)}`

  const circle: Circle = {
    name,
    xAtom: atom(x, `${name}.xAtom`),
    yAtom: atom(y, `${name}.yAtom`),
    diameterAtom: atom(diameter, `${name}.diameterAtom`),
    hoveredAtom: atom((ctx) => {
      return circle === ctx.spy(hoveredAtom)
    }, `${name}.hoveredAtom`),
    selectedAtom: atom((ctx) => {
      return circle === ctx.spy(selectedAtom)
    }, `${name}.selectedAtom`),
    activeAtom: atom((ctx) => {
      if (ctx.spy(selectedAtom) === null) return ctx.spy(circle.hoveredAtom)
      return ctx.spy(circle.selectedAtom)
    }, `${name}.activeAtom`),
  }

  return circle
}

export const getClosestAction = action(
  (ctx, x: number, y: number): Circle | null => {
    let circle = null
    let minDist = Number.MAX_VALUE
    const circles = ctx.get(circlesAtom)
    for (const c of circles) {
      const d = Math.sqrt(
        Math.pow(x - ctx.get(c.xAtom), 2) + Math.pow(y - ctx.get(c.yAtom), 2),
      )
      if (d <= ctx.get(c.diameterAtom) / 2 && d < minDist) {
        circle = c
        minDist = d
      }
    }
    return circle
  },
  'getClosestAction',
)

export const addCircleAction = action((ctx, x: number, y: number) => {
  const circle = reatomCircle(x, y, 30)
  const length = ctx.get(circlesAtom).length
  circlesAtom.toSpliced(ctx, length, 0, circle)
  void ctx.schedule(() => {
    hoveredAtom(ctx, circle)
  })
}, 'addCircleAction')

export const contextMenuAction = action((ctx) => {
  const hovered = ctx.get(hoveredAtom)
  if (hovered === null) return
  selectedAtom(ctx, hovered)
}, 'contextMenuAction')

export const mouseMoveAction = action((ctx, x: number, y: number) => {
  const closest = getClosestAction(ctx, x, y)
  hoveredAtom(ctx, closest)
}, 'mouseMoveAction')

export const mouseLeaveAction = action((ctx) => {
  hoveredAtom(ctx, null)
}, 'mouseLeaveAction')

export const stopChangeDiameterAction = action((ctx, d: number) => {
  const circle = ctx.get(selectedAtom)!
  const hovered = ctx.get(hoveredAtom)
  const selected = ctx.get(selectedAtom)

  hoveredAtom(ctx, null)
  selectedAtom(ctx, null)

  ctx
    .schedule(() => {
      circle.diameterAtom(ctx, d)
    })
    .then(() => {
      hoveredAtom(ctx, hovered)
      hoveredAtom(ctx, selected)
    })
}, 'stopChangeDiameterAction')

export const getInitialDiameterAction = action(
  (ctx) => ctx.get(ctx.get(selectedAtom)!.diameterAtom),
  'getInitialDiameterAction',
)
