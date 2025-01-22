import React from 'react'
import { Counter } from './guis/counter'
import { Flex } from './basic'
import { TempConvAuto, TempConvManual } from './guis/tempconv'
import { FlightBooker } from './guis/flight'
import { Timer } from './guis/timer'
import { Crud } from './guis/crud'
import { CircleDrawer } from './guis/circles/circle-drawer'
import { Cells } from './guis/cells/cells'
import { cx } from './utils'

function IconFileCode(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 384 512"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M384 121.941V128H256V0h6.059c6.365 0 12.47 2.529 16.971 7.029l97.941 97.941A24.005 24.005 0 0 1 384 121.941zM248 160c-13.2 0-24-10.8-24-24V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248zM123.206 400.505a5.4 5.4 0 0 1-7.633.246l-64.866-60.812a5.4 5.4 0 0 1 0-7.879l64.866-60.812a5.4 5.4 0 0 1 7.633.246l19.579 20.885a5.4 5.4 0 0 1-.372 7.747L101.65 336l40.763 35.874a5.4 5.4 0 0 1 .372 7.747l-19.579 20.884zm51.295 50.479l-27.453-7.97a5.402 5.402 0 0 1-3.681-6.692l61.44-211.626a5.402 5.402 0 0 1 6.692-3.681l27.452 7.97a5.4 5.4 0 0 1 3.68 6.692l-61.44 211.626a5.397 5.397 0 0 1-6.69 3.681zm160.792-111.045l-64.866 60.812a5.4 5.4 0 0 1-7.633-.246l-19.58-20.885a5.4 5.4 0 0 1 .372-7.747L284.35 336l-40.763-35.874a5.4 5.4 0 0 1-.372-7.747l19.58-20.885a5.4 5.4 0 0 1 7.633-.246l64.866 60.812a5.4 5.4 0 0 1-.001 7.879z"></path>
    </svg>
  )
}

const Gui = (props: {
  title: string
  filename: string
  comp: React.ReactNode
}) => {
  const { title, filename, comp } = props

  return (
    <div className="mb-8">
      <Flex className={cx('window', 'flex-col', 'inline-flex', 'text-[13px]')}>
        <Flex
          className={cx(
            'titlebar',
            'p-1',
            'text-center',
            'items-center',
            'relative',
            'select-none',
            'text-[13px]',
          )}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {title}
          </div>
          <div className="flex-auto" />
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://github.com/artalar/reatom/tree/v3/examples/7guis/src/guis/${filename}`}
          >
            <IconFileCode color="#999" className="icon-file-code" />
          </a>
        </Flex>
        <div className="p-2">{comp}</div>
      </Flex>
    </div>
  )
}

export const App = () => {
  return (
    <div
      className={cx(
        'max-w-[40rem]',
        'ml-auto',
        'mr-auto',
        'py-[1.5rem] px-[1.125rem]',
      )}
    >
      <h1>7GUIs in React/TypeScript/Reatom</h1>
      <div className="mb-8" />
      <div className="text-[16px]">
        This is a live version of an implementation (
        <a href="https://github.com/artalar/reatom/tree/v3/examples/7guis">
          source
        </a>
        ) of <a href="https://eugenkiss.github.io/7guis/">7GUIs</a> with{' '}
        <a href="https://react.dev">React</a>,{' '}
        <a href="https://www.typescriptlang.org">TypeScript</a> and{' '}
        <a href="https://www.reatom.dev">Reatom</a>.{' '}
      </div>
      <div className="mb-8" />
      <Gui title="Counter" filename="counter.tsx" comp={<Counter />} />
      <Gui
        title="TempConv Manual"
        filename="tempconv.tsx"
        comp={<TempConvManual />}
      />
      <Gui
        title="TempConv Auto"
        filename="tempconv.tsx"
        comp={<TempConvAuto />}
      />
      <Gui
        title="Flight Booker"
        filename="flight.tsx"
        comp={<FlightBooker />}
      />
      <Gui title="Timer" filename="timer.tsx" comp={<Timer />} />
      <Gui title="CRUD" filename="crud.tsx" comp={<Crud />} />
      <Gui
        title="Circle Drawer Traditional"
        filename="circles/drawer-traditional.tsx"
        comp={<CircleDrawer />}
      />
      <Gui title="Cells" filename="cells/cells.tsx" comp={<Cells />} />
    </div>
  )
}
