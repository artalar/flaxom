import {
  __root,
  atom,
  AtomCache,
  Ctx,
  toStringKey,
  LinkedListAtom,
  reatomLinkedList,
  reatomResource,
  withDataAtom,
  Atom,
  parseAtoms,
  action,
} from '@reatom/framework'
import { h, hf, ctx } from '@reatom/jsx'
import { actionsStates, followingsMap, getColor, getId, history } from './Graph/utils'
import { Filter, reatomFilters } from './Graph/reatomFilters'
import { reatomInspector } from './Graph/reatomInspector'
import { reatomLines } from './Graph/reatomLines'
import { ObservableHQ } from './ObservableHQ'

type Props = {
  clientCtx: Ctx
  getColor: typeof getColor
  width: Atom<string>
  height: Atom<string>
  initSize: number
}

export const Graph = ({ clientCtx, getColor, width, height, initSize }: Props) => {
  const name = '_ReatomDevtools.Graph'

  const list = reatomLinkedList(
    {
      key: 'id',
      create(ctx, patch: null | AtomCache) {
        if (!patch) {
          let ms: number | string = new Date().getMilliseconds()
          ms = ms.toString().padStart(3, '0')

          return (
            <li
              css={`
                display: flex;
                justify-content: center;
                align-items: center;
                &:before {
                  content: '';
                  flex-grow: 1;
                  height: 2px;
                  background: gray;
                }
                &:after {
                  content: '';
                  flex-grow: 1;
                  height: 2px;
                  background: gray;
                }
              `}
            >{`${new Date().toLocaleTimeString()} ${ms}ms`}</li>
          )
        }

        followingsMap.add(patch)
        const { isAction, name } = patch.proto
        let { state } = patch
        if (isAction) {
          state = actionsStates.get(patch)
          if (state.length === 1) state = state[0]
        } else {
          history.add(patch)
        }
        const id = getId(patch)
        const color = getColor(patch)

        let stringState: string

        const style = atom((ctx) => {
          let display = 'list-item'
          let background = 'none'

          const applyFilter = ({ search, type, color }: Filter) => {
            const _type = ctx.spy(type)

            if (_type === 'off') return

            try {
              const searchValue = ctx.spy(search)
              const result = !searchValue || new RegExp(`.*${searchValue}.*`, 'i').test(name!)

              if (_type === 'match' && !result) {
                display = 'none'
              }
              if ((_type === 'mismatch' || _type === 'exclude') && result) {
                display = 'none'
              }

              if (_type === 'highlight' && result) {
                background = `${ctx.spy(color)}a0`
              }
            } catch {}
          }

          applyFilter(filters.search)
          const filtersList = ctx.spy(filters.list.array)
          for (let i = 0; i < filtersList.length; i++) {
            applyFilter(filtersList[i]!)
          }

          const search = ctx.spy(valuesSearch)
          if (search) {
            stringState ??= toStringKey(patch.state)
              .replace(/\[reatom .*?\]/g, `\n`)
              .toLowerCase()

            if (!stringState.includes(search)) {
              display = 'none'
            }
          }

          return {
            display,
            background,
          }
        }, `${name}._style`)

        const handleClick = (ctx: Ctx) => {
          lines.highlight(ctx, { svg, patch })
        }

        return (
          <li
            id={id}
            data-name={name}
            on:mouseleave={(ctx, e) => {
              inspector.hide(ctx, e.relatedTarget)
            }}
            style={style}
            css={`
              padding: 5px;
              font-size: 16px;
              &::marker {
                content: '';
              }
            `}
          >
            <button
              title="Cause lines"
              aria-label="Draw a cause lines"
              on:click={handleClick}
              css:type={color}
              css={`
                border: none;
                background: none;
                font-size: 20px;
                padding: 5px;
                color: var(--type);
                margin-left: 10px;
              `}
            >
              ⛓
            </button>
            <button
              title="Inspector"
              aria-label="Open inspector"
              on:mouseenter={(ctx: Ctx) => {
                if (ctx.get(filters.hoverPreview)) {
                  inspector.open(ctx, patch)
                }
              }}
              on:click={(ctx, e) => {
                inspector.fix(ctx, patch, e.currentTarget)
              }}
              css:type={color}
              css={`
                border: none;
                background: none;
                font-size: 20px;
                padding: 5px;
                color: var(--type);

                &:after {
                  position: absolute;
                  left: 40px;
                  width: 100px;
                  height: 70px;
                  margin-top: -20px;
                  clip-path: polygon(0 30%, 100% 0, 100% 100%, 0 70%);
                }
                &:hover&:after {
                  content: '';
                }
              `}
            >
              🗐
            </button>
            {name}
            {atom((ctx) => (ctx.spy(filters.inlinePreview) ? <ObservableHQ snapshot={state} /> : <span />))}
          </li>
        )
      },
    },
    `${name}.list`,
  )

  const lines = reatomLines(`${name}.lines`)
  list.clear.onCall(() => {
    followingsMap.clear()
    lines.clear(ctx)
  })

  const redrawLines = action((ctx) => lines.redraw(ctx, svg), `${name}.redrawLines`)

  const filters = reatomFilters(
    { list: list as unknown as LinkedListAtom, lines, redrawLines, initSize },
    `${name}.filters`,
  )
  const valuesSearch = atom((ctx) => {
    const search = ctx.spy(filters.valuesSearch)

    return search.length < 2 ? '' : search.toLocaleLowerCase()
  })

  const inspector = reatomInspector({ clientCtx, filters }, `${name}.inspector`)

  const listHeight = reatomResource(async (ctx) => {
    ctx.spy(list)
    ctx.spy(width)
    ctx.spy(height)
    parseAtoms(ctx, filters)
    await ctx.schedule(() => new Promise((r) => requestAnimationFrame(r)))
    // TODO: the second one is required in Firefox
    await ctx.schedule(() => new Promise((r) => requestAnimationFrame(r)))
    return `${listEl.getBoundingClientRect().height}px`
  }, `${name}.listHeight`).pipe(withDataAtom('0px')).dataAtom

  // const subscribe = () =>
  clientCtx.subscribe(async (logs) => {
    // sort causes and insert only from this transaction
    const insertTargets = new Set<AtomCache>()
    for (let i = 0; i < logs.length; i++) {
      const patch = logs[i]!
      insertTargets.add(patch)
      if (patch.proto.isAction) actionsStates.set(patch, patch.state.slice(0))
    }

    await null

    let isTimeStampWritten = !ctx.get(filters.timestamps)

    const excludes = ctx
      .get(filters.list.array)
      .filter(({ type }) => ctx.get(type) === 'exclude')
      .map(({ search }) => ctx.get(search))
    const isPass = (patch: AtomCache) => {
      const historyState = history.get(patch.proto)
      const [prev] = historyState ?? []

      const isConnection =
        (patch.proto.isAction && patch.state.length === 0) || (!historyState && patch.cause!.proto.name === 'root')

      if (!historyState) history.set(patch.proto, [])

      const result =
        !isConnection &&
        prev !== patch &&
        (!prev || !Object.is(patch.state, prev.state)) &&
        excludes.every((search) => !new RegExp(`.*${search}.*`, 'i').test(patch.proto.name!))

      if (result && !isTimeStampWritten) {
        isTimeStampWritten = true
        list.create(ctx, null)
      }

      return result
    }

    // fix the case when "cause" appears in the logs after it patch
    const insert = (patch: AtomCache) => {
      const cause = patch.cause!
      if (insertTargets.has(cause)) {
        if (cause.cause) insert(cause.cause)
        if (isPass(cause)) list.create(ctx, cause)
        insertTargets.delete(cause)
      }
      if (insertTargets.has(patch)) {
        if (isPass(patch)) list.create(ctx, patch)
        insertTargets.delete(patch)
      }
    }
    list.batch(ctx, () => {
      for (const patch of logs) {
        insert(patch)
      }

      requestAnimationFrame(() => {
        const isBottom =
          listEl.parentElement!.scrollHeight - listEl.parentElement!.scrollTop < listEl.parentElement!.clientHeight + 10

        if (isBottom) {
          listEl.parentElement!.scrollTop = listEl.parentElement!.scrollHeight
        }
      })
    })
  })

  const svg = (
    <svg:svg
      css:height={listHeight}
      css:pe={atom((ctx) => (ctx.spy(lines).size ? 'auto' : 'none'))}
      css={`
        position: absolute;
        width: calc(100% - 70px);
        height: var(--height);
        top: 0;
        left: 68px;
        pointer-events: var(--pe);
        will-change: height;
      `}
    >
      {lines}
    </svg:svg>
  ) as SVGElement

  const listEl = (
    <ul
      // ref={subscribe}
      css={`
        padding: 0;
        content-visibility: auto;
      `}
    >
      {list}
    </ul>
  )

  const container = (
    <section
      css={`
        height: 100%;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        font-family: monospace;
        position: relative;
        padding-left: var(--lines);
      `}
    >
      {filters.element}
      {inspector.element}
      <div
        css={`
          overflow: auto;
          position: relative;
          margin-top: 2px;
        `}
      >
        {svg}
        {listEl}
      </div>
    </section>
  )

  return container
}
