import { PersistRecord, reatomPersist } from '@reatom/persist'

const reatomPersistWebStorage = (name: string, storage: Storage) => {
  const memCache = new Map<string, PersistRecord>()

  return reatomPersist({
    name,
    get(ctx, key) {
      try {
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
      if (memCache.has(key)) {
        const prev = memCache.get(key)
        ctx.schedule(() => memCache.set(key, prev!), -1)
      }
      memCache.set(key, rec)
      ctx.schedule(() =>
        storage.setItem(key, JSON.stringify({ ...rec, fromState: false })),
      )
    },
    clear(ctx, key) {
      if (memCache.has(key)) {
        const prev = memCache.get(key)
        ctx.schedule(() => memCache.set(key, prev!), -1)
      }
      memCache.delete(key)
      ctx.schedule(() => storage.removeItem(key))
    },
    subscribe(ctx, key, cb) {
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

export const withLocalStorage = reatomPersistWebStorage(
  'withLocalStorage',
  globalThis.localStorage,
)
export const withSessionStorage = reatomPersistWebStorage(
  'withSessionStorage',
  globalThis.sessionStorage,
)
