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
import { isCausedBy } from '@reatom/effects'
import { getRootCause, withInit } from '@reatom/hooks'
import { noop } from '@reatom/utils'

export interface AtomUrlSettings {
  init: (ctx: Ctx) => URL
  sync: (ctx: Ctx, url: URL) => void
}

export interface UrlAtom extends AtomMut<URL> {
  go: Action<[path: `/${string}`], URL>
  // TODO not documented yet, need more symbol matches, like in nanostores/router
  match: (path: `/${string}`) => Atom<boolean>
  settingsAtom: AtomMut<AtomUrlSettings>
}

export interface SearchParamsAtom extends Atom<Rec<string>> {
  set: Action<[key: string, value: string], void>
  /** create AtomMut which will synced with the specified query parameter */
  lens: <T = string>(
    key: string,
    parse?: (value?: string) => T,
    serialize?: (value: T) => string,
  ) => AtomMut<T>
}

const sync = (url: URL) => {
  history.pushState(null, null as unknown as string, url.href)
}

const popstate = action((ctx, event: PopStateEvent) => {
  urlAtom(ctx, new URL(location.href))
}, 'urlAtom.popstate')
/**Browser settings allow handling of the "popstate" event and a link click. */
const createBrowserUrlAtomSettings = (
  shouldCatchLinkClick = true,
): AtomUrlSettings => ({
  init: (ctx: Ctx) => {
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
          !event.shiftKey && // Not open in new window by user
          !event.defaultPrevented // Click was not cancelled
        ) {
          event.preventDefault()

          const { hash, href } = urlAtom(ctx, new URL(link.href))

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

    globalThis.addEventListener('popstate', (event) => popstate(ctx, event))
    if (shouldCatchLinkClick) document.body.addEventListener('click', click)

    return new URL(location.href)
  },
  sync: (ctx, url) => {
    if (!isCausedBy(ctx.cause, popstate.__reatom)) {
      ctx.schedule(() => sync(url))
    }
  },
})

const settingsAtom = atom<AtomUrlSettings>(
  createBrowserUrlAtomSettings(),
  'urlAtom.settingAtom',
)

export const setupUrlAtomSettings = action(
  (ctx, init: (ctx: Ctx) => URL, sync: (ctx: Ctx, url: URL) => void = noop) => {
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

export const urlAtom: UrlAtom = Object.assign(
  atom(null as any as URL, 'urlAtom'),
  {
    settingsAtom,
    go: action(
      (ctx, path) => urlAtom(ctx, (url) => new URL(path, url)),
      'urlAtom.go',
    ),
    match: (path: `/${string}`) =>
      atom(
        (ctx) => ctx.get(urlAtom).pathname.startsWith(path),
        `urlAtom.match#${path}`,
      ),
  },
).pipe(withInit((ctx) => ctx.get(settingsAtom).init(ctx)))
urlAtom.onChange((ctx, url) => ctx.get(settingsAtom).sync(ctx, url))

export const searchParamsAtom: SearchParamsAtom = Object.assign(
  atom(
    (ctx) => Object.fromEntries(ctx.spy(urlAtom).searchParams),
    'searchParamsAtom',
  ),
  {
    set: action((ctx, key: string, value: string) => {
      const url = ctx.get(urlAtom)
      const newUrl = new URL(url.href)
      newUrl.searchParams.set(key, value)
      urlAtom(ctx, newUrl)
    }, 'searchParamsAtom._set'),
    lens: <T = string>(
      key: string,
      parse: (value?: string) => T = (value) => value as T,
      serialize: (value: T) => string = (value) => value as string,
    ) => {
      const theAtom = atom(
        (ctx) => parse(ctx.spy(searchParamsAtom)[key]),
        `searchParamsAtom#${key}`,
      )

      return Object.assign((ctx: Ctx, update: T | Fn<[T, Ctx], T>) => {
        searchParamsAtom.set(
          ctx,
          key,
          serialize(
            typeof update === 'function'
              ? (update as Fn<[T, Ctx], T>)(ctx.get(theAtom), ctx)
              : update,
          ),
        )
        return ctx.get(theAtom)
      }, theAtom) as AtomMut<T>
    },
  },
)

export const withSearchParamsPersist =
  <T = string>(
    key: string,
    parse: (value?: string) => T = (value) => value as T,
    serialize: (value: T) => string = (value) => value as string,
  ) =>
  <A extends Atom<T>>(theAtom: A): A => {
    const { computer } = theAtom.__reatom
    theAtom.pipe(
      withInit((ctx) => parse(ctx.get(searchParamsAtom)[key]) as AtomState<A>),
    )
    theAtom.__reatom.computer = (ctx, state) => {
      ctx.spy(searchParamsAtom, (next, prev) => {
        if (!prev || prev[key] !== next[key]) {
          state = parse(next[key])
        }
      })
      return computer ? computer(ctx, state) : state
    }
    theAtom.onChange((ctx, state) =>
      searchParamsAtom.set(ctx, key, serialize(state)),
    )

    return theAtom
  }
