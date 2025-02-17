// THIS IS UNFINISHED PROTOTYPE, DO NOT TOUCH IT, DO NOT USE IT

// TODO https://github.com/unjs/ofetch

export type UrlSearchParamsInit = ConstructorParameters<
  typeof URLSearchParams
>[0]

export interface FetchRequestInit<
  Result = unknown,
  Params extends any[] = any[],
> extends RequestInit {
  url?: string | URL
  origin?: string
  transport?: typeof globalThis.fetch
  getInit?: (...params: Params) => {
    searchParams?: UrlSearchParamsInit
    body?: Record<string, any> | Array<any> | BodyInit
  }
  getResult?: (response: Response) => Result | Promise<Result>
}

export class FetchRequest<
  Result = unknown,
  Params extends any[] = any[],
> extends Request {
  static defaults = {
    origin: globalThis.location?.toString(),

    transport: globalThis.fetch,

    method: 'get',

    headers: { Accept: 'application/json' },

    getResult(response) {
      if (Math.floor(response.status / 100) - 2) {
        throw new Error(`HTTP Error: ${response.statusText ?? response.status}`)
      }

      const ct = response.headers.get('Content-Type')

      if (ct !== 'application/json') {
        throw new Error(
          `Expected Content-Type to be "application/json", got "${ct}"`,
        )
      }

      return response.json()
    },

    getInit: () => ({}),
  } satisfies FetchRequestInit

  init: Required<FetchRequestInit<Result, Params>>

  constructor(init: FetchRequestInit<Result, Params>) {
    init = Object.assign({}, FetchRequest.defaults, init, {
      url: new URL(init.url ?? init.origin!, init.origin),
    })

    // @ts-expect-error
    super(init.url, init)
    // @ts-expect-error
    this.init = init
  }

  clone(): this {
    // @ts-expect-error
    return new this.__proto__.constructor(this.init)
  }

  extends<Res = Result, P extends any[] = Params>(
    init: FetchRequestInit<Res, P>,
  ): FetchRequest<Res, P> {
    return new FetchRequest<Res, P>({
      ...this.init,
      ...init,
    } as FetchRequestInit<Res, P>)
  }

  fetch(...params: Params): Promise<Response> {
    const { transport, getInit, getResult, ...init } = this.init

    const url = new URL(init.url)

    const { searchParams, body } = getInit(...params)

    for (const [key, value] of new URLSearchParams(searchParams)) {
      url.searchParams.set(key, value)
    }

    init.body =
      body &&
      typeof body === 'object' &&
      Reflect.getPrototypeOf(body) &&
      !Array.isArray(body)
        ? (body as BodyInit)
        : JSON.stringify(body)

    return transport(url, init).then(getResult) as Promise<Response>
  }
}
