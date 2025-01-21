import { describe, it, expect } from 'vitest'
import { createTestCtx, getDuration } from '@reatom/testing'
import { sleep } from '@reatom/utils'
import { reatomTimer } from './'

describe('base API', async () => {
  it('should start timer correctly', async () => {
    const timerAtom = reatomTimer('test')
    const ctx = createTestCtx()

    timerAtom.intervalAtom.setSeconds(ctx, 0.001)

    const target = 50
    const duration = await getDuration(() => timerAtom.startTimer(ctx, target / 1000))

    expect(duration).toBeGreaterThanOrEqual(target)
  })

  it('should handle stopping timer', async () => {
    const timerAtom = reatomTimer('test')
    const ctx = createTestCtx()

    const target = 50
    const [duration] = await Promise.all([
      getDuration(() => timerAtom.startTimer(ctx, target / 1000)),
      sleep(target / 2).then(() => timerAtom.stopTimer(ctx)),
    ])
    expect(duration).toBeGreaterThanOrEqual(target / 2)
    expect(duration).toBeLessThan(target)
  })
})

describe('progressAtom', async () => {
  it('should track progress correctly', async () => {
    const timerAtom = reatomTimer({ delayMultiplier: 1 })
    const ctx = createTestCtx()

    timerAtom.intervalAtom(ctx, 10)
    const track = ctx.subscribeTrack(timerAtom.progressAtom)

    await timerAtom.startTimer(ctx, 50)
    expect(track.inputs()).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
  })
})

describe('pauseAtom', async () => {
  it('should pause and resume timer correctly', async () => {
    const timerAtom = reatomTimer({ interval: 10, delayMultiplier: 1 })
    const ctx = createTestCtx()

    const track = ctx.subscribeTrack(timerAtom.progressAtom)
    track.calls.length = 0 // Reset call count

    timerAtom.startTimer(ctx, 100)
    let target = Date.now() + 100

    for (let i = 0; i < 5; i++) {
      await sleep(5)
    }

    expect(track.inputs()).toEqual([0.1, 0.2])

    timerAtom.pauseAtom(ctx, true)
    await sleep(25)
    target += 25
    expect(track.inputs()).toEqual([0.1, 0.2])

    timerAtom.pauseAtom(ctx, false)
    await sleep(10)
    expect(track.inputs()).toEqual([0.1, 0.2, 0.3])

    await sleep(target - Date.now() - 5)
    expect(track.inputs()).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])

    await sleep(10)
    expect(track.inputs()).toEqual([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
  })
})

describe('do not allow overprogress', async () => {
  it('should not progress beyond 1', async () => {
    const timerAtom = reatomTimer({ delayMultiplier: 1, interval: 1 })
    const ctx = createTestCtx()

    const delay = 10
    const start = Date.now()
    const promise = timerAtom.startTimer(ctx, delay)

    await sleep(delay / 2)
    while (Date.now() - start < delay) {}

    await promise

    expect(ctx.get(timerAtom.progressAtom)).toBe(1)
  })
})

describe('allow start from passed time', async () => {
  it('should start from the given passed time', async () => {
    const timerAtom = reatomTimer({ delayMultiplier: 1, interval: 1 })
    const ctx = createTestCtx()

    const delay = 20
    const passed = 10
    const start = Date.now()
    const promise = timerAtom.startTimer(ctx, delay, passed)
    expect(ctx.get(timerAtom.progressAtom)).toBe(passed / delay)

    await promise

    const duration = Date.now() - start
    expect(Math.abs(delay - passed - duration)).toBeLessThanOrEqual(2)
  })
})

// Commented out due to flakiness in tests
// console.warn('@reatom/timer tests are turned off because of flakiness')
