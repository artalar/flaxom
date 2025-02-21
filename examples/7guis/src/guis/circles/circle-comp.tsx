import React from 'react'
import { reatomComponent } from '@reatom/npm-react'
import { Box } from '~/basic'
import { cx } from '~/utils'
import type { Atom } from '@reatom/framework'

interface CircleCompProps {
  xAtom: Atom<number>
  yAtom: Atom<number>
  diameterAtom: Atom<number>
  activeAtom: Atom<boolean>
}

export const CircleComp = React.memo<CircleCompProps>(
  reatomComponent(({ ctx, activeAtom, yAtom, xAtom, diameterAtom }) => {
    return (
      <Box
        className={cx(
          'absolute',
          'border-[1px]',
          'border-solid',
          'border-[#333]',
          'rounded-[100px]',
          '-translate-x-1/2',
          '-translate-y-1/2',
          ctx.spy(activeAtom) ? 'bg-[#eee]' : undefined,
        )}
        style={{
          top: ctx.spy(yAtom),
          left: ctx.spy(xAtom),
          width: ctx.spy(diameterAtom),
          height: ctx.spy(diameterAtom),
        }}
      />
    )
  }, 'CircleComp'),
)
