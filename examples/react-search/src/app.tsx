import { reatomComponent } from '@reatom/npm-react'
import { searchAtom, issuesResource, pageAtom } from './model'

export const App = reatomComponent(({ ctx }) => {
  const isLoading = Boolean(ctx.spy(issuesResource.pendingAtom) || ctx.spy(issuesResource.retriesAtom))
  const page = ctx.spy(pageAtom)

  return (
    <main>
      <input
        value={ctx.spy(searchAtom)}
        onChange={(e) => searchAtom(ctx, e.currentTarget.value)}
        placeholder="Search"
      />
      <button disabled={!page} onClick={() => pageAtom(ctx, (s) => s - 1)}>
        {'<'}
      </button>
      {page}
      <button onClick={() => pageAtom(ctx, (s) => s + 1)}>{'>'}</button>
      {isLoading && 'Loading...'}
      <ul>
        {ctx.spy(issuesResource.dataAtom).map(({ title }, i) => (
          <li key={i}>{title}</li>
        ))}

        {ctx.spy(issuesResource.dataAtom).length === 0 && <i>found nothing</i>}
      </ul>
    </main>
  )
})
