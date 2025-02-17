import {
  Atom,
  AtomProto,
  Ctx,
  CtxSpy,
  __count,
  atom,
  throwReatomError,
} from '@reatom/core'

type FunctionSource = string

const mapAtom = atom(
  null as any as WeakMap<AtomProto, Map<FunctionSource, Atom>>,
  'select._map',
)
mapAtom.__reatom.initState = () => new WeakMap()

const touchedMap = new WeakMap<Ctx, Set<FunctionSource>>()

export const select = <T>(
  ctx: CtxSpy,
  cb: (ctx: CtxSpy) => T,
  equal: (oldState: T, newState: T) => boolean = () => false,
): T => {
  let touched = touchedMap.get(ctx)
  if (!touched) {
    touchedMap.set(ctx, (touched = new Set()))
  }

  const map = ctx.get(mapAtom)
  let atoms = map.get(ctx.cause.proto)

  if (!atoms) {
    map.set(ctx.cause.proto, (atoms = new Map()))
  }

  const selectSource = cb.toString()

  throwReatomError(
    touched.has(selectSource),
    'multiple select with the same "toString" representation is not allowed',
  )
  touched.add(selectSource)

  let selectAtom = atoms.get(selectSource)
  if (!selectAtom) {
    let isInit = true
    atoms.set(
      selectSource,
      (selectAtom = atom(
        (ctx, prevState?: any) => {
          const newState = cb(ctx)
          const resultState =
            isInit || !equal(prevState, newState) ? newState : prevState
          isInit = false
          return resultState
        },
        __count(`${ctx.cause.proto.name}._select`),
      )),
    )
  }

  return ctx.spy(selectAtom!)
}
