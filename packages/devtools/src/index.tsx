import {
  atom,
  type Ctx,
  type Rec,
  reatomBoolean,
  withAssign,
  action,
  createCtx,
  Atom,
  Action,
  AtomMut,
  bind,
  BooleanAtom,
} from '@reatom/framework'
import { mount, ctx } from '@reatom/jsx'
import { withLocalStorage } from '@reatom/persist-web-storage'
import { Graph, update } from './Graph'
import { getColor } from './utils'
import { States } from './States'

export { getColor }

// import('@reatom/framework').then(({ connectLogger }) => connectLogger(ctx, { skipUnnamed: false }))

export interface DevtoolsOptions {
  separator?: string | RegExp | ((name: string) => Array<string>)
  privatePrefix?: string
  getColor?: typeof getColor
  visible?: BooleanAtom
  initSize?: number
}

export interface DevtoolsState<T = any> {
  (newState: T): void
  subscribe(cb: (state: T) => void): () => void
}

export interface Devtools {
  log(name: string, payload?: any): void
  state<T>(name: string, initState: T): DevtoolsState<T>

  show(): void
  hide(): void
}

export const _connectDevtools = async (
  clientCtx: Ctx,
  {
    separator = /\.|#/,
    privatePrefix = '_',
    getColor: _getColor = getColor,
    visible = reatomBoolean(true, `_ReatomDevtools.visible`),
    initSize = 1000,
  }: DevtoolsOptions = {},
) => {
  const name = '_ReatomDevtools'

  const MAX_Z = Math.pow(2, 32) - 1

  const width = atom('0px', `${name}.width`)
  const height = atom('0px', `${name}.height`)
  let folded: null | { width: string; height: string } = null
  let moved = false

  const viewSwitch = reatomBoolean(true, `${name}.viewSwitch`).pipe(withLocalStorage(`${name}.viewSwitch`))

  const snapshot = atom<Rec>({}, `${name}.snapshot`).pipe(
    withAssign((target, name) => ({
      forceUpdate: action((ctx) => target(ctx, (state) => ({ ...state })), `${name}.forceUpdate`),
    })),
  )

  const logo = (
    <svg:svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      fill="#151134"
      stroke="#fff"
      stroke-width="15px"
      aria-label="Reatom devtools DnD handler"
      tabindex="0"
      css={`
        --size: 80px;
        position: absolute;
        width: var(--size);
        height: var(--size);
        top: calc(var(--size) * -0.6);
        left: calc(var(--size) * -0.6);
        outline: none;
        z-index: ${MAX_Z};
      `}
      on:pointerdown={(ctx, e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      on:pointermove={(ctx, e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          moved = true
          folded = null
          width(ctx, `${Math.min(window.innerWidth * 0.95, window.innerWidth - e.clientX)}px`)
          height(ctx, `${Math.min(window.innerHeight * 0.95, window.innerHeight - e.clientY)}px`)
        }
      }}
      on:lostpointercapture={() => {
        moved = false
      }}
      on:pointerup={(ctx, e) => {
        if (moved) return

        if (folded) {
          width(ctx, folded.width)
          height(ctx, folded.height)
          folded = null
        } else {
          const rect = containerEl.getBoundingClientRect()
          const { width: w, height: h } = rect
          if (w + h < 400) {
            width(ctx, `${window.innerWidth / 1.5}px`)
            height(ctx, `${window.innerHeight * 0.9}px`)
          } else {
            folded = { width: `${w}px`, height: `${h}px` }
            width(ctx, '0px')
            height(ctx, '0px')
          }
        }
      }}
    >
      <svg:circle cx="200" cy="200" r="200" fill="#fff" stroke-width="0" />
      <svg:circle cx="200" cy="200" r="175" stroke-width="0" />
      <svg:circle cx="180" cy="180" r="130" />
      <svg:circle cx="215" cy="180" r="70" />
      <svg:circle cx="150" cy="94" r="38" />
      <svg:circle cx="100" cy="195" r="40" />
      <svg:circle cx="165" cy="275" r="30" />
      <svg:circle cx="250" cy="265" r="20" />
      <svg:circle cx="57" cy="270" r="20" />
      <svg:circle cx="215" cy="345" r="36" />
      <svg:circle cx="310" cy="290" r="36" />
      <svg:circle cx="345" cy="195" r="30" />
      <svg:circle cx="321" cy="107" r="25" />
      <svg:circle cx="260" cy="50" r="20" />
      <svg:circle cx="120" cy="330" r="25" />
    </svg:svg>
  )

  const viewSwitchEl = (
    <button
      css={`
        position: absolute;
        top: 1px;
        left: 40px;
        width: 30px;
        height: 30px;
        border: none;
        border-radius: 0 0 6px 6px;
        font-size: 0.8em;
        z-index: 10;
        background: transparent;
        color: #7f7f7f;
        cursor: pointer;
        font-size: 1em;
      `}
      title="Switch view"
      aria-label="Switch view"
      on:click={viewSwitch.toggle}
    >
      {atom((ctx) => (ctx.spy(viewSwitch) ? '🗊' : '⛓'))}
    </button>
  )

  const containerEl = (
    <div
      id={name}
      css:devtools-bg="hsl(244deg 20% 90%)"
      css:width={width}
      css:height={height}
      css={`
        all: initial;
        position: fixed;
        bottom: calc(5rem / -2);
        right: 0;
        padding-top: 2em;
        width: var(--width);
        height: var(--height);
        z-index: ${MAX_Z};
        background: var(--devtools-bg);
        will-change: width, height;
        font-size: 14px;
        font-family: monospace;
        box-sizing: border-box;
      `}
    >
      {logo}
      {viewSwitchEl}
      <States
        clientCtx={clientCtx}
        viewSwitch={viewSwitch}
        separator={separator}
        snapshot={snapshot}
        privatePrefix={privatePrefix}
      />
      <div
        css={`
          display: var(--display);
          overflow: auto;
          height: calc(100% - 3rem);
        `}
        css:display={atom((ctx) => (ctx.spy(viewSwitch) ? 'block' : 'none'))}
      >
        <Graph clientCtx={clientCtx} getColor={_getColor} width={width} height={height} initSize={initSize} />
      </div>
    </div>
  )

  if (ctx.get(visible)) mount(document.body, containerEl)

  visible.onChange((ctx, state) => {
    if (state) {
      mount(document.body, containerEl)
    } else {
      containerEl.remove()
    }
  })
}

/** @deprecated use `createDevtools` instead */
export const connectDevtools = (...[ctx, options]: Parameters<typeof _connectDevtools>) => {
  _connectDevtools(ctx, options)

  return <T,>(name: string, payload: T): T => {
    const logAction = action((ctx, payload: T) => payload, name)
    return logAction(ctx, payload)
  }
}

export const createDevtools = ({
  ctx: clientCtx = createCtx(),
  initVisibility = true,
  ...options
}: Omit<DevtoolsOptions, 'visible'> & { ctx?: Ctx; initVisibility?: boolean } = {}): Devtools => {
  const visible = reatomBoolean(initVisibility, '_ReatomDevtools.visible')

  _connectDevtools(clientCtx, { ...options, visible })

  const cache = new Map<string, Atom>()

  const log: Devtools['log'] = (name: string, payload: any) => {
    let target = cache.get(name) as Action | undefined
    if (!target) {
      cache.set(name, (target = action(name)))
    }
    target(clientCtx, payload)
  }

  const state: Devtools['state'] = (name, initState) => {
    let target = cache.get(name) as AtomMut | undefined
    if (!target) {
      cache.set(name, (target = atom(123, name)))
      target(clientCtx, initState)
    } else if (ctx.get(target) !== initState) {
      target(clientCtx, initState)
    }

    // memoize the reference to the atom
    const result = bind(clientCtx, target) as DevtoolsState

    const subscribe: DevtoolsState['subscribe'] = (cb) =>
      target.onChange((ctx, state) => {
        if (ctx.cause.cause?.proto === update.__reatom) {
          cb(state)
        }
      })

    result.subscribe ??= subscribe

    return result
  }

  return {
    log,
    state,
    show: bind(ctx, visible.setTrue),
    hide: bind(ctx, visible.setFalse),
  }
}
