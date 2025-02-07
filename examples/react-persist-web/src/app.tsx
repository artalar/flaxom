import { atom } from '@reatom/framework'
import { withLocalStorage, withBroadcastChannel, withSessionStorage, withIndexedDb } from '@reatom/persist-web-storage'
import { useAtom } from '@reatom/npm-react'

const inputWithLocalStorageAtom = atom('', 'inputWithLocalStorageAtom').pipe(
  withLocalStorage('inputWithLocalStorageAtom'),
)

const inputWithSessionStorageAtom = atom('', 'inputWithSessionStorageAtom').pipe(
  withSessionStorage('inputWithSessionStorageAtom'),
)

const inputWithBroadcastChannelAtom = atom('', 'inputWithBroadcastChannelAtom').pipe(
  withBroadcastChannel('inputWithBroadcastChannelAtom'),
)

const inputIndexedDbAtom = atom('', 'inputIndexedDbAtom').pipe(withIndexedDb('inputIndexedDbAtom'))

export const App = () => {
  const [searchLS, setSearchLS] = useAtom(inputWithLocalStorageAtom)
  const [searchSS, setSearchSS] = useAtom(inputWithSessionStorageAtom)
  const [searchBC, setSearchBC] = useAtom(inputWithBroadcastChannelAtom)
  const [searchIDB, setSearchIDB] = useAtom(inputIndexedDbAtom)

  return (
    <main>
      <h1>Check 'Application' tab in DevTools and open multiple tabs</h1>
      <p>
        <label>
          I'm synced using localStorage
          <input value={searchLS} onChange={(e) => setSearchLS(e.currentTarget.value)} />
        </label>
      </p>
      <p>
        <label>
          I'm not synced because I use sessionStorage
          <input value={searchSS} onChange={(e) => setSearchSS(e.currentTarget.value)} />
        </label>
      </p>
      <p>
        <label>
          I'm synced using BroadcastChannel
          <input value={searchBC} onChange={(e) => setSearchBC(e.currentTarget.value)} />
        </label>
      </p>
      <p>
        <label>
          I'm synced using IndexedDB
          <input value={searchIDB} onChange={(e) => setSearchIDB(e.currentTarget.value)} />
        </label>
      </p>
    </main>
  )
}
