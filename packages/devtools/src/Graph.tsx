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
  AtomProto,
  reatomBoolean,
  isShallowEqual,
  CtxSpy,
} from '@reatom/framework'
import { h, hf, ctx, Bind, ROOT } from './jsx'
import { actionsStates, followingsMap, getColor, getId, historyStates, idxMap } from './utils'
import { Filter, reatomFilters } from './Graph/reatomFilters'
import { reatomLines } from './Graph/reatomLines'
import { ObservableHQ } from './ObservableHQ'

const memo =
  <T,>(reducer: (ctx: CtxSpy) => T) =>
  (ctx: CtxSpy, state?: T): T => {
    const newState = reducer(ctx)
    return isShallowEqual(state, newState) ? (state as T) : newState
  }

type Props = {
  clientCtx: Ctx
  getColor: typeof getColor
  width: Atom<string>
  height: Atom<string>
  initSize: number
}

// separate action for naming purpose, CALL ONLY WITH `clientCtx`
export const update = action((ctx, proto: AtomProto, value: string) => {
  ctx.get((read, actualize) => {
    actualize!(ctx, proto, (patchCtx: Ctx, patch: AtomCache) => {
      patch.state = JSON.parse(value)
    })
  })
}, 'ReatomDevtools.update')

const Stack = ({ patch }: { patch: AtomCache }) => {
  const stackEl = (
    <span
      aria-details={`${patch.proto.name} stack trace`}
      css={`
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-left: 50px;
      `}
    />
  )

  let cause = patch.cause
  while (cause && cause.proto.name !== 'root') {
    const causeId = idxMap.get(cause)
    const causeEl = causeId && ROOT.getElementById(causeId)

    stackEl.append(
      <span>
        {' ^ '}
        {causeEl ? (
          <a
            href={`#${causeId}`}
            on:click={(ctx, e) => {
              e.preventDefault()
              e.stopPropagation()
              causeEl.scrollIntoView()
              causeEl.focus()
            }}
            // @ts-expect-error
            style:color={atom((ctx) => (ctx.spy(causeEl.styleAtom).display === 'none' ? 'black' : undefined))}
          >
            {cause.proto.name}
          </a>
        ) : (
          cause.proto.name!
        )}
      </span>,
    )

    cause = cause.cause
  }

  return stackEl
}

export const Graph = ({ clientCtx, getColor, width, height, initSize }: Props) => {
  const name = '_ReatomDevtools.Graph'

  const isBottom = reatomBoolean(false, `${name}.isBottom`)

  const list = reatomLinkedList(
    {
      key: 'id',
      create(ctx, patch: null | AtomCache) {
        if (!patch) {
          let ms: number | string = new Date().getMilliseconds()
          ms = ms.toString().padStart(3, '0')

          const nodesToWatch = atom(new Array<Atom>())
          const display = atom((ctx) =>
            ctx.spy(nodesToWatch).every((styleAtom) => ctx.spy(styleAtom).display === 'none') ? 'none' : 'flex',
          )

          return (
            <li
              ref={(ctx, el) => {
                nodesToWatch(ctx, (state) => {
                  state = []
                  let next = el.nextElementSibling
                  while (next?.id && 'styleAtom' in next) {
                    state.push(next.styleAtom as Atom)
                    next = next.nextElementSibling
                  }
                  return state
                })
              }}
              style:display={display}
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
        }
        const id = getId(patch)
        const color = getColor(patch)

        let stringState: string

        const style = atom(
          memo((ctx) => {
            const state = { display: 'flex', background: 'none' }

            const exclude = ctx.spy(filters.exclude)

            if (exclude && new RegExp(`.*${exclude}.*`, 'i').test(name!)) {
              state.display = 'none'
              return state
            }

            const applyFilter = ({ search, active, type, color }: Filter) => {
              if (!ctx.spy(active)) return

              const _type = ctx.spy(type)

              try {
                const searchValue = ctx.spy(search)
                const result = !searchValue || new RegExp(`.*${searchValue}.*`, 'i').test(name!)

                if (_type === 'filter' && !result) {
                  state.display = 'none'
                }
                if (_type === 'hide' && result) {
                  state.display = 'none'
                }

                if (_type === 'highlight' && result) {
                  state.background = `${ctx.spy(color)}a0`
                }
              } catch {}
            }

            applyFilter(filters.search)
            if (state.display === 'none') return state

            const filtersList = ctx.spy(filters.list.array)
            for (let i = 0; i < filtersList.length; i++) {
              applyFilter(filtersList[i]!)
              if (state.display === 'none') return state
            }

            const search = ctx.spy(valuesSearch)
            if (search) {
              stringState ??= toStringKey(patch.state)
                .replace(/\[reatom .*?\]/g, `\n`)
                .toLowerCase()

              if (!stringState.includes(search)) {
                state.display = 'none'
              }
            }

            return state
          }),
          `${name}._Log.style`,
        )

        const handleChain = (ctx: Ctx) => {
          lines.highlight(ctx, { svg, patch })
        }

        const preview = reatomBoolean(false, `${name}._Log.preview`)

        const showStack = reatomBoolean(false, `${name}._Log.showStack`)

        const element = (
          <li
            id={id}
            style={style}
            css={`
              flex-wrap: wrap;
              align-items: center;
              padding: 5px;
              font-size: 16px;
              &::marker {
                content: '';
              }
            `}
          >
            <button
              title="Toggle stack trace"
              aria-label="Toggle visibility of atom's stack trace"
              role="switch"
              aria-pressed={showStack}
              on:click={(ctx, e) => {
                e.currentTarget.innerText = showStack.toggle(ctx) ? 'X' : '?'
              }}
              css={`
                border: none;
                background: none;
                margin-left: 10px;
              `}
            >
              ?
            </button>
            <button
              title="Highlight cause lines"
              aria-label="Visualize causal relationships between atoms"
              on:click={handleChain}
              css={`
                border: none;
                background: none;
              `}
            >
              &
            </button>
            <label
              title="Toggle inspector"
              style:color={color}
              css={`
                cursor: pointer;
                margin-right: 10px;
              `}
            >
              <input
                type="checkbox"
                css={`
                  position: absolute;
                  opacity: 0;
                  cursor: pointer;
                  height: 0;
                  width: 0;
                `}
                model:checked={preview}
                aria-label={`Toggle inspector for ${name}`}
              />
              {name}
            </label>
            {atom((ctx) => (ctx.spy(showStack) ? <Stack patch={patch} /> : null))}
            {atom((ctx) =>
              ctx.spy(filters.preview) || ctx.spy(preview) ? (
                <ObservableHQ
                  snapshot={
                    // do not show extra info for "identity" actions
                    isAction && state.params.length === 1 && Object.is(state.params[0], state.payload)
                      ? state.payload
                      : state
                  }
                  update={isAction ? undefined : update.bind(null, clientCtx, patch.proto)}
                  patch={isAction ? undefined : patch}
                />
              ) : (
                <span />
              ),
            )}
          </li>
        )

        return Object.assign(element, { styleAtom: style })
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

  let lastTimestamp = 0

  const read = clientCtx.get((read) => read)
  clientCtx.subscribe(async (logs) => {
    // sort causes and insert only from this transaction
    const insertTargets = new Set<AtomCache>()
    const inits = new Map<AtomProto, AtomCache>()
    for (let i = 0; i < logs.length; i++) {
      const patch = logs[i]!

      insertTargets.add(patch)

      if (patch.proto.isAction) actionsStates.set(patch, patch.state.slice(0))
      else historyStates.add(patch)

      if (!read(patch.proto) && !inits.has(patch.proto)) {
        inits.set(patch.proto, patch)
      }
    }

    await null

    let isTimeStampWritten = !ctx.get(filters.time) || lastTimestamp === Date.now()

    const isPass = (patch: AtomCache): boolean => {
      if (inits.get(patch.proto) === patch || (patch.proto.isAction && !actionsStates.get(patch)?.length)) {
        return false
      }

      const historyState = historyStates.get(patch.proto) ?? []
      const prev = historyState[historyState.indexOf(patch) + 1]
      const exclude = ctx.get(filters.exclude)

      const result =
        prev !== patch &&
        (!prev || !Object.is(patch.state, prev.state)) &&
        (!exclude || !new RegExp(`.*${exclude}.*`, 'i').test(patch.proto.name!))

      if (result && !isTimeStampWritten) {
        lastTimestamp = Date.now()
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
        if (ctx.get(isBottom)) {
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
        left: 60px;
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

        /* & [data-stack] + [data-stack] {
          display: none;
        } */
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
      <div
        css={`
          overflow: auto;
          position: relative;
          margin-top: 2px;
        `}
        on:scroll={(ctx, e) => {
          const isBottomState =
            e.currentTarget.scrollHeight - e.currentTarget.scrollTop < e.currentTarget.clientHeight + 10
          if (ctx.get(isBottom) !== isBottomState) isBottom(ctx, isBottomState)
        }}
      >
        {svg}
        {listEl}
      </div>
    </section>
  )

  return container
}
