import { atom } from '@reatom/core'
import { PersistRecord, reatomPersist } from '@reatom/persist'
import { get, set, del, createStore, UseStore } from 'idb-keyval'
import { BroadcastMessage, WithPersistWebStorage } from './types'

const idb = { get, set, del, createStore }

export const reatomPersistIndexedDb = (dbName: string, channel: BroadcastChannel): WithPersistWebStorage => {
  const postMessage = (msg: BroadcastMessage) => channel.postMessage(msg)

  const memCacheAtom = atom((ctx, state = new Map<string, PersistRecord>()) => state, `withIndexedDb._memCacheAtom`)

  let store: UseStore
  const getStore = () => (store ??= idb.createStore(dbName, 'atoms'))

  return reatomPersist({
    name: 'withIndexedDb',
    get(ctx, key) {
      return ctx.get(memCacheAtom).get(key) ?? null
    },
    set(ctx, key, rec) {
      const memCache = ctx.get(memCacheAtom)
      memCache.set(key, rec)
      ctx.schedule(async () => {
        await idb.set(key, rec, getStore())
        postMessage({
          key,
          rec,
          _type: 'push',
        })
      })
    },
    clear(ctx, key) {
      const memCache = ctx.get(memCacheAtom)
      memCache.delete(key)
      ctx.schedule(async () => {
        await idb.del(key, getStore())
        postMessage({
          key,
          rec: null,
          _type: 'push',
        })
      })
    },
    subscribe(ctx, key, cb) {
      const memCache = ctx.get(memCacheAtom)
      const handler = (event: MessageEvent<BroadcastMessage>) => {
        if (event.data.key !== key) return

        if (event.data._type === 'pull' && memCache.has(key)) {
          ctx.schedule(() =>
            postMessage({
              _type: 'push',
              key,
              rec: memCache.get(key)!,
            }),
          )
        } else if (event.data._type === 'push') {
          const { rec } = event.data
          if (rec === null) {
            memCache.delete(key)
          } else {
            if (rec.id !== memCache.get(key)?.id) {
              memCache.set(key, rec)
              cb()
            }
          }
        }
      }

      channel.addEventListener('message', handler)
      if (!memCache.has(key)) {
        ctx.schedule(async (ctx) => {
          const rec = await idb.get(key, getStore())
          const memCache = ctx.get(memCacheAtom)
          if (rec.id !== memCache.get(key)?.id) {
            memCache.set(key, rec)
            cb()
          }
        })
      }
      return () => channel.removeEventListener('message', handler)
    },
  })
}

export const withIndexedDb = /*#__PURE__*/ reatomPersistIndexedDb(
  'reatom_default',
  new BroadcastChannel('reatom_withIndexedDb_default'),
)
