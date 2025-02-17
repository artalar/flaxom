import {
  Action,
  Atom,
  AtomCache,
  AtomProto,
  createCtx,
  Ctx,
  CtxOptions,
  Fn,
  isAtom,
  Rec,
  throwReatomError,
  Unsubscribe,
} from '@reatom/core'
import { createMemStorage } from '@reatom/persist'

export function mockFn<I extends any[], O>(
  fn: (...input: I) => O = (...i: any) => void 0 as any,
) {
  const _fn = Object.assign(
    function (...i: I) {
      try {
        // @ts-ignore
        var o = fn.apply(this, i)
      } catch (error) {
        // @ts-ignore
        _fn.calls.push({ i, o: error })

        throw error
      }

      _fn.calls.push({ i, o })

      return o
    },
    {
      calls: new Array<{ i: I; o: O }>(),
      inputs(): Array<I[number]> {
        return _fn.calls.map(({ i }) => i[0])
      },
      lastInput<Index extends Extract<keyof I, number> | null = null>(
        ...args: [index: Index] | []
      ): I[Index extends null ? 0 : Index] {
        const { length } = _fn.calls
        if (length === 0) throw new TypeError(`Array is empty`)
        return _fn.calls[length - 1]!.i[args[0] ?? 0]
      },
    },
  )

  return _fn
}

export const getDuration = async (cb: () => void) => {
  const start = Date.now()
  await cb()
  return Date.now() - start
}

export interface TestCtx extends Ctx {
  mock<T>(anAtom: Atom<T>, fallback: T): Unsubscribe

  mockAction<I extends any[], O>(
    anAction: Action<I, O>,
    cb: Fn<[Ctx, ...I], O>,
  ): Unsubscribe

  subscribeTrack<T, F extends Fn<[T]>>(
    anAtom: Atom<T>,
    cb?: F,
  ): F & {
    unsubscribe: Unsubscribe
    calls: ReturnType<typeof mockFn<[T], any>>['calls']
    inputs(): ReturnType<typeof mockFn<[T], any>>['inputs']
    lastInput: ReturnType<typeof mockFn<[T], any>>['lastInput']
  }
}

// override default `setTimeout(() => throw...)`
const callSafelySilent = (fn: Fn, ...a: any[]) => {
  try {
    return fn(...a)
  } catch (err: any) {
    console.log('Error in Reatom effects queue:')
    console.error(err)
    return err instanceof Error ? err : (err = new Error(err))
  }
}

export const createTestCtx = (options?: CtxOptions): TestCtx => {
  const ctx = createCtx({
    callLateEffect: callSafelySilent,
    callNearEffect: callSafelySilent,
    ...options,
  })
  const { get } = ctx
  const mocks = new Map<AtomProto, any>()
  const actionMocks = new Map<AtomProto, Fn<[Ctx, ...any[]]>>()

  return Object.assign(ctx, {
    get(value: Atom | Fn) {
      if (isAtom(value)) {
        // @ts-expect-error
        return get.call(ctx, value)
      }
      return get.call(ctx, (read, actualize) =>
        value(read, (ctx: Ctx, proto: AtomProto, mutator: Fn) => {
          if (mocks.has(proto)) {
            mutator = (patchCtx: Ctx, patch: AtomCache) => {
              const state = mocks.get(proto)
              patch.state = proto.isAction ? state.slice() : state
            }
          }
          if (!actionMocks.has(proto)) return actualize!(ctx, proto, mutator)

          // @ts-expect-error
          const fn: Fn = proto.unstable_fn
          try {
            // @ts-expect-error
            proto.unstable_fn = (...a: any[]) => actionMocks.get(proto)!(...a)
            return actualize!(ctx, proto, mutator)
          } finally {
            // @ts-expect-error
            proto.unstable_fn = fn
          }
        }),
      )
    },
    subscribeTrack(anAtom: Atom, cb: Fn = () => {}): any {
      const track = Object.assign(mockFn(cb), cb)
      const unsubscribe = ctx.subscribe(anAtom, track)

      return Object.assign(track, { unsubscribe })
    },
    mock<T>(anAtom: Atom<T>, fallback: T) {
      const proto = anAtom.__reatom
      const { computer } = proto
      proto.computer = null

      get((_read, actualize) => {
        actualize!(ctx, proto, (patchCtx: Ctx, patch: AtomCache) => {
          patch.state = fallback
        })
        mocks.set(proto, fallback)
      })

      return () => {
        proto.computer = computer
        mocks.delete(proto)
      }
    },
    mockAction<I extends any[], O>(
      anAction: Action<I, O>,
      cb: Fn<[Ctx, ...I], O>,
    ) {
      const proto = anAction.__reatom

      throwReatomError(!proto.isAction, 'action expected')

      actionMocks.set(proto, cb as Fn<[Ctx, ...any[]]>)

      return () => actionMocks.delete(proto)
    },
  })
}

/** @deprecated use `createMemStorage` fromm `@reatom/persist` instead */
export const createMockStorage = (snapshot?: Rec) =>
  createMemStorage({ name: 'test', snapshot })
