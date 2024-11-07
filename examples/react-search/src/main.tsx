import ReactDOM from 'react-dom/client'
import { createCtx, connectLogger } from '@reatom/framework'
import { connectDevtools } from '@reatom/devtools'
import { reatomContext } from '@reatom/npm-react'
import { App } from './app'

const ctx = createCtx()

connectLogger(ctx)
connectDevtools(ctx)

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <reatomContext.Provider value={ctx}>
    <App />
  </reatomContext.Provider>,
)
