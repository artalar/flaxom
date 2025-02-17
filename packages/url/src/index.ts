import { __count } from '@reatom/core'
import {
  Action,
  Atom,
  AtomMut,
  AtomState,
  Ctx,
  Fn,
  Rec,
  action,
  atom,
} from '@reatom/core'
import { abortCauseContext } from '@reatom/effects'
import { getRootCause, withInit } from '@reatom/hooks'
import { isShallowEqual, noop, toAbortError } from '@reatom/utils'

export interface AtomUrlSettings {
  init: (ctx: Ctx, options?: { signal?: AbortSignal }) => URL
  sync: (ctx: Ctx, url: URL, replace?: boolean) => void
}

export interface UrlAtom extends Atom<URL> {
  (ctx: Ctx, url: URL, replace?: boolean): URL
  (ctx: Ctx, update: (url: URL, ctx: Ctx) => URL, replace?: boolean): URL

  go: Action<[path: string, replace?: boolean], URL>
  // TODO not documented yet, need more symbol matches, like in nanostores/router
  match: (path: string) => Atom<boolean>
  settingsAtom: AtomMut<AtomUrlSettings>
}

export interface SearchParamsAtom extends Atom<Rec<string>> {
  set: Action<[key: string, value: string, replace?: boolean], void>
  del: Action<[key: string, replace?: boolean], void>
  /** create AtomMut which will synced with the specified query parameter */
  lens<T = string>(
    key: string,
    parse?: (value?: string) => T,
    serialize?: (value: T) => undefined | string,
  ): AtomMut<T>
  /** create AtomMut which will synced with the specified query parameter */
  lens<T = string>(
    key: string,
    options: {
      parse?: (value?: string) => T
      serialize?: (value: T) => undefined | string
      replace?: boolean
      path?: string
    },
  ): AtomMut<T>
}

/** This is technical API for integrations usage. The update from this action will not be synced back to the source */
export const updateFromSource = action(
  (ctx, url: URL, replace?: boolean) => urlAtom(ctx, url, replace),
  'urlAtom.updateFromSource',
)

const browserSync = (url: URL, replace?: boolean) => {
  if (replace) history.replaceState({}, '', url.href)
  else history.pushState({}, '', url.href)
}
/**Browser settings allow handling of the "popstate" event and a link click. */
const createBrowserUrlAtomSettings = (
  shouldCatchLinkClick = true,
): AtomUrlSettings => ({
  init: (ctx: Ctx, { signal } = {}) => {
    // do not store causes for IO events
    ctx = { ...ctx, cause: getRootCause(ctx.cause) }
    // copied from https://github.com/nanostores/router
    const click = (event: MouseEvent) =>
      ctx.get(() => {
        let link:
          | undefined
          | (HTMLLinkElement & {
              origin: string
              download: string
              hash: string
              pathname: string
              search: string
            }) =
          // @ts-expect-error DOM typing is hard
          event.target.closest('a')
        if (
          link &&
          event.button === 0 && // Left mouse button
          link.target !== '_blank' && // Not for new tab
          link.origin === location.origin && // Not external link
          link.rel !== 'external' && // Not external link
          link.target !== '_self' && // Now manually disabled
          !link.download && // Not download link
          !event.altKey && // Not download link by user
          !event.metaKey && // Not open in new tab by user
          !event.ctrlKey && // Not open in new tab by user
          !event.shiftKey // Not open in new window by user
        ) {
          event.preventDefault()

          const { hash, href } = updateFromSource(ctx, new URL(link.href))
          history.pushState({}, '', href)

          if (location.hash !== hash) {
            ctx.schedule(() => {
              location.hash = hash
              if (href === '' || href === '#') {
                window.dispatchEvent(new HashChangeEvent('hashchange'))
              }
            })
          }
        }
      })

    globalThis.addEventListener(
      'popstate',
      (event) => updateFromSource(ctx, new URL(location.href)),
      { signal },
    )
    if (shouldCatchLinkClick)
      document.body.addEventListener('click', click, { signal })

    return new URL(location.href)
  },
  sync: (ctx, url, replace) => {
    ctx.schedule(() => browserSync(url, replace))
  },
})

const settingsAtom = atom<AtomUrlSettings>(
  createBrowserUrlAtomSettings(),
  'urlAtom.settingAtom',
)

export const setupUrlAtomSettings = action(
  (
    ctx,
    init: (ctx: Ctx) => URL,
    sync: (ctx: Ctx, url: URL, replace?: boolean) => void = noop,
  ) => {
    settingsAtom(ctx, { init, sync })
  },
  'urlAtom.setupUrlAtomSettings',
)

export const setupUrlAtomBrowserSettings = action(
  (ctx, shouldCatchLinkClick: boolean) => {
    settingsAtom(ctx, createBrowserUrlAtomSettings(shouldCatchLinkClick))
  },
  'urlAtom.setupUrlAtomBrowserSettings',
)

const _urlAtom = atom(null as any as URL, 'urlAtom')
export const urlAtom: UrlAtom = Object.assign(
  (ctx: Ctx, update: URL | Fn<[URL, Ctx], URL>, replace = false) =>
    _urlAtom(ctx, (url, urlCtx) => {
      abortCauseContext.set(urlCtx.cause, new AbortController())
      const newUrl = typeof update === 'function' ? update(url, urlCtx) : update

      // TODO check `href`, instead of instance?
      if (url !== newUrl && ctx.cause.proto !== updateFromSource.__reatom) {
        urlCtx.get(settingsAtom).sync(urlCtx, newUrl, replace)
      }

      return newUrl
    }),
  _urlAtom,
  {
    settingsAtom,
    go: action(
      (ctx, path, replace?: boolean) =>
        urlAtom(ctx, (url) => new URL(path, url), replace),
      'urlAtom.go',
    ),
    match: (path: string) =>
      atom(
        (ctx) => ctx.spy(urlAtom).pathname.startsWith(path),
        `urlAtom.match#${path}`,
      ),
  },
).pipe(
  withInit((ctx) => {
    const controller = new AbortController()
    const url = ctx.get(settingsAtom).init(ctx, { signal: controller.signal })
    const un = settingsAtom.onChange(() => {
      un()
      controller.abort(toAbortError('urlAtom settings change'))
    })
    return url
  }),
)

export const searchParamsAtom: SearchParamsAtom = Object.assign(
  atom((ctx, state?: Rec<string>) => {
    const newState = Object.fromEntries(ctx.spy(urlAtom).searchParams)
    return isShallowEqual(state, newState) ? state! : newState
  }, 'searchParamsAtom'),
  {
    set: action((ctx, key, value, replace) => {
      const url = ctx.get(urlAtom)
      const newUrl = new URL(url)
      newUrl.searchParams.set(key, value)
      urlAtom(ctx, newUrl, replace)
    }, 'searchParamsAtom._set') satisfies SearchParamsAtom['set'],
    del: action((ctx, key, replace) => {
      const url = ctx.get(urlAtom)
      const newUrl = new URL(url.href)
      newUrl.searchParams.delete(key)
      urlAtom(ctx, newUrl, replace)
    }, 'searchParamsAtom._del') satisfies SearchParamsAtom['del'],
    lens: ((key, ...a: Parameters<typeof getSearchParamsOptions>) =>
      atom(
        getSearchParamsOptions(...a).parse(),
        __count('searchParamsAtom'),
      ).pipe(
        // TODO
        // @ts-expect-error
        withSearchParamsPersist(key, ...a),
      )) satisfies SearchParamsAtom['lens'],
  },
)

const getSearchParamsOptions = (
  ...a:
    | [
        parse?: (value?: string) => unknown,
        serialize?: (value: unknown) => undefined | string,
      ]
    | [
        options: {
          parse?: (value?: string) => unknown
          serialize?: (value: unknown) => undefined | string
          replace?: boolean
          path?: string
        },
      ]
) => {
  const {
    parse = (value = '') => String(value),
    serialize = (value: any) => (value === init ? undefined : String(value)),
    replace,
    path,
  } = typeof a[0] === 'object'
    ? a[0]
    : {
        parse: a[0],
        serialize: a[1],
        replace: undefined,
        path: undefined,
      }
  const init = parse()
  return {
    parse,
    serialize,
    replace,
    path,
  }
}

const isSubpath = (currentPath: string, targetPath: string) =>
  !targetPath || targetPath[targetPath.length - 1] === '*'
    ? `${currentPath}/`.startsWith(targetPath.slice(0, -1))
    : `${currentPath}/` === targetPath

export function withSearchParamsPersist<T = string>(
  key: string,
  parse?: (value?: string) => T,
  serialize?: (value: T) => undefined | string,
): <A extends Atom<T>>(theAtom: A) => A
export function withSearchParamsPersist<T = string>(
  key: string,
  options: {
    parse?: (value?: string) => T
    serialize?: (value: T) => undefined | string
    replace?: boolean
    path?: string
  },
): <A extends Atom<T>>(theAtom: A) => A
export function withSearchParamsPersist(
  key: string,
  ...a:
    | [
        parse?: (value?: string) => unknown,
        serialize?: (value: unknown) => undefined | string,
      ]
    | [
        options: {
          parse?: (value?: string) => unknown
          serialize?: (value?: unknown) => undefined | string
          replace?: boolean
          path?: string
        },
      ]
) {
  let { parse, serialize, replace, path = '' } = getSearchParamsOptions(...a)

  const pathEnd = path[path.length - 1]
  if (path && pathEnd !== '/' && pathEnd !== '*') {
    path += '/'
  }

  return (theAtom: Atom) => {
    const { computer, initState } = theAtom.__reatom

    theAtom.pipe(
      withInit((ctx, init) => {
        const sp = ctx.get(searchParamsAtom)
        const currentPath = ctx.get(urlAtom).pathname

        return key in sp && isSubpath(currentPath, path)
          ? parse(sp[key])
          : init(ctx)
      }),
    )

    theAtom.__reatom.computer = (ctx, state) => {
      const currentPath = ctx.get(urlAtom).pathname

      ctx.spy(searchParamsAtom, (next, prev) => {
        // init, already parsed in `withInit`
        if (!prev) return

        const prevUrl = ctx.cause.pubs[0]!.cause!.state as URL

        if (!isSubpath(currentPath, path)) {
          if (key in prev && isSubpath(prevUrl.pathname, path))
            state = initState(ctx)
          return
        }

        if (key in next) {
          if (next[key] !== prev[key]) state = parse(next[key])
        } else {
          if (path === '' && currentPath !== prevUrl.pathname) {
            state = initState(ctx)
            return
          }

          const prevState = serialize(state)
          if (prevState !== undefined) {
            ctx.schedule(() => {
              searchParamsAtom.set(ctx, key, prevState, true)
            }, 0)
          }
        }
      })

      if (computer) {
        const { pubs } = ctx.cause

        const isInit = pubs.length === 0
        const hasOtherDeps = pubs.length > 1

        if (
          isInit ||
          (hasOtherDeps &&
            pubs.some(
              (pub, i) =>
                i !== 0 &&
                !Object.is(
                  pub.state,
                  // @ts-expect-error
                  ctx.get({ __reatom: pub.proto }),
                ),
            ))
        ) {
          state = computer(ctx, state) as typeof state
        } else {
          for (let index = 1; index < pubs.length; index++) {
            // @ts-expect-error
            ctx.spy({ __reatom: pubs[index]!.proto })
          }
        }
      }

      return state
    }

    theAtom.onChange((ctx, state) => {
      if (
        // process only the last update
        ctx.cause === theAtom.__reatom.patch &&
        // process only mutation or computed update
        ctx.cause.cause?.proto !== searchParamsAtom.__reatom &&
        isSubpath(ctx.get(urlAtom).pathname, path)
      ) {
        const value = serialize(state)
        const sp = ctx.get(searchParamsAtom)
        if (value === undefined) {
          if (key in sp) searchParamsAtom.del(ctx, key, replace)
        } else if (sp[key] !== value) {
          searchParamsAtom.set(ctx, key, value, replace)
        }
      }
      ctx.get(theAtom)
    })

    return theAtom
  }
}
