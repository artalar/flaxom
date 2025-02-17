import { AtomCache, AtomProto, Ctx, Fn, Rec, __root } from '@reatom/core'
import { isShallowEqual, noop } from '@reatom/utils'
import { logGraph } from './graphView'

export interface unstable_ChangeMsg {
  newState?: any
  oldState?: any
  payload?: any
  patch: AtomCache
  cause?: string
  history: Array<AtomCache>
  params?: Array<any>
  time: number
}
export interface LogMsg {
  error: undefined | Error
  changes: Rec<unstable_ChangeMsg>
  logs: Array<AtomCache>
  ctx: Ctx
}

// use recursion to drop stack limit error for circle causes
export const getCause = (patch: AtomCache, log = ''): string => {
  if (log.length > 10_000) return `${log} ...`
  if (patch.cause !== null && patch.cause.proto !== __root)
    return getCause(
      patch.cause,
      log + ' <-- ' + (patch.cause.proto.name ?? 'unnamed'),
    )
  else {
    return log || 'root'
  }
}

const getTimeStampDefault = () => {
  let ms: number | string = new Date().getMilliseconds()
  ms = ms.toString().padStart(3, '0')
  return `${new Date().toLocaleTimeString()} ${ms}ms`
}

let timesPrecision = 10 ** 15

export const createLogBatched = ({
  debounce = 500,
  getTimeStamp = getTimeStampDefault,
  limit = 5000,
  log = console.log,
  domain = '',
  shouldGroup = false,
  shouldLogGraph = false,
}: {
  debounce?: number
  getTimeStamp?: () => string
  limit?: number
  log?: typeof console.log
  domain?: string
  shouldGroup?: boolean
  shouldLogGraph?: boolean
} = {}) => {
  if (domain) domain = `(${domain}) `
  let queue: Array<LogMsg & { time: string }> = []
  let isBatching = false
  let batchingStart = Date.now()
  const logBatched = (msg: LogMsg) => {
    if (Object.keys(msg.changes).length === 0) return

    if (!isBatching) {
      isBatching = true
      batchingStart = Date.now()
    }

    setTimeout(
      (length) => {
        isBatching =
          queue.length !== length && Date.now() - batchingStart < limit

        if (isBatching) return

        const isFewTransactions = queue.length > 0

        console.groupCollapsed(
          `Reatom ${domain}${length} transaction${length > 1 ? 's' : ''}`,
        )

        if (shouldLogGraph) {
          logGraph(
            new Set(
              queue
                .flatMap(({ changes }) => Object.values(changes))
                .sort((a, b) => a.time - b.time)
                .map(({ patch }) => patch),
            ),
          )
        }

        for (const { changes, time, error } of queue) {
          console.log(
            `%c ${time}`,
            `padding-left: calc(50% - ${
              time.length / 2
            }em); font-size: 0.7rem;`,
          )

          if (error) console.error(error)

          let inGroup = false
          Object.entries(changes).forEach(([k, change], i, arr) => {
            const isAction = 'payload' in change
            const color = isAction
              ? 'background: #ffff80; color: #151134;'
              : 'background: #151134; color: white;'
            const style = `${color}font-weight: 400; padding: 0.15em;  padding-right: 1ch;`

            const name = k.replace(/(\d)*\./, '')
            const head = name.replace(/\..*/, '')
            const nextK = arr[i + 1]?.[0]
            const nextName = nextK?.replace(/(\d)*\./, '')
            const isGroup = nextName?.startsWith(head)
            if (shouldGroup && !inGroup && isGroup && isFewTransactions) {
              inGroup = true
              // TODO show name?
              console.groupCollapsed(`%c ${head}`, style)
            }
            const title = `%c ${name}`
            const data = isAction ? change!.payload : change!.newState
            console.groupCollapsed(title, style)
            console.log(change)
            console.groupEnd()
            // do not log the same data twice if action just pass the data
            if (isAction && !isShallowEqual(change.params, [data])) {
              log(...change.params!)
            }
            log(data)

            if (shouldGroup && !isGroup && inGroup) {
              inGroup = false
              console.groupEnd()
            }
          })
        }
        console.log('\n\n', 'transactions:', queue)
        console.groupEnd()
        queue = []
      },
      debounce,
      queue.push(Object.assign(msg, { time: getTimeStamp() })),
    )
  }

  return logBatched
}

// export const log = action((ctx, message: any, name?: string) => ({
//   message,
//   name,
// }), '@reatom/logger.log')

// declare global {
//   REATOM_LOG: typeof log
// }

// globalThis.REATOM_LOG = log

export const connectLogger = (
  ctx: Ctx,
  {
    devtools = false,
    historyLength = 10,
    domain = '',
    log = createLogBatched({ domain }),
    showCause = true,
    skip = () => false,
    skipUnnamed = true,
  }: {
    devtools?: boolean
    historyLength?: number
    log?: Fn<[LogMsg]>
    domain?: string
    showCause?: boolean
    skipUnnamed?: boolean
    skip?: (patch: AtomCache) => boolean
  } = {},
) => {
  const history = new WeakMap<AtomProto, Array<AtomCache>>()
  let read: Fn<[AtomProto], undefined | AtomCache>
  ctx.get((r) => (read = r))

  const devtoolsDispose = /* devtools ? devtoolsCreate(ctx) : */ noop

  const ctxUnsubscribe = ctx.subscribe((logs, error) => {
    let i = -1
    try {
      const states = new WeakMap<AtomProto, any>()
      const changes: LogMsg['changes'] = {}
      while (++i < logs.length) {
        const patch = logs[i]!

        const { cause, proto, state } = patch
        const { isAction } = proto
        let { name } = proto

        if (skip(patch)) continue

        if (!name || name.startsWith('_') || /\._/.test(name)) {
          if (skipUnnamed) continue
          name ??= 'unnamed'
        }

        const oldCache = read(proto)
        const oldState = states.has(proto) ? states.get(proto) : oldCache?.state
        states.set(proto, state)

        const isStateChanged = !Object.is(state, oldState)
        const isFilteredAction = isAction && state.length === 0

        if (!isStateChanged || isFilteredAction) continue

        let atomHistory = history.get(proto) ?? []
        if (historyLength) {
          atomHistory = atomHistory.slice(0, historyLength - 1)
          atomHistory.unshift(
            isAction ? { ...patch, state: [...state] } : patch,
          )
          history.set(proto, atomHistory)
        }

        const isConnection =
          !oldCache &&
          cause!.proto.name === 'root' &&
          (!isAction || state.length === 0)

        if (isConnection) continue

        const changeMsg: unstable_ChangeMsg = (changes[`${i + 1}.${name}`] = {
          patch,
          history: atomHistory,
          time: (globalThis.performance ?? Date).now() + 1 / timesPrecision--,
        })

        if (isAction) {
          const call = state.at(-1) as { params: Array<any>; payload: any }
          changeMsg.params = call.params
          changeMsg.payload = call.payload
        } else {
          changeMsg.newState = state
          changeMsg.oldState = oldState
        }
        changeMsg.patch = patch
        if (showCause) changeMsg.cause = getCause(patch)
      }

      log({
        error,
        changes,
        logs,
        ctx,
      })
    } catch (error) {
      console.error('Reatom/logger error with', logs[i])
      console.log(error)
    }
  })

  return () => {
    devtoolsDispose()
    ctxUnsubscribe()
  }
}
