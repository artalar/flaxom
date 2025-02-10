import { it, expect, vi } from 'vitest'
import { mockFn } from '@reatom/testing'

import { action, Atom, atom, AtomProto, AtomMut, createCtx as _createCtx, Ctx, CtxSpy, Fn, AtomCache } from './atom'

const callSafelySilent = (fn: Fn, ...a: any[]) => {
  try {
    return fn(...a)
  } catch {}
}

const createCtx: typeof _createCtx = (opts) =>
  _createCtx({
    callLateEffect: callSafelySilent,
    callNearEffect: callSafelySilent,
    ...opts,
  })

// FIXME: get it from @reatom/utils
// (right now there is cyclic dependency, we should move tests to separate package probably)
{
  var onDisconnect = (atom: Atom, cb: Fn<[Ctx]>) => {
    const hooks = (atom.__reatom.disconnectHooks ??= new Set())
    hooks.add(cb)
    return () => hooks.delete(cb)
  }
  var onConnect = (atom: Atom, cb: Fn<[Ctx]>) => {
    const hooks = (atom.__reatom.connectHooks ??= new Set())
    hooks.add(cb)
    return () => hooks.delete(cb)
  }
}

const isConnected = (ctx: Ctx, { __reatom: proto }: Atom) => {
  const cache = proto.patch ?? ctx.get((read) => read(proto))

  if (!cache) return false

  return cache.subs.size + cache.listeners.size > 0
}

export const getCache = <T>(ctx: Ctx, anAtom: Atom<T>): AtomCache<T> =>
  ctx.get((read) => (ctx.get(anAtom), read(anAtom.__reatom)!))

it(`action`, () => {
  const act1 = action()
  const act2 = action()
  const fn = mockFn()
  const a1 = atom(0)
  const a2 = atom((ctx) => {
    ctx.spy(a1)
    ctx.spy(act1).forEach(() => fn(1))
    ctx.spy(act2).forEach(() => fn(2))
  })
  const ctx = createCtx()

  ctx.subscribe(a2, () => {})
  expect(fn.calls.length).toBe(0)

  act1(ctx)
  expect(fn.calls.length).toBe(1)

  act1(ctx)
  expect(fn.calls.length).toBe(2)

  act2(ctx)
  expect(fn.calls.length).toBe(3)
  expect(fn.calls.map(({ i }) => i[0])).toEqual([1, 1, 2])

  a1(ctx, (s) => s + 1)
  expect(fn.calls.length).toBe(3)
})

it(`linking`, () => {
  const a1 = atom(0, `a1`)
  const a2 = atom((ctx) => ctx.spy(a1), `a2`)
  const ctx = createCtx()
  const fn = mockFn()

  ctx.subscribe((logs) => {
    logs.forEach((patch) => {
      expect(patch.cause).not.toBe(null)
      if (patch.cause === null) throw new Error(`"${patch.proto.name}" cause is null`)
    })
  })

  const un = ctx.subscribe(a2, fn)
  var a1Cache = ctx.get((read) => read(a1.__reatom))!
  var a2Cache = ctx.get((read) => read(a2.__reatom))!

  expect(fn.calls.length).toBe(1)
  expect(fn.lastInput()).toBe(0)
  expect(a2Cache.pubs[0]).toBe(a1Cache)
  expect(a1Cache.subs).toEqual(new Set([a2.__reatom]))

  un()

  expect(a1Cache).toBe(ctx.get((read) => read(a1.__reatom))!)
  expect(a2Cache).toBe(ctx.get((read) => read(a2.__reatom))!)

  expect(ctx.get((read) => read(a1.__reatom))!.subs.size).toBe(0)
})

it(`nested deps`, () => {
  const a1 = atom(0, `a1`)
  const a2 = atom((ctx) => ctx.spy(a1) + ctx.spy(a1) - ctx.spy(a1), `a2`)
  const a3 = atom((ctx) => ctx.spy(a1), `a3`)
  const a4 = atom((ctx) => ctx.spy(a2) + ctx.spy(a3), `a4`)
  const a5 = atom((ctx) => ctx.spy(a2) + ctx.spy(a3), `a5`)
  const a6 = atom((ctx) => ctx.spy(a4) + ctx.spy(a5), `a6`)
  const ctx = createCtx()
  const fn = mockFn()
  const touchedAtoms: Array<AtomProto> = []

  ctx.subscribe((logs) => {
    logs.forEach((patch) => {
      expect(patch.cause).not.toBe(null)
      if (patch.cause === null) throw new Error(`"${patch.proto.name}" cause is null`)
    })
  })

  const un = ctx.subscribe(a6, fn)
  for (const a of [a1, a2, a3, a4, a5, a6]) {
    expect(isConnected(ctx, a)).toBe(true)
    if (!isConnected(ctx, a)) throw new Error(`"${a.__reatom.name}" should not be stale`)
  }

  expect(fn.calls.length).toBe(1)
  expect(ctx.get((read) => read(a1.__reatom))!.subs).toEqual(new Set([a2.__reatom, a3.__reatom]))
  expect(ctx.get((read) => read(a2.__reatom))!.subs).toEqual(new Set([a4.__reatom, a5.__reatom]))
  expect(ctx.get((read) => read(a3.__reatom))!.subs).toEqual(new Set([a4.__reatom, a5.__reatom]))

  ctx.subscribe((logs) => logs.forEach(({ proto }) => touchedAtoms.push(proto)))

  a1(ctx, 1)

  expect(fn.calls.length).toBe(2)
  expect(touchedAtoms.length).toBe(new Set(touchedAtoms).size)

  un()

  for (const a of [a1, a2, a3, a4, a5, a6]) {
    expect(isConnected(ctx, a)).toBe(false)
    if (isConnected(ctx, a)) throw new Error(`"${a.__reatom.name}" should be stale`)
  }
})

it(`transaction batch`, () => {
  const track = vi.fn()
  const pushNumber = action<number>()
  const numberAtom = atom((ctx) => {
    ctx.spy(pushNumber).forEach(({ payload }) => track(payload))
  })
  const ctx = createCtx()
  ctx.subscribe(numberAtom, () => {})

  expect(track).toHaveBeenCalledTimes(0)

  pushNumber(ctx, 1)
  expect(track).toHaveBeenCalledTimes(1)
  expect(track).lastCalledWith(1)

  ctx.get((): void => {
    pushNumber(ctx, 2)
    expect(track).toHaveBeenCalledTimes(1)
    pushNumber(ctx, 3)
    expect(track).toHaveBeenCalledTimes(1)
  })
  expect(track).toHaveBeenCalledTimes(3)
  expect(track).lastCalledWith(3)

  ctx.get((): void => {
    pushNumber(ctx, 4)
    expect(track).toHaveBeenCalledTimes(3)
    ctx.get(numberAtom)
    expect(track).toHaveBeenCalledTimes(4)
    pushNumber(ctx, 5)
    expect(track).toHaveBeenCalledTimes(4)
  })
  expect(track).toHaveBeenCalledTimes(5)
  expect(track).lastCalledWith(5)
  expect(track.mock.calls.map((call) => call[0])).toEqual([1, 2, 3, 4, 5])
})

it(`late effects batch`, async () => {
  const a = atom(0)
  const ctx = createCtx({
    // @ts-ignores
    callLateEffect: (cb, ...a) => setTimeout(() => cb(...a)),
  })
  const fn = vi.fn()
  ctx.subscribe(a, fn)

  expect(fn).toHaveBeenCalledTimes(1)
  expect(fn).toHaveBeenLastCalledWith(0)

  a(ctx, (s) => s + 1)
  a(ctx, (s) => s + 1)
  await Promise.resolve()
  a(ctx, (s) => s + 1)

  expect(fn).toHaveBeenCalledTimes(1)

  await new Promise((r) => setTimeout(r))

  expect(fn).toHaveBeenCalledTimes(2)
  expect(fn).toHaveBeenLastCalledWith(3)
})

it(`display name`, () => {
  const firstNameAtom = atom(`John`, `firstName`)
  const lastNameAtom = atom(`Doe`, `lastName`)
  const isFirstNameShortAtom = atom((ctx) => ctx.spy(firstNameAtom).length < 10, `isFirstNameShort`)
  const fullNameAtom = atom((ctx) => `${ctx.spy(firstNameAtom)} ${ctx.spy(lastNameAtom)}`, `fullName`)
  const displayNameAtom = atom(
    (ctx) => (ctx.spy(isFirstNameShortAtom) ? ctx.spy(fullNameAtom) : ctx.spy(firstNameAtom)),
    `displayName`,
  )
  const effect = vi.fn()

  onConnect(firstNameAtom, () => effect(`firstNameAtom init`))
  onDisconnect(firstNameAtom, () => effect(`firstNameAtom cleanup`))
  onConnect(fullNameAtom, () => effect(`fullNameAtom init`))
  onDisconnect(fullNameAtom, () => effect(`fullNameAtom cleanup`))
  onConnect(displayNameAtom, () => effect(`displayNameAtom init`))
  onDisconnect(displayNameAtom, () => effect(`displayNameAtom cleanup`))

  const ctx = createCtx()

  const un = ctx.subscribe(displayNameAtom, () => {})

  expect(effect.mock.calls.map((i) => i[0])).toEqual([
    'firstNameAtom init',
    'fullNameAtom init',
    'displayNameAtom init',
  ])
  effect.mockClear()

  firstNameAtom(ctx, `Joooooooooooohn`)
  expect(effect).toHaveBeenCalledWith(`fullNameAtom cleanup`)
  effect.mockClear()

  firstNameAtom(ctx, `Jooohn`)
  expect(effect).toHaveBeenCalledWith(`fullNameAtom init`)
  effect.mockClear()

  un()
  expect(effect.mock.calls.map((i) => i[0])).toEqual([
    'displayNameAtom cleanup',
    'fullNameAtom cleanup',
    'firstNameAtom cleanup',
  ])
})

it(// this test written is more just for example purposes
`dynamic lists`, () => {
  const listAtom = atom(new Array<AtomMut<number>>())
  const sumAtom = atom((ctx) => ctx.spy(listAtom).reduce((acc, a) => acc + ctx.spy(a), 0))
  const ctx = createCtx()
  const sumListener = vi.fn((sum: number) => {})

  ctx.subscribe(sumAtom, sumListener)

  expect(sumListener).toHaveBeenCalledTimes(1)

  let i = 0
  while (i++ < 3) {
    listAtom(ctx, (list) => [...list, atom(1)])

    expect(sumListener).toHaveBeenLastCalledWith(i)
  }

  expect(sumListener).toHaveBeenCalledTimes(4)

  ctx.get(listAtom).at(0)!(ctx, (s) => s + 1)

  expect(sumListener).toHaveBeenCalledTimes(5)
  expect(sumListener).toHaveBeenLastCalledWith(4)
})
it('no uncaught errors from schedule promise', () => {
  const doTest = action((ctx) => {
    ctx.schedule(() => {})
    throw 'err'
  })
  const ctx = createCtx()

  expect(() => doTest(ctx)).toThrow()
})

it('async cause track', () => {
  const a1 = atom(0, 'a1')
  const act1 = action((ctx) => ctx.schedule(() => act2(ctx)), 'act1')
  const act2 = action((ctx) => a1(ctx, (s) => ++s), 'act2')
  const ctx = createCtx()
  const track = vi.fn()

  ctx.subscribe(track)

  ctx.subscribe(a1, (v) => {})

  act1(ctx)

  // expect(track.lastInput().find((patch: AtomCache) => patch.proto.name === 'a1')?.cause.proto.name).toBe('act2')
  const lastCallArgs = track.mock.calls[track.mock.calls.length - 1]

  expect(lastCallArgs).toBeDefined()

  if (lastCallArgs) {
    const patch = lastCallArgs[0].find((patch: AtomCache) => patch.proto.name === 'a1')

    expect(patch?.cause.proto.name).toBe('act2')
  }
})

it('disconnect tail deps', () => {
  const aAtom = atom(0, 'aAtom')
  const track = vi.fn((ctx: CtxSpy) => ctx.spy(aAtom))
  const bAtom = atom(track, 'bAtom')
  const isActiveAtom = atom(true, 'isActiveAtom')
  const bAtomControlled = atom((ctx, state?: any) => (ctx.spy(isActiveAtom) ? ctx.spy(bAtom) : state))
  const ctx = createCtx()

  ctx.subscribe(bAtomControlled, () => {})
  expect(track).toHaveBeenCalledTimes(1)
  expect(isConnected(ctx, bAtom)).toBe(true)

  isActiveAtom(ctx, false)
  aAtom(ctx, (s) => (s += 1))
  expect(track).toHaveBeenCalledTimes(1)
  expect(isConnected(ctx, bAtom)).toBe(false)
})

it('deps shift', () => {
  const deps = [atom(0), atom(0), atom(0)]
  const track = vi.fn()

  deps.forEach((dep, i) => (dep.__reatom.disconnectHooks ??= new Set()).add(() => track(i)))

  const a = atom((ctx) => deps.forEach((dep) => ctx.spy(dep)))
  const ctx = createCtx()

  ctx.subscribe(a, () => {})
  expect(track).toHaveBeenCalledTimes(0)

  deps[0]!(ctx, (s) => s + 1)
  expect(track).toHaveBeenCalledTimes(0)

  deps.shift()!(ctx, (s) => s + 1)
  expect(track).toHaveBeenCalledTimes(1)
})
it('subscribe to cached atom', () => {
  const a1 = atom(0)
  const a2 = atom((ctx) => ctx.spy(a1))
  const ctx = createCtx()

  ctx.get(a2)
  ctx.subscribe(a2, () => {})

  expect(ctx.get((r) => r(a1.__reatom)?.subs.size)).toBe(1)
})

it('update propagation for atom with listener', () => {
  const a1 = atom(0)
  const a2 = atom((ctx) => ctx.spy(a1))
  const a3 = atom((ctx) => ctx.spy(a2))

  const ctx = createCtx()
  const cb2 = vi.fn()
  const cb3 = vi.fn()

  const un1 = ctx.subscribe(a2, cb2)
  const un2 = ctx.subscribe(a3, cb3)

  expect(cb2.mock.calls.length).toBe(1)
  expect(cb3.mock.calls.length).toBe(1)

  a1(ctx, 1)

  expect(cb2.mock.calls.length).toBe(2)
  expect(cb2.mock.calls[1]?.[0]).toBe(1)
  expect(cb3.mock.calls.length).toBe(2)
  expect(cb3.mock.calls[1]?.[0]).toBe(1)

  un2()
  expect(ctx.get((r) => r(a2.__reatom))!.subs.size).toBe(0)
  a1(ctx, 2)
  expect(cb2.mock.calls.length).toBe(3)
  expect(cb2.mock.calls[2]?.[0]).toBe(2)

  ctx.subscribe(a3, cb3)
  expect(ctx.get((r) => r(a2.__reatom))!.subs.size).toBe(1)
})

it('update queue', () => {
  const a1 = atom(5)
  const a2 = atom((ctx) => {
    const v = ctx.spy(a1)
    if (v < 3) ctx.schedule(track, 0)
  })
  let iterations = 0
  const track = vi.fn(() => {
    if (iterations++ > 5) throw new Error('circle')
    a1(ctx, (s) => ++s)
  })
  const ctx = createCtx()

  ctx.subscribe(a2, () => {})
  expect(track.mock.calls.length).toBe(0)

  a1(ctx, 0)
  expect(track.mock.calls.length).toBe(3)

  iterations = 5
  expect(() => a1(ctx, 0)).toThrow()
})

it('do not create extra patch', () => {
  const a = atom(0)
  const ctx = createCtx()
  const track = mockFn()
  ctx.get(a)

  ctx.subscribe(track)
  ctx.get(() => ctx.get(a))
  expect(track.calls.length).toBe(0)
})

it('should catch', async () => {
  const a = atom(() => {
    throw new Error()
  })
  const ctx = createCtx()
  expect(() => ctx.get(a)).toThrow()

  const p = ctx.get(() => ctx.schedule(() => ctx.get(a)))

  const res1 = await p.then(
    () => 'then',
    () => 'catch',
  )
  expect(res1).toBe('catch')

  const res2 = await ctx
    .get(() => ctx.schedule(() => ctx.get(a)))
    .then(
      () => 'then',
      () => 'catch',
    )
  expect(res2).toBe('catch')
})

it('no extra tick by schedule', async () => {
  let isDoneSync = false
  createCtx()
    .schedule(() => {
      console.log('schedule')
      return 'TEST schedule'
    })
    .then(() => (isDoneSync = true))

  await null

  expect(isDoneSync).toBe(true)

  let isDoneAsync = false
  createCtx()
    .schedule(async () => {})
    .then(() => (isDoneAsync = true))

  await null
  await null

  expect(isDoneAsync).toBe(true)

  let isDoneAsyncInTr = false
  const ctx = createCtx()
  ctx.get(() => ctx.schedule(async () => {}).then(() => (isDoneAsyncInTr = true)))

  await null
  await null

  expect(isDoneAsyncInTr).toBe(true)
})

it('update callback should accept the fresh state', () => {
  const a = atom(0)
  const b = atom(0)
  b.__reatom.computer = (ctx) => ctx.spy(a)
  const ctx = createCtx()

  expect(ctx.get(b)).toBe(0)

  a(ctx, 1)
  expect(ctx.get(b)).toBe(1)

  a(ctx, 2)
  let state
  b(ctx, (s) => {
    state = s
    return s
  })
  expect(ctx.get(b)).toBe(2)
  expect(state).toBe(2)
})

it('updateHooks should be called only for computers', () => {
  const track = mockFn()

  const a = atom(1)
  a.onChange(() => track('a'))

  const b = atom(0)
  b.__reatom.initState = () => 2
  b.onChange(() => track('b'))

  const c = atom((ctx, state = 3) => state)
  c.onChange(() => track('c'))

  const ctx = createCtx()

  expect(ctx.get(a)).toBe(1)
  expect(ctx.get(b)).toBe(2)
  expect(ctx.get(c)).toBe(3)
  expect(track.inputs()).toEqual(['c'])
})

it('hooks', () => {
  const theAtom = atom(0)
  const atomHook = mockFn()
  theAtom.onChange(atomHook)

  const theAction = action((ctx, param) => `param:${param}`)
  const actionHook = mockFn()
  theAction.onCall(actionHook)

  const ctx = createCtx()

  ctx.get(theAtom)
  ctx.get(theAction)
  expect(atomHook.calls.length).toBe(0)
  expect(actionHook.calls.length).toBe(0)

  theAtom(ctx, 1)
  expect(atomHook.calls.length).toBe(1)
  expect(atomHook.lastInput(0).subscribe).toBe(ctx.subscribe)
  expect(atomHook.lastInput(1)).toBe(1)

  theAction(ctx, 1)
  expect(actionHook.calls.length).toBe(1)
  expect(actionHook.lastInput(0).subscribe).toBe(ctx.subscribe)
  expect(actionHook.lastInput(1)).toBe('param:1')
  expect(actionHook.lastInput(2)).toEqual([1])
})

it('update hook for atom without cache', () => {
  const a = atom(0)
  const hook = mockFn()
  a.onChange(hook)
  const ctx = createCtx()

  a(ctx, 1)
  expect(hook.calls.length).toBe(1)
})

it('cause available inside a computation', () => {
  let test = false
  const a = atom(0, 'a')
  const b = atom((ctx) => {
    ctx.spy(a)
    if (test) expect(ctx.cause?.cause?.proto).toBe(a.__reatom)
  }, 'b')
  const ctx = createCtx()

  ctx.get(b) // init
  a(ctx, 123)
  test = true
  ctx.get(b)
})

it('ctx collision', () => {
  const a = atom(0)
  const ctx1 = createCtx()
  const ctx2 = createCtx()

  expect(() => ctx1.get(() => ctx2.get(a))).toThrow()
})

it('conditional deps duplication', () => {
  const listAtom = atom([1, 2, 3])

  const filterAtom = atom<'odd' | 'even'>('odd')

  const filteredListAtom = atom((ctx) => {
    if (ctx.spy(filterAtom) === 'odd') {
      return ctx.spy(listAtom).filter((n) => n % 2 === 1)
    } else if (ctx.spy(filterAtom) === 'even') {
      return ctx.spy(listAtom).filter((n) => n % 2 === 0)
    }
    return ctx.spy(listAtom)
  })

  const ctx = createCtx()

  const track = mockFn()

  ctx.subscribe(filteredListAtom, track)
  expect(track.lastInput()).toEqual([1, 3])

  filterAtom(ctx, 'even')
  expect(track.lastInput()).toEqual([2])

  filterAtom(ctx, 'odd')
  expect(track.lastInput()).toEqual([1, 3])

  filterAtom(ctx, 'even')
  expect(track.lastInput()).toEqual([2])
})

it('nested schedule', async () => {
  const act = action((ctx) => {
    return ctx.schedule(() => {
      return ctx.schedule(async () => {})
    })
  })

  const ctx = createCtx()
  await act(ctx)
})

it('dynamic spy callback prevValue', () => {
  let testPrev: any
  const a = atom(0)
  const b = atom((ctx) => {
    ctx.spy(a)
    const anAtom = atom(0)
    ctx.spy(anAtom, (next, prev) => {
      testPrev = prev
    })
  })
  const ctx = createCtx()
  ctx.subscribe(b, () => {})
  expect(testPrev).toBe(undefined)

  a(ctx, 1)
  expect(testPrev).toBe(undefined)
})

it('should drop actualization of stale atom during few updates in one transaction', () => {
  const a = atom(0)
  const b = atom((ctx) => ctx.spy(a))
  const ctx = createCtx()

  ctx.get(() => {
    expect(ctx.get(b)).toBe(0)
    a(ctx, 1)
    expect(ctx.get(b)).toBe(1)
  })
})

it('nested condition branches', () => {
  const a = atom(true)
  const b = atom(1)
  const c = atom(1)
  const d = atom((ctx) => (ctx.spy(a) ? ctx.spy(b) : ctx.spy(c)))
  const e = atom((ctx) => ctx.spy(d))

  const ctx = createCtx()
  const track = mockFn()

  ctx.subscribe(e, track)
  track.calls.length = 0

  expect(isConnected(ctx, b)).toBeTruthy()
  expect(isConnected(ctx, c)).toBeFalsy()

  a(ctx, false)
  expect(isConnected(ctx, b)).toBeFalsy()
  expect(isConnected(ctx, c)).toBeTruthy()
})

it('disconnect of the last version of pubs', async () => {
  const ctx = createCtx()

  let logs = new Array<string>()

  const flagAtom = atom(false, 'flagAtom')

  const endAtom = atom((ctx) => {
    if (!ctx.spy(flagAtom)) return ''

    const depAtom = atom('dep', 'depAtom')
    onDisconnect(depAtom, () => logs.push('dep disconnected'))

    return ctx.spy(depAtom)
  }, 'endAtom')

  onDisconnect(endAtom, () => logs.push('end disconnected'))

  const uns = ctx.subscribe(endAtom, (state) => logs.push(state))
  flagAtom(ctx, true)

  uns()

  expect(logs).toEqual(['', 'dep', 'end disconnected', 'dep disconnected'])
})

it('computed deps change during disconnection', () => {
  const ctx = createCtx()

  const reatomSome = (name: string) => {
    const params = atom(0, `${name}.params`)
    const data = atom((ctx) => ctx.spy(params), `${name}.data`)
    return { params, data }
  }
  const some1 = reatomSome('one')
  const some2 = reatomSome('two')

  const toggler = atom(some1, 'toggler')
  const data = atom((ctx) => ctx.spy(ctx.spy(toggler).data), 'data')
  const subscription = atom((ctx) => ctx.spy(data), 'subscription')

  expect(ctx.get(subscription)).toBe(0)

  toggler(ctx, some2)
  ctx.subscribe(subscription, () => {})
  some2.params(ctx, 1)
  expect(ctx.get(subscription)).toBe(1)
})

it('extra log for init update', () => {
  const ctx = createCtx()
  const logger = mockFn()

  ctx.subscribe(logger)

  const a = atom('')
  const b = atom('')

  ctx.get(a)
  expect(logger.lastInput().length).toBe(1)

  b(ctx, '')
  expect(logger.lastInput().length).toBe(2)
})

// it(`maximum call stack`, () => {
//   const atoms = new Map<AtomProto, Atom>()
//   let i = 0
//   const reducer = (ctx: CtxSpy): any => {
//     let dep = atoms.get(ctx.cause!.proto)
//     if (!dep) atoms.set(ctx.cause!.proto, (dep = ++i > 10_000 ? atom(0) : atom(reducer)))
//     return ctx.spy(dep)
//   }
//   const testAtom = atom(reducer)
//   const ctx = createCtx()
//
//   expect(() => {
//     try {
//       ctx.get(testAtom)
//     } catch (error) {
//       i //?
//       error.message //?
//       throw error
//     }
//   }).toThrow(/Maximum call stack/)
// })
