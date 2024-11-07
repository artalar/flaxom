import {
  action,
  Action,
  atom,
  AtomCache,
  Ctx,
  type Rec,
  type LinkedListAtom,
  AtomMut,
  sleep,
  batch,
} from '@reatom/framework'
import { h, hf, JSX } from '@reatom/jsx'
import { followingsMap, getId, getStartCause, highlighted } from './utils'
import { reatomLinkedList } from '@reatom/primitives'

interface Params {
  patch: AtomCache
  svg: SVGElement
}

export interface Lines extends LinkedListAtom<[Params], JSX.Element, never> {
  highlight: Action<[Params], void>
  redraw: Action<[svg: SVGElement]>
}

export const reatomLines = (name: string): Lines => {
  const highlightedTargets = atom<Array<AtomCache>>([], `${name}:highlightedTargets`)

  const lines = reatomLinkedList(
    {
      // key: 'id',
      create(ctx, { svg, patch }: Params) {
        const containerRec = svg.getBoundingClientRect()
        let points = ''

        const calc = (target: AtomCache, cause: AtomCache): undefined | null | AtomCache => {
          if (highlighted.has(target)) return null

          const toRec = document.getElementById(getId(target))?.getBoundingClientRect()
          const fromEl = document.getElementById(getId(cause))
          const fromRec = fromEl?.getBoundingClientRect()

          if (!toRec || !fromRec) {
            return cause.cause?.cause && calc(target, cause.cause)
          }

          // @ts-expect-error
          if (fromEl?.computedStyleMap().get('display')?.value === 'none') {
            return cause.cause?.cause && calc(target, cause.cause)
          }

          const toX = 70 + toRec.x + -containerRec.x
          const toY = toRec.y + 27 - containerRec.y

          const fromX = 70 + fromRec.x + -containerRec.x
          const fromY = fromRec.y + 27 - containerRec.y

          const middleX = toX + (toY - fromY) / 6
          const middleY = fromY + (toY - fromY) / 2

          points += `${toX},${toY} ${middleX},${middleY} ${fromX},${fromY} `

          highlighted.add(target)

          return cause
        }

        let target: undefined | null | AtomCache = patch
        while (target && target.cause?.cause) {
          target = calc(target, target.cause)
        }

        return (
          <svg:polyline
            points={points}
            stroke={`hsla(${200 /* + 40 * ctx.get(highlightedTargets).length */}deg 20% 40%)`}
            fill="none"
            css={`
              stroke-width: 4;
              opacity: 0.7;
              &:hover {
                stroke-width: 8;
                opacity: 1;
              }
            `}
          />
        )
      },
    },
    name,
  )
  lines.clear.onCall((ctx) => {
    highlightedTargets(ctx, [])
    highlighted.clear()
  })

  const highlight = action((ctx, { svg, patch }: Params) => {
    let touched = new Set()
    const calcFollowing = (target: AtomCache) => {
      const followings = followingsMap.get(target)

      if (!touched.has(target) && followings?.length) {
        touched.add(target)
        for (const following of followings) {
          calcFollowing(following)
        }
      } else if (!highlighted.has(target)) {
        // TODO
        // let qqq = target
        // while (qqq && qqq.cause) {
        //   calcFollowing((qqq = qqq.cause))
        // }

        lines.create(ctx, { svg, patch: target })
      }
    }

    lines.batch(ctx, () => {
      calcFollowing(patch)
    })
    highlightedTargets(ctx, (state) => [...state, patch])
  })

  const redraw = action(async (ctx, svg: SVGElement) => {
    const targets = ctx.get(highlightedTargets)
    lines.clear(ctx)
    await ctx.schedule(() => sleep(0))
    batch(ctx, () => {
      for (const target of targets) {
        highlight(ctx, { svg, patch: target })
      }
    })
  }, `${name}:redraw`)

  return Object.assign(lines, { highlight, redraw })
}
