import { Atom, isAction, isAtom, type Rec } from '@reatom/core'
import { FC, h, mount, JSX } from '@reatom/jsx'
// @ts-expect-error TODO write types
import { Inspector } from '@observablehq/inspector'
// @ts-expect-error
import observablehqStyles from '../../../node_modules/@observablehq/inspector/dist/inspector.css'
import { noop, parseAtoms } from '@reatom/framework'

export const ObservableHQActionButton = (props: JSX.ButtonHTMLAttributes<HTMLElementTagNameMap['button']>) => {
  return (
    <button
      {...props}
      css={`
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
        ${props.css || ''}
      `}
    />
  )
}

export const ObservableHQ: FC<{ snapshot: any; actions?: Element }> = ({ snapshot, actions }) => {
  let update = noop

  return (
    <div
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
          right: 15px;
          display: flex;
          gap: 5px;
        `}
      >
        <ObservableHQActionButton
          title="Plain JSON"
          aria-label="Convert to plain JSON"
          on:click={(ctx) => {
            update((snapshot = parseAtoms(ctx, snapshot)))
          }}
        >
          {'{}'}
        </ObservableHQActionButton>
        <ObservableHQActionButton
          title="Log"
          aria-label="Log to the console"
          on:click={(ctx) => {
            console.log(isAtom(snapshot) ? ctx.get(snapshot) : snapshot)
          }}
        >
          📝
        </ObservableHQActionButton>
        <ObservableHQActionButton
          title="Copy"
          aria-label="Copy inspected value"
          on:click={(ctx) => {
            const text = JSON.stringify(parseAtoms(ctx, snapshot), null, 2)
            navigator.clipboard.writeText(text)
          }}
        >
          💾
        </ObservableHQActionButton>
        {actions}
      </div>
      <div
        ref={(ctx, observableContainer) => {
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
                update = (data) => inspector.fulfilled(data)

                if (isAtom(snapshot)) {
                  return ctx.subscribe(snapshot, update)
                } else {
                  update(snapshot)
                }
              }}
            />,
          )
        }}
      />
    </div>
  )
}
