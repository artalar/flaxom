import { action, Action, Atom, AtomCache, AtomState, Ctx } from '@reatom/core'

export const withReset =
  <T extends Atom>() =>
  (anAtom: T): T & { reset: Action<[], AtomState<T>> } =>
    Object.assign(anAtom, {
      reset: action(
        (ctx) =>
          ctx.get(
            (read, actualize) =>
              actualize!(
                ctx,
                anAtom.__reatom,
                (patchCtx: Ctx, patch: AtomCache) => (patch.state = patch.proto.initState(ctx)),
              ).state,
          ),
        `${anAtom.__reatom.name}._reset`,
      ),
    })
