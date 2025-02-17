import { Ctx } from '@reatom/core'
import { AsyncAction } from '@reatom/async'
import { reatomAsync } from '@reatom/async'
import { throwReatomError } from '@reatom/core'

export type UrlSearchParamsInit = ConstructorParameters<typeof URLSearchParams>[0]

export type ReatomFetchConfig<Result> =
  | string
  | {
      url: string
      urlBase?: string
      params?: UrlSearchParamsInit
      transport?: (url: string, init: RequestInit) => Response | Promise<Response>
      headers?: HeadersInit
      headersBase?: HeadersInit
      method?: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'connect' | 'trace' | (string & {})
      body?: unknown
      init?: Omit<RequestInit, 'method' | 'body' | 'headers' | 'signal'>
      serializeBody?: (body: unknown) => BodyInit | Promise<BodyInit>
      parseResponse?: (response: Response) => Result | Promise<Result>
    }

export type ReatomFetchQuery = <Result, P1 = void, P2 = void, P3 = void>(
  config: ReatomFetchConfig<Result> | ((ctx: Ctx, p1: P1, p2: P2, p3: P3) => ReatomFetchConfig<Result>),
) => AsyncAction<[P1, P2, P3], Result>

export type ReatomFetch = ReatomFetchQuery & {
  get: ReatomFetchQuery
  post: ReatomFetchQuery
  put: ReatomFetchQuery
  delete: ReatomFetchQuery
  patch: ReatomFetchQuery
}

export const createReatomFetch = (clientConfig: Partial<Extract<ReatomFetchConfig<unknown>, object>>): ReatomFetch => {
  clientConfig = { ...createReatomFetch.defaults, ...clientConfig }
  const query = <Result, P1 = void, P2 = void, P3 = void>(
    config: ReatomFetchConfig<Result> | ((ctx: Ctx, p1: P1, p2: P2, p3: P3) => ReatomFetchConfig<Result>),
    methodForce?: string,
  ): AsyncAction<[P1, P2, P3], Result> =>
    reatomAsync(async (ctx, ...args: [P1, P2, P3]) => {
      if (typeof config === 'function') config = config(ctx, ...args)
      if (typeof config === 'string') config = { url: config }
      config = {
        ...(clientConfig as Extract<ReatomFetchConfig<Result>, object>),
        ...config,
      }

      const { urlBase } = config
      const url = new URL(urlBase ? urlBase.replace(/\/+$/, '') + '/' + config.url.replace(/^\/+/, '') : config.url)
      if (config.params) url.search = new URLSearchParams(config.params).toString()

      const headersBase = [...new Headers(config.headersBase)]
      const queryHeaders = new Headers(config.headers)
      const headers = new Headers([...new Headers(headersBase.filter((x) => !queryHeaders.has(x[0]))), ...queryHeaders])

      const response = await config.transport!(url.toString(), {
        ...(config.init ?? {}),
        signal: ctx.controller.signal,
        headers,
        method: methodForce ?? config.method,
        body: config.body === undefined ? undefined : await config.serializeBody!(config.body),
      })

      return await config.parseResponse!(response)
    }) as any

  return Object.assign(
    query,

    Object.fromEntries(
      ['get', 'post', 'put', 'delete', 'patch'].map((method) => [
        method,
        (config: ReatomFetchConfig<unknown>) => query(config, method),
      ]),
    ),
  ) as any
}

createReatomFetch.defaults = {
  transport: globalThis.fetch,
  urlBase: globalThis.location?.toString(),
  headersBase: { accept: 'application/json' },
  method: 'get',
  serializeBody: (body) =>
    body &&
    typeof body === 'object' &&
    Reflect.getPrototypeOf(body) &&
    !Array.isArray(body)
      ? (body as BodyInit)
      : JSON.stringify(body),
  parseResponse: (resp) => {
    throwReatomError(
      // throw if status code is not 2XX
      Math.floor(resp.status / 100) - 2,
      `HTTP Error: ${resp.statusText}`,
    )
    throwReatomError(
      resp.headers.get('content-type') !== 'application/json',
      `Invalid response content-type "${resp.headers.get('content-type')}"`,
    )
    return resp.json()
  },
} satisfies Partial<ReatomFetchConfig<unknown>>

export const reatomFetch = createReatomFetch({})
