import React from 'react'
import { atom, onConnect, mapState } from '@reatom/framework'
import { reatomComponent } from '@reatom/npm-react'
import { reatomTimer } from '@reatom/timer'
import { Box, Button, Flex, Label, Stack, VFlex } from '~/basic'
import { cx } from '~/utils'

function clamp(num: number, min: number, max: number) {
  return num <= min ? min : num >= max ? max : num
}

const MAX = 30000
const INTERVAL = 100

// eslint-disable-next-line @reatom/reatom-prefix-rule
const timerAtom = reatomTimer({
  name: 'timerAtom',
  interval: INTERVAL,
  delayMultiplier: 1,
  progressPrecision: 1,
  resetProgress: false,
})

const nowAtom = timerAtom.pipe(mapState(() => new Date().getTime(), 'nowAtom'))

const maxAtom = atom(MAX / 2, 'maxAtom')

const startAtom = atom(new Date().getTime(), 'startAtom')

const elapsedAtom = atom((ctx) => {
  const max = ctx.spy(maxAtom)
  const start = ctx.spy(startAtom)
  if (new Date().getTime() - start >= max) return max
  const now = ctx.spy(nowAtom)
  return clamp(now - start, 0, max)
}, 'elapsedAtom')

onConnect(maxAtom, (ctx) => {
  const max = ctx.get(maxAtom)
  void timerAtom.startTimer(ctx, max)
})

maxAtom.onChange((ctx, max) => {
  if (max <= INTERVAL) {
    timerAtom.stopTimer(ctx)
  } else {
    void timerAtom.startTimer(ctx, max)
  }
})

const padder = <Label className="invisible">Elapsed Time: </Label>

export const Timer = reatomComponent(({ ctx }) => {
  return (
    <VFlex className={cx('min-w-[350px]')} vspace="4px">
      <GaugeTime />
      <TextTime />
      <Flex className={cx('items-center')}>
        <Stack>
          {padder}
          <Label>Duration: </Label>
        </Stack>
        <Box className="mr-1" />
        <input
          type="range"
          min={0}
          max={MAX}
          value={ctx.spy(maxAtom)}
          onChange={(e) => maxAtom(ctx, Math.max(1, parseInt(e.target.value)))}
          className={cx('flex-1')}
        />
      </Flex>
      <Button
        onClick={() => {
          startAtom(ctx, new Date().getTime())
          void timerAtom.startTimer(ctx, Math.max(ctx.get(maxAtom), INTERVAL))
        }}
      >
        Reset Timer
      </Button>
    </VFlex>
  )
}, 'Timer')

const TextTime = reatomComponent(({ ctx }) => {
  const value = ctx.spy(elapsedAtom)
  const seconds = Math.floor(value / 1000)
  const dezipart = Math.floor(value / 100) % 10
  const formatted = `${seconds}.${dezipart}s`
  return (
    <Flex className={cx('items-center', 'select-none')}>
      {padder}
      <Label className="flex-1 text-left">{formatted}</Label>
    </Flex>
  )
}, 'TextTime') as React.FC

TextTime.displayName = 'TextTime'

const GaugeTime = reatomComponent(({ ctx }) => {
  return (
    <Flex className={cx('items-center')}>
      <Label>Elapsed Time: </Label>
      <Box className="mr-1" />
      <meter
        min={0}
        max={ctx.spy(maxAtom)}
        value={ctx.spy(elapsedAtom)}
        className={cx('flex-1')}
      />
    </Flex>
  )
}, 'GaugeTime')
