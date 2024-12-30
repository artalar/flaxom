import { action, Action, atom, Atom } from '@reatom/core'
import { __thenReatomed } from '@reatom/effects'

import { AsyncAction } from '.'
import { isAbort, isShallowEqual } from '@reatom/utils'

export interface AsyncStatusesNeverPending {
  isPending: false
  isFulfilled: false
  isRejected: false
  isSettled: false

  isFirstPending: false
  isEverPending: false
  isEverSettled: false
}

export interface AsyncStatusesFirstPending {
  isPending: true
  isFulfilled: false
  isRejected: false
  isSettled: false

  isFirstPending: true
  isEverPending: true
  isEverSettled: false
}

export interface AsyncStatusesFirstAborted {
  isPending: false
  isFulfilled: false
  isRejected: false
  isSettled: false

  isFirstPending: false
  isEverPending: true
  isEverSettled: false
}

export interface AsyncStatusesAbortedPending {
  isPending: true
  isFulfilled: false
  isRejected: false
  isSettled: false

  isFirstPending: false
  isEverPending: true
  isEverSettled: boolean
}

export interface AsyncStatusesAbortedFulfill {
  isPending: false
  isFulfilled: true
  isRejected: false
  isSettled: true

  isFirstPending: false
  isEverPending: true
  isEverSettled: true
}

export interface AsyncStatusesAbortedReject {
  isPending: false
  isFulfilled: false
  isRejected: true
  isSettled: true

  isFirstPending: false
  isEverPending: true
  isEverSettled: true
}

export type AsyncStatusesAbortedSettle = AsyncStatusesAbortedFulfill | AsyncStatusesAbortedReject

export interface AsyncStatusesFulfilled {
  isPending: false
  isFulfilled: true
  isRejected: false
  isSettled: true

  isFirstPending: false
  isEverPending: true
  isEverSettled: true
}

export interface AsyncStatusesRejected {
  isPending: false
  isFulfilled: false
  isRejected: true
  isSettled: true

  isFirstPending: false
  isEverPending: true
  isEverSettled: true
}

export interface AsyncStatusesAnotherPending {
  isPending: true
  isFulfilled: false
  isRejected: false
  isSettled: false

  isFirstPending: false
  isEverPending: true
  isEverSettled: true
}

export type AsyncStatusesPending = AsyncStatusesFirstPending | AsyncStatusesAbortedPending | AsyncStatusesAnotherPending

export type AsyncStatuses =
  | AsyncStatusesNeverPending
  | AsyncStatusesFirstAborted
  | AsyncStatusesPending
  | AsyncStatusesFulfilled
  | AsyncStatusesRejected
  | AsyncStatusesAbortedSettle

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
  isEverPending: false,
  isEverSettled: false,
}

export const withStatusesAtom =
  <
    T extends AsyncAction & {
      statusesAtom?: AsyncStatusesAtom
    },
  >() =>
  (anAsync: T): T & { statusesAtom: AsyncStatusesAtom } => {
    if (!anAsync.statusesAtom) {
      // `anAsync.onCall` is global over all contexts,
      // so we should compute each `statusesAtom` only from related promises
      const relatedPromisesAtom = atom(
        new WeakSet<Promise<any>>(),
        `${anAsync.__reatom.name}.statusesAtom._relatedPromisesAtom`,
      )

      const lastSettledStatusAtom = atom<null | 'fulfilled' | 'rejected'>(
        null,
        `${anAsync.__reatom.name}.statusesAtom._lastSettledStatusAtom`,
      )

      const statusesAtom = atom<AsyncStatuses>(asyncStatusesInitState, `${anAsync.__reatom.name}.statusesAtom`)

      // @ts-expect-error computer dump types
      statusesAtom.__reatom.computer = (ctx, state: AsyncStatuses) => {
        ctx.spy(anAsync, ({ payload }) => {
          ctx.get(relatedPromisesAtom).add(payload)
          const pending = ctx.get(anAsync.pendingAtom)
          state = memo(
            (statuses) =>
              ({
                isPending: pending > 0,
                isFulfilled: false,
                isRejected: false,
                isSettled: false,

                isFirstPending: !statuses.isEverPending,
                isEverPending: true,
                isEverSettled: statuses.isEverSettled,
              }) as AsyncStatuses,
          )(state)
        })
        return state
      }

      anAsync.statusesAtom = Object.assign(statusesAtom, {
        reset: action((ctx) => {
          relatedPromisesAtom(ctx, new Set())
          return statusesAtom(ctx, asyncStatusesInitState) as AsyncStatusesNeverPending
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
                    isEverPending: true,
                    isEverSettled: true,
                  } as AsyncStatuses
                }),
              )

              lastSettledStatusAtom(ctx, 'fulfilled')
            }
          },
          (error) => {
            if (ctx.get(relatedPromisesAtom).has(payload)) {
              const isPending = ctx.get(anAsync.pendingAtom) > 0

              statusesAtom(
                ctx,
                memo((state) => {
                  if (isAbort(error)) {
                    const lastSettledStatus = ctx.get(lastSettledStatusAtom)

                    if (state.isEverSettled && !isPending) {
                      return {
                        isPending,
                        isFulfilled: lastSettledStatus === 'fulfilled',
                        isRejected: lastSettledStatus === 'rejected',
                        isSettled: true,

                        isFirstPending: false,
                        isEverPending: true,
                        isEverSettled: true,
                      } as AsyncStatusesAbortedSettle
                    } else {
                      return {
                        isPending,
                        isFulfilled: false,
                        isRejected: false,
                        isSettled: false,

                        isFirstPending: false,
                        isEverPending: true,
                        isEverSettled: state.isEverSettled,
                      } as AsyncStatusesAbortedPending | AsyncStatusesFirstAborted | AsyncStatusesAbortedPending
                    }
                  }

                  return {
                    isPending,
                    isFulfilled: false,
                    isRejected: !isPending,
                    isSettled: !isPending,

                    isFirstPending: false,
                    isEverPending: true,
                    isEverSettled: true,
                  } as AsyncStatuses
                }),
              )

              if (!isAbort(error)) lastSettledStatusAtom(ctx, 'rejected')
            }
          },
        )
      })
    }

    return anAsync as T & { statusesAtom: Atom<AsyncStatuses> }
  }
