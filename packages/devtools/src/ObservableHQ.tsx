import { Atom, AtomCache, AtomMut, Ctx, __count, atom, isAction, isAtom, type Rec } from '@reatom/core'
import { FC, h, mount, JSX, css } from '@reatom/jsx'
// @ts-expect-error TODO write types
import { Inspector } from '@observablehq/inspector'
// @ts-expect-error
import observablehqStyles from '../../../node_modules/@observablehq/inspector/dist/inspector.css'
import { BooleanAtom, noop, parseAtoms, reatomBoolean, withComputed, withInit } from '@reatom/framework'

import { buttonCss as editButtonCss, history } from './utils'

const buttonCss = css`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: gray;
  background: none;
  filter: grayscale(1);
  border: 1px solid gray;
`

const EditForm = ({
  json,
  isEditing,
  update,
}: {
  json: Atom<any>
  isEditing: BooleanAtom
  update: (value: string) => void
}) => {
  return (
    <form
      on:submit={(ctx, e) => {
        e.preventDefault()
        const textarea = e.currentTarget.firstChild
        if (textarea instanceof HTMLTextAreaElement) {
          update(textarea.value)
          isEditing.setFalse(ctx)
        }
      }}
      aria-label="Update state"
      css={`
        padding: 1rem;
      `}
    >
      <textarea
        placeholder="JSON"
        css={`
          font-family: monospace;
          resizable: both;
          min-width: 50%;
          min-height: 100px;
          background: transparent;
          border: 1px dashed #151134;
          width: 100%;
          box-sizing: border-box;
        `}
        prop:value={json}
      />
      <div
        css={`
          display: flex;
          gap: 1rem;
          justify-content: end;

          button {
            width: 100px;
          }
        `}
      >
        <button css={editButtonCss}>Update</button>
        <button css={editButtonCss} type="button" on:click={isEditing.setFalse}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export const ObservableHQ: FC<{
  snapshot: Atom | {}
  subscribe?: boolean
  update?: (newState: any) => any
  name?: string
  patch?: AtomCache
}> = ({
  snapshot,
  subscribe = false,
  update,
  patch,
  name = isAtom(snapshot) ? `${snapshot.__reatom.name}.ObservableHQ` : __count('ObservableHQ'),
}) => {
  const state = atom<any>(null, `${name}.state`)
  if (subscribe) state.pipe(withComputed((ctx) => ctx.spy(snapshot as Atom)))
  else state.pipe(withInit(() => snapshot))

  const json = atom((ctx) => {
    try {
      return JSON.stringify(parseAtoms(ctx, state), null, 2) ?? ''
    } catch (error) {
      console.error(error)
      return ''
    }
  }, `${name}.json`)

  const isEditing = reatomBoolean(false, `${name}.isEditing`)

  const showHistory = reatomBoolean(false, `${name}.history`)

  const getPatchHistory = () => {
    if (!patch) return []

    const patchHistory = history.get(patch.proto)

    // weird
    if (!patchHistory) return []

    const idx = patchHistory.indexOf(patch)

    if (idx === -1) return [patch]

    return patchHistory.slice(idx)
  }

  const setup = (target: Atom | {}) => (ctx: Ctx, observableContainer: HTMLDivElement) => {
    const shadowRoot = observableContainer.attachShadow({ mode: 'open' })
    shadowRoot.append(
      <style>
        {observablehqStyles.replaceAll(':root', '.observablehq')}
        {`
        .observablehq {
          margin: 1rem;
          margin-top: 0em;
        }

        .observablehq--inspect {
          padding: 0.5rem 0;
        }

        .observablehq svg {
          display: inline-block;
        }
      `}
      </style>,
      <div
        css={`
          width: 100%;
          height: 100%;
          overflow: auto;
          z-index: 1;
        `}
        ref={(ctx, inspectorEl) => {
          const inspector = new Inspector(inspectorEl) as { fulfilled(data: any): void }
          if (isAtom(target)) {
            return ctx.subscribe(target, (data) => inspector.fulfilled(data instanceof URL ? data.href : data))
          } else {
            inspector.fulfilled(target)
          }
        }}
      />,
    )
  }

  return (
    <div
      css:display={update ? atom((ctx) => (ctx.spy(isEditing) ? 'none' : 'flex')) : 'flex'}
      css={`
        width: 100%;
        overflow: auto;
        font-size: 16px;
        position: relative;
        padding-top: 10px;
      `}
    >
      <div
        css={`
          position: absolute;
          top: 0;
          right: 1rem;
          display: flex;
          gap: 5px;

          display: var(--display);
        `}
      >
        {update && (
          <button on:click={isEditing.toggle} title="Edit" aria-label="Toggle editing" css={buttonCss}>
            ✏️
          </button>
        )}
        {update && (
          <button on:click={showHistory.toggle} title="History" aria-label="Toggle history" css={buttonCss}>
            🕗
          </button>
        )}
        <button
          title="Log"
          aria-label="Log to the console"
          on:click={(ctx) => {
            console.log(ctx.get(state))
          }}
          css={buttonCss}
        >
          📝
        </button>
        <button
          title="Copy"
          aria-label="Copy inspected value"
          on:click={(ctx) => {
            navigator.clipboard.writeText(ctx.get(json))
          }}
          css={buttonCss}
        >
          💾
        </button>
        <button
          title="Plain JSON"
          aria-label="Convert to plain JSON"
          on:click={(ctx) => {
            state(ctx, parseAtoms(ctx, state))
          }}
          css={buttonCss}
        >
          {'{}'}
        </button>
      </div>
      <div
        class="observablehq-container"
        css={`
          display: var(--display);
        `}
        ref={setup(state)}
      />
      {patch &&
        atom((ctx) =>
          ctx.spy(showHistory) ? (
            <article>
              <h2
                css={`
                  font-size: 14px;
                  margin: 0 16px;
                `}
              >
                History
              </h2>
              <div
                class="observablehq-container"
                css={`
                  display: var(--display);
                `}
                ref={setup(getPatchHistory())}
              />
            </article>
          ) : (
            <div />
          ),
        )}
      {update &&
        atom((ctx) => (ctx.spy(isEditing) ? <EditForm json={json} isEditing={isEditing} update={update} /> : <div />))}
    </div>
  )
}
