import React from 'react'
import { reatomComponent } from '@reatom/npm-react'
import { Box, Span, VFlex } from '~/basic'
import { cx } from '~/utils'
import { Cell } from './cell'
import { storeAbort, cellsAtom } from './model'

export const Cells = reatomComponent(({ ctx }) => {
  const cells = ctx.spy(cellsAtom)

  React.useEffect(() => {
    const handleClick = () => {
      storeAbort(ctx)
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [ctx])

  return (
    <VFlex className={cx('w-[500px]')} vspace="4px">
      <table
        className={cx(
          'table-fixed',
          'w-full',
          'border-collapse',
          'bg-white',
          'border-[1px]',
          'border-solid',
          'border-[#bbb]',
        )}
      >
        <tbody>
          <tr className={cx('bg-[#f6f6f6]', 'select-none')}>
            {(() => {
              const result = [
                <th key={-1} style={{ width: 30 }}>
                  {' '}
                </th>,
              ]
              const start = 'A'.charCodeAt(0)
              for (let i = start; i < start + cells[0].length; i++) {
                result.push(
                  <th
                    key={i}
                    className="border-solid border-[1px] border-[#bbb]"
                  >
                    <Box className="p-1">{String.fromCharCode(i)}</Box>
                  </th>,
                )
              }
              return result
            })()}
          </tr>
          {cells.map((row, i) => (
            <tr key={i}>
              <td
                style={{
                  background: '#f6f6f6',
                  border: '1px solid #bbb',
                  userSelect: 'none',
                  textAlign: 'center',
                }}
              >
                <b>{i}</b>
              </td>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cx(
                    'border-solid',
                    'border-[1px]',
                    'border-[#bbb]',
                  )}
                >
                  <Cell cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Span>
        Click inside a cell to edit its content. Hit enter to apply. Click
        outside the cell or hit escape to abort. Here are some example contents:
        &apos;5.5&apos;, &apos;Some text&apos;, &apos;=A1&apos;,
        &apos;=sum(B2:C4)&apos;, &apos;=div(C1, 5)&apos;.
      </Span>
    </VFlex>
  )
}, 'Cells')
