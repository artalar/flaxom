import { atom } from '@reatom/framework'
import { reatomComponent } from '@reatom/npm-react'
import { Button, Flex, Label } from '~/basic'
import { cx } from '~/utils'

const countAtom = atom(0, 'countAtom')

export const Counter = reatomComponent(({ ctx }) => {
  return (
    <Flex data-testid="counter" className={cx('items-center', 'min-w-[200px]')}>
      <Label data-testid="count" className="flex-1">
        {ctx.spy(countAtom)}
      </Label>
      <Button
        data-testid="button"
        className="flex-1"
        onClick={() => countAtom(ctx, (count) => count + 1)}
      >
        Count
      </Button>
    </Flex>
  )
}, 'Counter')
