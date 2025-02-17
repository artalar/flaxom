import { atom, type Atom } from '@reatom/core'
import { onConnect } from '@reatom/hooks'
import { withAssign } from '@reatom/primitives'
import { onEvent } from './event'

type OnlineAtom = Atom<boolean> & {
  /** Time stamp of transition to online mode. */
  offlineAtAtom: Atom<number | undefined>
  /** Time stamp of transition to offline mode. */
  onlineAtAtom: Atom<number | undefined>
}

/**
 * @note https://issues.chromium.org/issues/338514113
 */
export const createOnlineAtom = (): OnlineAtom => {
  const onlineAtom = atom(navigator.onLine, 'onLine').pipe(
    withAssign(() => ({
      offlineAtAtom: atom<number | undefined>(
        undefined,
        'onLine.offlineAtAtom',
      ),
      onlineAtAtom: atom<number | undefined>(undefined, 'onLine.onlineAtAtom'),
    })),
  )

  onConnect(onlineAtom, (ctx) => {
    onlineAtom(ctx, navigator.onLine)
    onEvent(ctx, window, 'online', () => {
      onlineAtom(ctx, true)
      onlineAtom.onlineAtAtom(ctx, Date.now())
    })
    onEvent(ctx, window, 'offline', () => {
      onlineAtom(ctx, false)
      onlineAtom.offlineAtAtom(ctx, Date.now())
    })
  })

  return onlineAtom
}
