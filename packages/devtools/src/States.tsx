import { atom, type AtomProto, type Ctx, type Rec, Atom, Action } from '@reatom/framework'
import { h, mount, ctx } from '@reatom/jsx'
import { ObservableHQ } from './ObservableHQ'
import { type DevtoolsOptions } from '.'

export const States = ({
  clientCtx,
  viewSwitch,
  separator,
  snapshot,
  privatePrefix,
}: {
  clientCtx: Ctx
  viewSwitch: Atom<boolean>
  separator: Exclude<DevtoolsOptions['separator'], undefined>
  snapshot: Atom<Rec> & {
    forceUpdate: Action
  }
  privatePrefix: Exclude<DevtoolsOptions['privatePrefix'], undefined>
}) => {
  const touched = new WeakSet<AtomProto>()
  const subscribe = () => {
    const clearId = setInterval(() => {
      if (Object.keys(ctx.get(snapshot)).length > 0) {
        snapshot.forceUpdate(ctx)
        clearTimeout(clearId)
      }
    }, 100)

    return clientCtx.subscribe(async (logs) => {
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
  }

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

  return (
    <div>
      {atom((ctx) =>
        ctx.spy(viewSwitch) ? (
          <div />
        ) : (
          <div ref={subscribe}>
            {reloadEl}
            {logEl}
            <ObservableHQ snapshot={snapshot} subscribe />
          </div>
        ),
      )}
    </div>
  )
}
