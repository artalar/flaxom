import { atom } from '@reatom/core'
import { createMemStorage, PersistRecord, reatomPersist } from '@reatom/persist'
import { WithPersistWebStorage } from './types'

interface CookieAttributes {
  maxAge?: number
  expires?: Date
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

const stringifyAttrs = (options: CookieAttributes): string => {
  let attrs = ''
  if (options.maxAge) attrs += `; max-age=${options.maxAge}`
  if (options.path) attrs += `; path=${options.path}`
  if (options.expires) attrs += `; expires=${options.expires.toUTCString()}`
  if (options.domain) attrs += `; domain=${options.domain}`
  if (options.sameSite) attrs += `; samesite=${options.sameSite}`
  if (options.secure) attrs += '; secure'
  return attrs
}

const converter = {
  read: (value: string): string =>
    value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent),
  write: (value: string): string =>
    encodeURIComponent(value).replace(
      /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
      decodeURIComponent,
    ),
}

export const reatomPersistCookie =
  (name: string, document: Document) =>
  (options: CookieAttributes = {}): WithPersistWebStorage => {
    const now = Date.now()
    const memCacheAtom = atom(
      (_ctx, state = new Map<string, PersistRecord>()) => state,
      `${name}._memCacheAtom`,
    )

    return reatomPersist({
      name,
      get(ctx, key) {
        try {
          const cookie = document.cookie

          if (cookie === '') return null

          const dataStr = cookie
            .split('; ')
            .find((row) => row.startsWith(`${key}=`))
            ?.split('=')[1]

          if (!dataStr) return null

          const rec: PersistRecord = JSON.parse(converter.read(dataStr))

          if (rec.to < Date.now()) {
            this.clear!(ctx, key)
            return null
          }

          const memCache = ctx.get(memCacheAtom)
          const cache = memCache.get(key)

          // @ts-expect-error falsy `>=` with undefined is expected
          if (cache?.id === rec.id || cache?.timestamp >= rec.timestamp) {
            return cache!
          }

          memCache.set(key, rec)
          return rec
        } catch (e) {
          return null
        }
      },
      set(ctx, key, rec) {
        if (options.maxAge === undefined) {
          if (options.expires === undefined) {
            options.maxAge = Math.floor((rec.to - now) / 1000)
          } else {
            rec.to = options.expires.getTime()
          }
        } else {
          rec.to = options.maxAge * 1000 + now
        }

        const memCache = ctx.get(memCacheAtom)
        memCache.set(key, rec)

        ctx.schedule(() => {
          const value = converter.write(JSON.stringify(rec))
          document.cookie = `${key}=${value}${stringifyAttrs(options)}`
        })
      },
      clear(ctx, key) {
        const memCache = ctx.get(memCacheAtom)
        memCache.delete(key)
        ctx.schedule(() => {
          document.cookie = `${key}=; max-age=-1`
        })
      },
    })
  }

try {
  var isCookieAvailable = 'cookie' in globalThis.document
} catch (error) {
  isCookieAvailable = false
}

export const withCookie: (options?: CookieAttributes) => WithPersistWebStorage =
  isCookieAvailable
    ? /*#__PURE__*/ reatomPersistCookie('withCookie', globalThis.document)
    : /*#__PURE__*/ () =>
        reatomPersist(createMemStorage({ name: 'withCookie' }))
