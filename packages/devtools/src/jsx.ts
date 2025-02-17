import { createCtx } from '@reatom/framework'
import { reatomJsx } from '@reatom/jsx'

export type { JSX, FC } from '@reatom/jsx'
export { css, Bind } from '@reatom/jsx'

export const CONTAINER = globalThis.document?.createElement?.('div')
CONTAINER.id = '_ReatomDevtools'
export const ROOT = CONTAINER.attachShadow({ mode: 'open' })

export const ctx = createCtx()

export const { h, hf, mount } = reatomJsx(ctx, undefined, {
  stylesheetContainer: ROOT,
})
