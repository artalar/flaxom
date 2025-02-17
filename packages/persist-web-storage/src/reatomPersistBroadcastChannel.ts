import { atom } from '@reatom/core'
import { createMemStorage, PersistRecord, reatomPersist } from '@reatom/persist'
import { BroadcastMessage, WithPersistWebStorage } from './types'

export const reatomPersistBroadcastChannel = (
  channel: BroadcastChannel,
): WithPersistWebStorage => {
  const postMessage = (msg: BroadcastMessage) => channel.postMessage(msg)

  const memCacheAtom = atom(
    (ctx, state = new Map<string, PersistRecord>()) => state,
    `withBroadcastChannel._memCacheAtom`,
  )

  return reatomPersist({
    name: 'withBroadcastChannel',
    get(ctx, key) {
      return ctx.get(memCacheAtom).get(key) ?? null
    },
    set(ctx, key, rec) {
      const memCache = ctx.get(memCacheAtom)
      memCache.set(key, rec)
      ctx.schedule(() =>
        postMessage({
          key,
          rec,
          _type: 'push',
        }),
      )
    },
    clear(ctx, key) {
      const memCache = ctx.get(memCacheAtom)
      memCache.delete(key)
      ctx.schedule(() =>
        postMessage({
          key,
          rec: null,
          _type: 'push',
        }),
      )
    },
    subscribe(ctx, key, cb) {
      const memCache = ctx.get(memCacheAtom)
      const handler = (event: MessageEvent<BroadcastMessage>) => {
        if (event.data?.key !== key) return

        if (event.data._type === 'pull') {
          const rec = memCache.get(key)
          if (rec) {
            ctx.schedule(() => postMessage({ _type: 'push', key, rec }))
          }
        } else if (event.data._type === 'push') {
          const { rec } = event.data
          if (rec === null) {
            memCache.delete(key)
          } else if (rec.id !== memCache.get(key)?.id) {
            memCache.set(key, rec)
            cb()
          }
        }
      }
      channel.addEventListener('message', handler, false)
      if (!memCache.has(key)) {
        ctx.schedule(() => postMessage({ _type: 'pull', key }))
      }
      return () => channel.removeEventListener('message', handler, false)
    },
  })
}

try {
  var isBroadcastChannelAvailable = !!globalThis.BroadcastChannel
} catch (error) {
  isBroadcastChannelAvailable = false
}

export const withBroadcastChannel: WithPersistWebStorage =
  isBroadcastChannelAvailable
    ? /*#__PURE__*/ reatomPersistBroadcastChannel(
        new BroadcastChannel('reatom_withBroadcastChannel_default'),
      )
    : /*#__PURE__*/ reatomPersist(
        createMemStorage({ name: 'withBroadcastChannel' }),
      )
