import ReactDOM from 'react-dom/client'
import { createCtx, connectLogger } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-react'
import { withIndexedDb } from '../../../packages/persist-web-storage/src/reatomPersistIndexedDb'
import { App } from './app'

const ctx = createCtx()

connectLogger(ctx)

await withIndexedDb.init(ctx)

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <reatomContext.Provider value={ctx}>
    <App />
  </reatomContext.Provider>,
)
