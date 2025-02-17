import { Atom, Action, action, atom, random, sleep } from '@reatom/framework'
import { TimerAtom, reatomTimer } from '@reatom/timer'

export interface Notification {
  id: string
  message: string
  kind: string
  timer: TimerAtom
  remains: Atom<number>
  readed: Atom<boolean>
  remove: Action
}

const SHOW_DELAY = 5000
const HIDE_DELAY = 1000

export const notifications = atom(new Array<Notification>(), 'notifications')
export const notify = action((ctx, message, kind) => {
  const notification = reatomNotification(message, kind)
  notification.timer.startTimer(ctx, SHOW_DELAY)
  notifications(ctx, (list) => [...list, notification])
}, 'notify')

const reatomNotification = (message: string, kind: string): Notification => {
  const name = `notification#${random(1, 1e10)}`
  const timer = reatomTimer({
    name: `_${name}.timer`,
    interval: 10,
    resetProgress: false,
    delayMultiplier: 1,
  })
  const remains = atom(
    (ctx) => (1 - ctx.spy(timer.progressAtom)) * 100,
    `${name}._remains`,
  )
  const readed = atom(
    (ctx) => ctx.spy(remains) === 0 || ctx.spy(timer) === 0,
    `${name}.readed`,
  )
  const remove = action(timer.stopTimer, `${name}.remove`)
  timer.endTimer.onCall(async (ctx) => {
    await sleep(HIDE_DELAY)
    notifications(ctx, (list) => list.filter((n) => n !== notification))
  })

  const notification: Notification = {
    id: name,
    message,
    kind,
    timer,
    remains,
    readed,
    remove,
  }
  return notification
}
