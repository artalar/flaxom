/* EXPERIMENTAL */

// TODO (agarkov): What is this? vitest fails trying to run this file

import { Atom, Action, atom, action, Rec } from '@reatom/core'
import { parsePath, Path } from 'history'
import { historyAtom } from '.'

export interface RouteAtom extends Atom<boolean>, Partial<Path> {
  go: Action<[], void>
}

interface RoutesScheme {
  [key: string]: RoutesScheme | string
}

type Routes<T extends RoutesScheme | string> = T extends ''
  ? RouteAtom
  : T extends `${string}/${string}`
  ? never
  : RouteAtom & {
      routes: {
        [K in keyof T as K extends `${infer K}/${string}` ? K : K]: K extends `${string}/:${infer Param}`
          ? // @ts-ignore
            Routes<Record<Param, T[K]>> & { param: Atom<string> }
          : // @ts-ignore
            Routes<T[K]>
      }
    }

export const unstable_reatomRoutes = <T extends RoutesScheme>(base: string, routes: T): Routes<T> => {
  const path = parsePath(base)
  const routeAtom = atom((ctx) =>
    // TODO tests
    ctx.spy(historyAtom.location).pathname.startsWith(path.pathname || ''),
  )

  const res = Object.assign(routeAtom, path, {
    go: action((ctx) => historyAtom.push(ctx, base)),
    routes: Object.keys(routes).reduce((acc, key) => {
      const nextIdx = key.indexOf('/')
      const subRoutes = (typeof routes[key] === 'object' ? routes[key] : {}) as Rec
      let isDynamic = false

      if ((isDynamic = key.startsWith(':'))) {
        key = key.slice(1)
      }

      if (nextIdx !== -1) {
        subRoutes[key.slice(nextIdx + 1)] = ''
        key = key.slice(0, nextIdx)
      }

      const routeAtom = (acc[key] = unstable_reatomRoutes(`${base === '/' ? '' : base}/${key}`, subRoutes))

      if (isDynamic) {
        console.log({ isDynamic, base })
        // @ts-expect-error
        routeAtom.param = atom((ctx) => {
          console.log('re', ctx.spy(routeAtom))
          if (!ctx.spy(routeAtom)) {
            return ''
          }

          const { pathname } = ctx.spy(historyAtom.location)

          const paramPath = pathname.slice(0, base.length)

          const nextIdx = paramPath.indexOf('/')

          console.log({ pathname, paramPath, nextIdx })

          return nextIdx === -1 ? paramPath : paramPath.slice(0, nextIdx)
        })
      }

      return acc
    }, {} as any),
  })

  return res as any
}
