import { atom } from '@reatom/core'
import { PersistRecord, createMemStorage, reatomPersist } from '@reatom/persist'
import { WithPersistWebStorage } from './types'

export const reatomPersistWebStorage = (name: string, storage: Storage): WithPersistWebStorage => {
  const memCacheAtom = atom((ctx, state = new Map<string, PersistRecord>()) => state, `${name}._memCacheAtom`)

  return reatomPersist({
    name,
    get(ctx, key) {
      try {
        const memCache = ctx.get(memCacheAtom)
        const dataStr = storage.getItem(key)

        if (dataStr) {
          const rec: PersistRecord = JSON.parse(dataStr)

          if (rec.to < Date.now()) {
            this.clear!(ctx, key)
            return null
          }

          const cache = memCache.get(key)
          // @ts-expect-error falsy `>=` with undefined is expected
          if (cache?.id === rec.id || cache?.timestamp >= rec.timestamp) {
            return cache!
          }

          memCache.set(key, rec)
          return rec
        }
      } catch (e) {
        return null
      }
      return null
    },
    set(ctx, key, rec) {
      const memCache = ctx.get(memCacheAtom)
      memCache.set(key, rec)
      ctx.schedule(() => storage.setItem(key, JSON.stringify(rec)))
    },
    clear(ctx, key) {
      const memCache = ctx.get(memCacheAtom)
      memCache.delete(key)
      ctx.schedule(() => storage.removeItem(key))
    },
    subscribe(ctx, key, cb) {
      const memCache = ctx.get(memCacheAtom)
      const handler = (event: StorageEvent) => {
        if (event.storageArea === storage && event.key === key) {
          if (event.newValue === null) {
            memCache.delete(key)
          } else {
            const rec: PersistRecord = JSON.parse(event.newValue)

            if (rec.id !== memCache.get(key)?.id) {
              memCache.set(key, rec)

              cb()
            }
          }
        }
      }
      globalThis.addEventListener?.('storage', handler, false)
      return () => globalThis.removeEventListener?.('storage', handler, false)
    },
  })
}

try {
  var isWebStorageAvailable = !!globalThis.localStorage
} catch (error) {
  isWebStorageAvailable = false
}

export const withLocalStorage: WithPersistWebStorage = isWebStorageAvailable
  ? /*#__PURE__*/ reatomPersistWebStorage('withLocalStorage', globalThis.localStorage)
  : /*#__PURE__*/ reatomPersist(createMemStorage({ name: 'withLocalStorage' }))

export const withSessionStorage: WithPersistWebStorage = isWebStorageAvailable
  ? /*#__PURE__*/ reatomPersistWebStorage('withSessionStorage', globalThis.sessionStorage)
  : /*#__PURE__*/ reatomPersist(createMemStorage({ name: 'withSessionStorage' }))
