import React from 'react'
import { reatomComponent } from '@reatom/npm-react'
import { Flex, TextInput } from '~/basic'
import { cx } from '~/utils'
import { type CellType } from './model'

interface CellProps {
  cell: CellType
}

export const Cell = reatomComponent<CellProps>(({ ctx, cell }) => {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.nativeEvent.stopImmediatePropagation()
    cell.initialContent = ctx.get(cell.contentAtom)
    cell.makeSelected(ctx)
  }

  const handleEnterKeyPress: React.KeyboardEventHandler<HTMLInputElement> = (
    e,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      try {
        cell.applyChange(ctx)
        cell.unselect(ctx)
      } catch (err) {
        if (err instanceof Error) {
          alert(err.message)
        } else {
          alert(err)
        }
      }
    }
  }

  const handleEscKeyUp: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      cell.abortEditing(ctx)
    }
  }

  const handeFocus = React.useCallback((ref: HTMLInputElement) => {
    if (ref) ref.focus()
  }, [])

  return (
    <Flex
      className={cx('px-0.5', 'min-h-8', 'items-center', 'contentAtom-center')}
      onClick={handleClick}
    >
      {ctx.spy(cell.editingAtom) ? (
        <TextInput
          ref={handeFocus}
          className={cx('w-full')}
          onKeyDown={handleEnterKeyPress}
          onKeyUp={handleEscKeyUp}
          value={ctx.spy(cell.contentAtom)}
          onChange={(event) => {
            cell.contentAtom(ctx, event.target.value)
          }}
        />
      ) : (
        ctx.spy(cell.displayValueAtom)
      )}
    </Flex>
  )
}, 'Cell')
