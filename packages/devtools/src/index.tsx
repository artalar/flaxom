import { atom, type AtomProto, type Ctx, type Rec, reatomBoolean, withAssign, action } from '@reatom/framework'
import { h, mount, ctx } from '@reatom/jsx'
import { withLocalStorage } from '@reatom/persist-web-storage'
import { ObservableHQ } from './ObservableHQ'
import { Graph } from './Graph'
import { getColor } from './Graph/utils'

export { getColor }

export const _connectDevtools = async (
  clientCtx: Ctx,
  {
    separator = /\.|#/,
    privatePrefix = '_',
    getColor: _getColor = getColor,
  }: {
    separator?: string | RegExp | ((name: string) => Array<string>)
    privatePrefix?: string
    getColor?: typeof getColor
  } = {},
) => {
  const name = '_ReatomDevtools'

  const MAX_Z = Math.pow(2, 32) - 1

  const width = atom('0px', `${name}.width`)
  const height = atom('0px', `${name}.height`)
  let folded: null | { width: string; height: string } = null
  let moved = false

  const viewSwitch = reatomBoolean(true, `${name}.viewSwitch`).pipe(withLocalStorage(`${name}.viewSwitch`))

  const snapshot = atom<Rec>({}, `${name}.snapshot`).pipe(
    withAssign((target) => ({
      forceUpdate: (ctx: Ctx) => target(ctx, (state) => ({ ...state })),
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
        --size: 5rem;
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
          width(ctx, `${Math.min(window.innerWidth * 0.9, window.innerWidth - e.clientX)}px`)
          height(ctx, `${Math.min(window.innerHeight * 0.9, window.innerHeight - e.clientY)}px`)
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
          const { width: w, height: h } = containerEl.getBoundingClientRect()
          if (w + h < 400) {
            width(ctx, `${window.innerWidth / 2}px`)
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

  const reloadEl = (
    <button
      css={`
        position: absolute;
        top: 1px;
        left: 70px;
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
      title="Reload"
      aria-label="Reload"
      on:click={async (ctx) => {
        snapshot.forceUpdate(ctx)
      }}
    >
      ↻
    </button>
  )

  const logEl = (
    <button
      css={`
        position: absolute;
        top: 1px;
        left: 100px;
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
      title="Log structured clone"
      aria-label="Log structured clone"
      on:click={() => {
        try {
          console.log(structuredClone(ctx.get(snapshot)))
        } catch {
          console.warn(
            "Reatom: can't make a structured clone to log a snapshot, log live state instead, the values could be changed during a time.",
          )
          console.log(ctx.get(snapshot))
        }
      }}
    >
      log
    </button>
  )

  const containerEl = (
    <div
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
      `}
      css:devtools-bg="hsl(244deg 20% 90%)"
      css:width={width}
      css:height={height}
    >
      {logo}
      {viewSwitchEl}
      <div
        css={`
          display: var(--display);
        `}
        css:display={atom((ctx) => (ctx.spy(viewSwitch) ? 'none' : 'block'))}
      >
        {reloadEl}
        {logEl}
        <ObservableHQ snapshot={snapshot} />
      </div>
      <div
        css={`
          display: var(--display);
          overflow: auto;
          height: calc(100% - 3rem);
        `}
        css:display={atom((ctx) => (ctx.spy(viewSwitch) ? 'block' : 'none'))}
      >
        <Graph clientCtx={clientCtx} getColor={_getColor} width={width} height={height} />
      </div>
    </div>
  )

  const touched = new WeakSet<AtomProto>()

  clientCtx.subscribe(async (logs) => {
    // await null // needed to prevent `Maximum call stack size exceeded` coz `parseAtoms`

    for (const { proto, state } of logs) {
      let name = proto.name!
      const path = typeof separator === 'function' ? separator(name) : name.split(separator)

      if (proto.isAction || touched.has(proto) || path.some((key) => key.startsWith(privatePrefix))) {
        continue
      }

      let thisLogObject = ctx.get(snapshot)

      path.forEach((key, i, { length }) => {
        if (i === length - 1) {
          name = key
        } else {
          thisLogObject = thisLogObject[`[${key}]`] ??= {}
        }
      })

      let update = (state: any) => {
        thisLogObject[name] = state // parseAtoms(ctx, state)
      }

      if (name === 'urlAtom') {
        update = (state) => {
          thisLogObject[name] = state.href
        }
      }

      update(state)
      ;(proto.updateHooks ??= new Set()).add((ctx, { state }) => {
        update(state)
      })

      touched.add(proto)
    }
  })

  const clearId = setInterval(() => {
    if (Object.keys(ctx.get(snapshot)).length > 0) {
      snapshot.forceUpdate(ctx)
      clearTimeout(clearId)
    }
  }, 100)

  mount(document.body, containerEl)
}

export const connectDevtools = (...[ctx, options]: Parameters<typeof _connectDevtools>) => {
  _connectDevtools(ctx, options)

  return <T,>(name: string, payload: T): T => {
    const logAction = action((ctx, payload: T) => payload, name)
    return logAction(ctx, payload)
  }
}
