import { action, Action, atom, Atom } from '@reatom/core'
import { __thenReatomed } from '@reatom/effects'

import { AsyncAction } from '.'
import { isShallowEqual } from '@reatom/utils'

export interface AsyncStatusesNeverPending {
  isPending: false
  isFulfilled: false
  isRejected: false
  isSettled: false

  isFirstPending: false
  // isAnotherPending: false
  isEverPending: false
  // isNeverPending: true
  isEverSettled: false
  // isNeverSettled: true
}

export interface AsyncStatusesFirstPending {
  isPending: true
  isFulfilled: false
  isRejected: false
  isSettled: false

  isFirstPending: true
  // isAnotherPending: false
  isEverPending: true
  // isNeverPending: false
  isEverSettled: false
  // isNeverSettled: true
}

export interface AsyncStatusesFulfilled {
  isPending: false
  isFulfilled: true
  isRejected: false
  isSettled: true

  isFirstPending: false
  // isAnotherPending: false
  isEverPending: true
  // isNeverPending: false
  isEverSettled: true
  // isNeverSettled: false
}

export interface AsyncStatusesRejected {
  isPending: false
  isFulfilled: false
  isRejected: true
  isSettled: true

  isFirstPending: false
  // isAnotherPending: false
  isEverPending: true
  // isNeverPending: false
  isEverSettled: true
  // isNeverSettled: false
}

export interface AsyncStatusesAnotherPending {
  isPending: true
  isFulfilled: false
  isRejected: false
  isSettled: false

  isFirstPending: false
  // isAnotherPending: true
  isEverPending: true
  // isNeverPending: false
  isEverSettled: true
  // isNeverSettled: false
}

export type AsyncStatusesPending =
  | AsyncStatusesFirstPending
  | AsyncStatusesAnotherPending

export type AsyncStatuses =
  | AsyncStatusesNeverPending
  | AsyncStatusesPending
  | AsyncStatusesFulfilled
  | AsyncStatusesRejected

export interface AsyncStatusesAtom extends Atom<AsyncStatuses> {
  reset: Action<[], AsyncStatusesNeverPending>
}

const memo =
  (reducer: (state: AsyncStatuses) => AsyncStatuses) =>
  (state: AsyncStatuses): AsyncStatuses => {
    const newState = reducer(state)
    return isShallowEqual(state, newState) ? state : newState
  }

export const asyncStatusesInitState: AsyncStatuses = {
  isPending: false,
  isFulfilled: false,
  isRejected: false,
  isSettled: false,

  isFirstPending: false,
  // isAnotherPending: false,
  isEverPending: false,
  // isNeverPending: true,
  isEverSettled: false,
  // isNeverSettled: true,
}

export const withStatusesAtom =
  <
    T extends AsyncAction & {
      statusesAtom?: AsyncStatusesAtom
    },
  >() =>
  (anAsync: T): T & { statusesAtom: AsyncStatusesAtom } => {
    if (!anAsync.statusesAtom) {
      const relatedPromisesAtom = atom(
        new WeakSet<Promise<any>>(),
        `${anAsync.__reatom.name}.statusesAtom._relatedPromisesAtom`,
      )

      const statusesAtom = atom<AsyncStatuses>(
        asyncStatusesInitState,
        `${anAsync.__reatom.name}.statusesAtom`,
      )

      // @ts-expect-error computer dump types
      statusesAtom.__reatom.computer = (ctx, state: AsyncStatuses) => {
        ctx.spy(anAsync, ({ payload }) => {
          ctx.get(relatedPromisesAtom).add(payload)
          state = memo(
            (statuses) =>
              ({
                isPending: ctx.get(anAsync.pendingAtom) > 0,
                isFulfilled: false,
                isRejected: false,
                isSettled: false,

                isFirstPending: !statuses.isEverSettled,
                // isAnotherPending: statuses.isEverPending,
                isEverPending: true,
                // isNeverPending: false,
                isEverSettled: statuses.isEverSettled,
                // isNeverSettled: statuses.isNeverSettled,
              }) as AsyncStatuses,
          )(state)
        })
        return state
      }

      anAsync.statusesAtom = Object.assign(statusesAtom, {
        reset: action((ctx) => {
          relatedPromisesAtom(ctx, new Set())
          return statusesAtom(
            ctx,
            asyncStatusesInitState,
          ) as AsyncStatusesNeverPending
        }),
      })

      anAsync.onCall((ctx, payload) => {
        ctx.get(statusesAtom)

        __thenReatomed(
          ctx,
          payload,
          () => {
            if (ctx.get(relatedPromisesAtom).has(payload)) {
              statusesAtom(
                ctx,
                memo(() => {
                  const isPending = ctx.get(anAsync.pendingAtom) > 0
                  return {
                    isPending,
                    isFulfilled: !isPending,
                    isRejected: false,
                    isSettled: !isPending,

                    isFirstPending: false,
                    // isAnotherPending: false,
                    isEverPending: true,
                    // isNeverPending: false,
                    isEverSettled: true,
                    // isNeverSettled: false,
                  } as AsyncStatuses
                }),
              )
            }
          },
          () => {
            if (ctx.get(relatedPromisesAtom).has(payload)) {
              statusesAtom(
                ctx,
                memo(() => {
                  const isPending = ctx.get(anAsync.pendingAtom) > 0
                  return {
                    isPending,
                    isFulfilled: false,
                    isRejected: !isPending,
                    isSettled: !isPending,

                    isFirstPending: false,
                    // isAnotherPending: false,
                    isEverPending: true,
                    // isNeverPending: false,
                    isEverSettled: true,
                    // isNeverSettled: false,
                  } as AsyncStatuses
                }),
              )
            }
          },
        )
      })
    }

    return anAsync as T & { statusesAtom: Atom<AsyncStatuses> }
  }
