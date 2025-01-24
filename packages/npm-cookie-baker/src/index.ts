import { action, atom } from '@reatom/core'
import { CookieController, CookieObjectModel, RealTimeCookie } from '@cookie-baker/core'
import { onConnect, withInit } from '@reatom/hooks'

export const reatomCookie = <T extends CookieObjectModel>(
  cookie: CookieController<T>,
  realTimeCookie: RealTimeCookie<T>,
) => {
  const cookieAtom = atom({} as ReturnType<typeof cookie.get>).pipe(withInit(() => cookie.get()))
  let updateCookie: Parameters<typeof realTimeCookie.addListener>[0]
  onConnect(cookieAtom, (ctx) => {
    updateCookie = (newCookie) => cookieAtom(ctx, newCookie)
    realTimeCookie.addListener(updateCookie)
    return () => {
      if (updateCookie) {
        realTimeCookie.removeListener(updateCookie)
      }
    }
  })

  const remove = action<Parameters<CookieController<T>['remove']>>((ctx, name) => {
    cookieAtom(ctx, (oldCookie) => {
      const newCookie = { ...oldCookie }
      delete newCookie[name]
      return newCookie
    })
    ctx.schedule(() => {
      cookie.remove(name)
    })
  })

  const set = action<Parameters<CookieController<T>['set']>>((ctx, name, value, options) => {
    cookieAtom(ctx, (oldCookie) => ({ ...oldCookie, [name]: value }))
    ctx.schedule(() => {
      cookie.set(name, value, options)
    })
  })

  return {
    cookieAtom,
    set,
    remove,
  }
}
