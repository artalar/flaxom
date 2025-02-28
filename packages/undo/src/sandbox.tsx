import React from 'react'
import { createCtx, connectLogger, atom, action } from '@reatom/framework'
import { reatomContext, useAction, useAtom } from '@reatom/npm-react'
import * as ReactDOMClient from 'react-dom/client'
import { unstable_batchedUpdates } from 'react-dom'
import { setupBatch } from '@reatom/npm-react'

setupBatch(unstable_batchedUpdates)

const inputAtom = atom('', 'inputAtom')
const greetingAtom = atom((ctx) => {
  const input = ctx.spy(inputAtom)
  return input ? `Hello, ${input}!` : ''
}, 'greetingAtom')
const onInput = action(
  (ctx, event: React.ChangeEvent<HTMLInputElement>) =>
    inputAtom(ctx, event.currentTarget.value),
  'onInput',
)

function App() {
  const [input] = useAtom(inputAtom)
  const [greeting] = useAtom(greetingAtom)
  const handleInput = useAction(onInput)

  return (
    <main>
      <h1>Reatom</h1>
      <p>
        <input value={input} onChange={handleInput} placeholder="Your name" />
      </p>
      <p>{greeting}</p>
    </main>
  )
}

const ctx = createCtx()
connectLogger(ctx)

const rootElement = document.getElementById('root')!
const root = ReactDOMClient.createRoot(rootElement)

root.render(
  <reatomContext.Provider value={ctx}>
    <App />
    <style>{`
        .form {
          width: 5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }  
      `}</style>
  </reatomContext.Provider>,
)
