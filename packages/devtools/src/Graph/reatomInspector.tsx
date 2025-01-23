import { action, atom, AtomCache, AtomProto, Ctx, parseAtoms, withReset } from '@reatom/framework'
import { JSX } from '@reatom/jsx'
import { ObservableHQ, ObservableHQActionButton } from '../ObservableHQ'
import { reatomFilters } from './reatomFilters'
import { actionsStates, history } from './utils'
import { reatomBoolean, withComputed } from '@reatom/primitives'

type InspectorState =
  | { kind: 'hidden' }
  | { kind: 'open'; patch: AtomCache }
  | { kind: 'fixed'; patch: AtomCache; element: HTMLElement }

// separate action for naming purpose, CALL ONLY WITH `clientCtx`
export const update = action((ctx, proto: AtomProto, value: string) => {
  ctx.get((read, actualize) => {
    actualize!(ctx, proto, (patchCtx: Ctx, patch: AtomCache) => {
      patch.state = JSON.parse(value)
    })
  })
}, 'update')

export const reatomInspector = (
  { clientCtx, filters }: { clientCtx: Ctx; filters: ReturnType<typeof reatomFilters> },
  name: string,
) => {
  const state = atom<InspectorState>({ kind: 'hidden' }, `${name}.state`)

  const patch = atom((ctx) => {
    const s = ctx.spy(state)

    return s.kind === 'hidden' ? null : s.patch
  }, `${name}.patch`)

  const patchState = atom<any>(null, `${name}.patchState`).pipe(
    withComputed((ctx) => {
      const patchState = ctx.spy(patch)

      if (patchState?.proto.isAction) {
        const calls = actionsStates.get(patchState)
        return calls?.length === 1 ? calls[calls.length - 1] : calls
      }

      return patchState?.state
    }),
  )

  const edit = reatomBoolean(false, `${name}.edit`).pipe(
    withComputed((ctx) => {
      ctx.spy(patch)
      return false
    }),
  )

  const json = atom((ctx) => {
    try {
      return JSON.stringify(ctx.spy(patch)?.state, null, 2) ?? ''
    } catch (error) {
      return ''
    }
  }, `${name}.json`)

  const patchHistory = atom((ctx) => {
    const patchState = ctx.spy(patch)

    if (patchState?.proto.isAction) return [patchState]

    const patchHistory = patchState && history.get(patchState.proto)

    if (!patchHistory) return null

    const idx = patchHistory.indexOf(patchState)

    if (idx === -1) return [patch]

    return patchHistory.slice(idx)
  }, `${name}.patchHistory`).pipe(withReset())
  patchHistory.reset.onCall((ctx) => {
    const patchState = ctx.get(patch)

    if (patchState) history.delete(patchState.proto)
  })

  const open = action((ctx, patch: AtomCache) => {
    if (ctx.get(state).kind !== 'fixed') {
      state(ctx, { kind: 'open', patch })
    }
  }, `${name}.open`)

  const fix = action((ctx, patch: AtomCache, patchElement: HTMLElement) => {
    const s = ctx.get(state)

    const toFix = () => {
      state(ctx, { kind: 'fixed', patch, element: patchElement })
      patchElement.style.fontWeight = 'bold'
      element.focus()
    }

    if (s.kind === 'fixed') {
      s.element.style.fontWeight = 'normal'
      if (s.patch === patch) {
        state(ctx, { kind: 'hidden' })
      } else {
        toFix()
      }
    } else {
      toFix()
    }
  }, `${name}.fixed`)

  const hide = action((ctx, relatedElement: EventTarget | null) => {
    if (!(relatedElement instanceof Node && element.contains(relatedElement))) {
      if (ctx.get(state).kind !== 'fixed') {
        state(ctx, { kind: 'hidden' })
      }
    }
  }, `${name}.hide`)

  const close: JSX.EventHandler<HTMLButtonElement> = action((ctx) => {
    state(ctx, (s) => {
      if (s.kind === 'fixed') {
        s.element.style.fontWeight = 'normal'
      }
      return { kind: 'hidden' }
    })
  }, `${name}.close`)

  const OPACITY = {
    hidden: '0',
    open: '0.8',
    fixed: '1',
  }

  const filtersHeight = atom((ctx) => filters.element.clientHeight + 'px', `${name}.filtersHeight`).pipe(
    withComputed((ctx, s) => {
      ctx.spy(state)
      parseAtoms(ctx, filters)
      return s
    }),
  )

  const element = (
    <dialog
      open={atom((ctx) => ctx.spy(state).kind !== 'hidden')}
      css:filtersHeight={filtersHeight}
      css:opacity={atom((ctx) => OPACITY[ctx.spy(state).kind])}
      css={`
        position: absolute;
        left: 139px;
        top: calc(var(--filtersHeight) + 20px);
        width: calc(100% - 160px);
        height: calc(100% - var(--filtersHeight) - 40px);
        max-height: 100%;
        overflow: auto;
        background: var(--devtools-bg);
        padding: 0;
        margin: 0;
        border: none;
        border-radius: 2px;
        box-shadow:
          0 0 0 1px rgba(0, 0, 0, 0.1),
          0 4px 11px rgba(0, 0, 0, 0.1);
        z-index: 1;
        opacity: var(--opacity);
        transition: opacity 0.2s;
        &:hover {
          opacity: 1;
        }
      `}
    >
      <div
        css:observablehq-display={atom((ctx) => (ctx.spy(edit) ? 'none' : 'block'))}
        css:form-display={atom((ctx) => (ctx.spy(edit) ? 'block' : 'none'))}
        css={`
          min-height: 100px;

          & .observablehq-container {
            display: var(--observablehq-display);
          }
          & form {
            display: var(--form-display);
          }
        `}
      >
        <h4
          css={`
            margin: 10px 110px 0 15px;
            height: 20px;
            display: flex;
            align-items: center;
            overflow: hidden;
          `}
        >
          {atom((ctx) => ctx.spy(patch)?.proto.name)}
        </h4>
        <ObservableHQ
          snapshot={patchState}
          actions={
            <>
              <ObservableHQActionButton
                // @ts-ignore TODO
                css:display={atom((ctx) => (ctx.spy(patch)?.proto.isAction ? 'none' : ''))}
                on:click={edit.toggle}
                title="Edit"
                aria-label="Toggle editing"
                css={`
                  display: var(--display);
                `}
              >
                ✏️
              </ObservableHQActionButton>
              <ObservableHQActionButton on:click={close} title="Close" aria-label="Close this inspector">
                x
              </ObservableHQActionButton>
            </>
          }
        >
          <form
            on:submit={(ctx, e) => {
              e.preventDefault()
              const proto = ctx.get(patch)?.proto
              const textarea = e.currentTarget.firstChild
              if (proto && textarea instanceof HTMLTextAreaElement) {
                update(clientCtx, proto, textarea.value)
                textarea.value = ctx.get(json)
              }
            }}
            aria-label="Update state"
          >
            <textarea
              placeholder="JSON"
              css={`
                margin: 1rem;
                font-family: monospace;
                resizable: both;
                min-width: 50%;
                min-height: 5rem;
              `}
              prop:value={atom((ctx) => (ctx.spy(edit) ? ctx.spy(json) : ''))}
            />
            <div
              css={`
                margin: 0 1rem;
              `}
            >
              <button>Update</button>
              <button type="button" on:click={edit.setFalse}>
                Cancel
              </button>
            </div>
          </form>
        </ObservableHQ>
      </div>
      <div>
        <hr />
        <div
          css={`
            position: relative;
          `}
        >
          <h4
            css={`
              margin: 10px 0 0 15px;
            `}
          >
            history
          </h4>
        </div>
        <ObservableHQ
          snapshot={patchHistory}
          actions={
            <ObservableHQActionButton on:click={patchHistory.reset} title="Clear" aria-label="Clear history">
              🗑️
            </ObservableHQActionButton>
          }
        />
      </div>
    </dialog>
  )

  return Object.assign(state, { element, open, fix, hide })
}
