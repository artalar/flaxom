import { atom, type Ctx } from '@reatom/core'
import { type PersistRecord, reatomPersist } from '@reatom/persist'
import { get, set, del, createStore, keys, type UseStore } from 'idb-keyval'
import { type BroadcastMessage, type WithPersistWebStorage } from './types'

const idb = { get, set, del, createStore, keys }

export const reatomPersistIndexedDb = (
  dbName: string,
  channel: BroadcastChannel,
): WithPersistWebStorage & { init: (ctx: Ctx) => Promise<void> } => {
  const postMessage = (msg: BroadcastMessage) => channel.postMessage(msg)

  const memCacheAtom = atom((ctx, state = new Map<string, PersistRecord>()) => state, `withIndexedDb._memCacheAtom`)

  let store: UseStore
  const getStore = () => (store ??= idb.createStore(dbName, 'atoms'))

  async function init(ctx: Ctx) {
    const memCache = ctx.get(memCacheAtom)
    const now = Date.now()

    const allKeys = await idb.keys(getStore())

    const promises = allKeys.map(async (key) => {
      const rec: PersistRecord | undefined = await idb.get(key, getStore())
      if (!rec) return

      if (rec.to && rec.to < now) {
        memCache.delete(key.toString())
        ctx.schedule(async () => {
          await idb.del(key, getStore())
          postMessage({
            key: key.toString(),
            rec: null,
            _type: 'push',
          })
        })
      } else {
        memCache.set(key.toString(), rec)
        ctx.schedule(async () => {
          postMessage({
            key: key.toString(),
            rec,
            _type: 'push',
          })
        })
      }
    })

    await Promise.all(promises)
  }

  return Object.assign(
    reatomPersist({
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
              cb()
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
            const rec = await idb.get(key, store)
            const memCache = ctx.get(memCacheAtom)
            if (rec?.id !== memCache.get(key)?.id) {
              memCache.set(key, rec)
              cb()
            }
          })
        }
        return () => channel.removeEventListener('message', handler)
      },
    }),
    { init },
  )
}

export const withIndexedDb = /*#__PURE__*/ reatomPersistIndexedDb(
  'reatom_default',
  new BroadcastChannel('reatom_withIndexedDb_default'),
)
