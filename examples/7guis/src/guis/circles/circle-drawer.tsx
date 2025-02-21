import React from 'react'
import { reatomComponent } from '@reatom/npm-react'
import { atom } from '@reatom/framework'
import { Box, BoxClickable, Button, Flex, VFlex } from '~/basic'
import { cx } from '~/utils'
import { CircleComp } from './circle-comp'
import {
  circlesAtom,
  getInitialDiameterAction,
  selectedAtom,
  mouseMoveAction,
  mouseLeaveAction,
  addCircleAction,
  contextMenuAction,
  stopChangeDiameterAction,
  getClosestAction,
  undoAtom,
} from './model'

const contextMenuVisibleAtom = atom(false, 'contextMenuVisibleAtom')
const contextMenuXAtom = atom(0, 'contextMenuXAtom')
const contextMenuYAtom = atom(0, 'contextMenuYAtom')

const diameterDialogVisibleAtom = atom(false, 'diameterDialogVisibleAtom')
const diameterDialogXAtom = atom(0, 'diameterDialogXAtom')
const diameterDialogYAtom = atom(0, 'diameterDialogYAtom')
const diameterAtom = atom(0, 'diameterAtom')

const inContextModeAtom = atom((ctx) => {
  return ctx.spy(contextMenuVisibleAtom) || ctx.spy(diameterDialogVisibleAtom)
}, 'inContextModeAtom')

inContextModeAtom.onChange((ctx, prev) => {
  if (!prev) selectedAtom(ctx, null)
})

export const CircleDrawer = reatomComponent(({ ctx }) => {
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const contextMenuRef = React.useRef<HTMLDivElement>(null)
  const diameterDialogRef = React.useRef<HTMLDivElement>(null)

  const contextMenuVisible = ctx.spy(contextMenuVisibleAtom)
  const contextMenuX = ctx.spy(contextMenuXAtom)
  const contextMenuY = ctx.spy(contextMenuYAtom)

  const diameterDialogVisible = ctx.spy(diameterDialogVisibleAtom)
  const diameterDialogX = ctx.spy(diameterDialogXAtom)
  const diameterDialogY = ctx.spy(diameterDialogYAtom)
  const diameter = ctx.spy(diameterAtom)

  React.useEffect(() => {
    document.addEventListener('click', handleDocumentContextMenuClick, {
      capture: true,
    })
    document.addEventListener('click', handleDocumentDialogClick, {
      capture: true,
    })

    return () => {
      document.removeEventListener('click', handleDocumentContextMenuClick, {
        capture: true,
      })
      document.removeEventListener('click', handleDocumentDialogClick, {
        capture: true,
      })
    }
  }, [])

  const handleDocumentContextMenuClick = (e: Event) => {
    if (!(e.target instanceof Node)) return
    if (!contextMenuRef.current) return

    if (
      !ctx.get(contextMenuVisibleAtom) ||
      contextMenuRef.current.contains(e.target)
    ) {
      return
    }
    e.stopPropagation()
    contextMenuVisibleAtom(ctx, false)
  }

  const handleDocumentDialogClick = (e: Event) => {
    if (!(e.target instanceof Node)) return
    if (!diameterDialogRef.current) return

    if (
      !ctx.get(diameterDialogVisibleAtom) ||
      diameterDialogRef.current.contains(e.target)
    ) {
      return
    }
    e.stopPropagation()
    diameterDialogVisibleAtom(ctx, false)
  }

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const x = e.pageX - canvas.offsetLeft
    const y = e.pageY - canvas.offsetTop
    const closest = getClosestAction(ctx, x, y)
    if (closest == null) {
      addCircleAction(ctx, x, y)
    } else {
      contextMenuAction(ctx)
      handleContextMenu(e)
    }
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    contextMenuVisibleAtom(ctx, true)
    contextMenuXAtom(ctx, e.pageX)
    contextMenuYAtom(ctx, e.pageY)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const canvas = canvasRef.current!
    const x = e.pageX - canvas.offsetLeft
    const y = e.pageY - canvas.offsetTop
    mouseMoveAction(ctx, x, y)
  }

  const handleMouseLeave = () => {
    mouseLeaveAction(ctx)
  }

  const handleContextMenuAdjust = () => {
    contextMenuVisibleAtom(ctx, false)
    diameterDialogVisibleAtom(ctx, true)
    diameterDialogXAtom(ctx, contextMenuX)
    diameterDialogYAtom(ctx, contextMenuY)
    const d = getInitialDiameterAction(ctx)
    diameterAtom(ctx, d)
  }

  const handleChangeDiameter = (e: React.FormEvent<HTMLInputElement>) => {
    const d = parseInt(e.currentTarget.value)
    diameterAtom(ctx, d)
  }

  const handleStopChangeDiameter = (e: React.FormEvent<HTMLInputElement>) => {
    stopChangeDiameterAction(ctx, parseInt(e.currentTarget.value))
  }

  return (
    <VFlex className={cx('min-w-[410px]', 'h-[250px]')} vspace="4px">
      <Flex hspace="4px" className={cx('self-center')}>
        <Button
          disabled={!ctx.spy(undoAtom.isUndoAtom)}
          onClick={ctx.bind(undoAtom.undo)}
        >
          Undo
        </Button>
        <Button
          disabled={!ctx.spy(undoAtom.isRedoAtom)}
          onClick={ctx.bind(undoAtom.redo)}
        >
          Redo
        </Button>
      </Flex>

      <div
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cx(
          'flex-1',
          'bg-white',
          'border-solid',
          'border-[1px]',
          'border-[#bbb]',
          'relative',
          'overflow-hidden',
        )}
      >
        {ctx.spy(circlesAtom).map((c) => {
          const isSelected = ctx.spy(c.selectedAtom) && diameterDialogVisible
          const d = isSelected ? diameterAtom : c.diameterAtom
          return (
            <CircleComp
              key={c.name}
              xAtom={c.xAtom}
              yAtom={c.yAtom}
              activeAtom={c.activeAtom}
              diameterAtom={d}
            />
          )
        })}
      </div>

      {contextMenuVisible && (
        <BoxClickable
          ref={contextMenuRef}
          style={{ left: contextMenuX, top: contextMenuY }}
          onClick={handleContextMenuAdjust}
          className={cx(
            'p-1',
            'absolute',
            'w-[120px]',
            'bg-[#eee]',
            'border-[1px]',
            'border-[#888]',
            'border-solid',
            'rounded-[4px]',
            'shadow-[0px_1px_5px_rgba(0,0,0,0.15)]',
          )}
        >
          Adjust Diameter
        </BoxClickable>
      )}

      {diameterDialogVisible && (
        <VFlex
          ref={diameterDialogRef}
          className={cx(
            'p-1',
            'items-center',
            'absolute',
            'w-[180px]',
            'bg-[#eee]',
            'border-[1px]',
            'border-[#888]',
            'border-solid',
            'rounded-[4px]',
            'shadow-[0px_1px_5px_rgba(0,0,0,0.15)]',
          )}
          vspace="4px"
          style={{
            left: diameterDialogX,
            top: diameterDialogY,
          }}
        >
          <Box className="flex-1">Adjust Diameter</Box>
          <input
            type="range"
            min={2}
            max={100}
            value={diameter}
            onChange={handleChangeDiameter}
            onMouseUp={handleStopChangeDiameter}
            className={cx('flex-1')}
          />
        </VFlex>
      )}
    </VFlex>
  )
}, 'CircleDrawer')
