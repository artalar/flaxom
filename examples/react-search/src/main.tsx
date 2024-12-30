import ReactDOM from 'react-dom/client'
import { createCtx } from '@reatom/framework'
import { type Devtools } from '@reatom/devtools'
import { reatomContext } from '@reatom/npm-react'
import { App } from './app'

const ctx = createCtx()

declare global {
  var DEVTOOLS: undefined | Devtools
}
if (import.meta.env.DEV) {
  const { createDevtools } = await import('@reatom/devtools')
  globalThis.DEVTOOLS = createDevtools({ ctx, initVisibility: true })
} else {
  globalThis.DEVTOOLS = undefined
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <reatomContext.Provider value={ctx}>
    <App />
  </reatomContext.Provider>,
)
