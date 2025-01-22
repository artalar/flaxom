import React from 'react'
import './reset.css'
import { createRoot } from 'react-dom/client'
import { reatomContext } from '@reatom/npm-react'
import { createCtx } from '@reatom/framework'
import { App } from './app'
import './css.css'

const rootElement = document.getElementById('root')

if (!rootElement) throw new Error('No root element')

const root = createRoot(rootElement)
const ctx = createCtx()

root.render(
  <React.StrictMode>
    <reatomContext.Provider value={ctx}>
      <App />
    </reatomContext.Provider>
  </React.StrictMode>,
)
