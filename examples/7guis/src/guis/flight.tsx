import React, { Component } from 'react'
import { DateTime } from 'luxon'
import { reatomComponent, useAtom } from '@reatom/npm-react'
import { Button, TextInput, VFlex } from '~/basic'
import { cx } from '~/utils'

const dateFormat = 'dd.MM.yyyy'

function getTimestamp(date: string): number | null {
  const parsed = DateTime.fromFormat(date, dateFormat)
  if (!parsed.isValid) return null
  return parsed.valueOf()
}

function isValidDate(date: string): boolean {
  return getTimestamp(date) != null
}

export const FlightBooker = reatomComponent(({ ctx }) => {
  const [type, setType, typeAtom] = useAtom<'one-way' | 'return'>('one-way')

  const initDate = DateTime.local().toFormat(dateFormat)
  const [start, setStart, startAtom] = useAtom(initDate)
  const [end, setEnd, endAtom] = useAtom(initDate)

  const [validStart, , validStartAtom] = useAtom((ctx) =>
    isValidDate(ctx.spy(startAtom)),
  )
  const [validEnd, , validEndAtom] = useAtom((ctx) =>
    isValidDate(ctx.spy(endAtom)),
  )

  const disabledEnd = type !== 'return'

  const [bookable] = useAtom((ctx) => {
    if (!ctx.spy(validStartAtom) || !ctx.spy(validEndAtom)) return false
    if (ctx.spy(typeAtom) === 'return') {
      return (
        getTimestamp(ctx.spy(startAtom))! <= getTimestamp(ctx.spy(endAtom))!
      )
    }
    return true
  })

  const handleBook = () => {
    switch (ctx.get(typeAtom)) {
      case 'one-way':
        return alert(
          `You have booked a one-way flight for ${ctx.get(startAtom)}`,
        )
      case 'return':
        return alert(
          `You have booked a return flight from ${ctx.get(startAtom)} to ${ctx.get(endAtom)}`,
        )
      default:
        throw 'Impossible'
    }
  }

  return (
    <VFlex
      data-testid="flight-booker"
      className={cx('min-w-[200px]')}
      vspace="8px"
    >
      <select
        data-testid="flight-booker-type"
        value={type}
        onChange={(e) => setType(e.target.value as 'one-way' | 'return')}
      >
        <option value="one-way">one-way flight</option>
        <option value="return">return flight</option>
      </select>
      <DateInput
        testId="input-start"
        value={start}
        valid={validStart}
        onChange={(e) => setStart(e.target.value)}
      />
      <DateInput
        testId="input-end"
        value={end}
        valid={validEnd}
        disabled={disabledEnd}
        onChange={(e) => setEnd(e.target.value)}
      />
      <Button
        data-testid="button-book"
        disabled={!bookable}
        onClick={handleBook}
      >
        Book
      </Button>
    </VFlex>
  )
}, 'FlightBooker')

class DateInput extends Component<{
  testId: string
  value: string
  valid: boolean
  disabled?: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
}> {
  render() {
    const { value, valid, disabled, onChange, testId } = this.props
    const d = disabled != null && disabled
    return (
      <TextInput
        data-testid={testId}
        value={value}
        disabled={d}
        className={cx(!valid && !d ? 'bg-coral' : undefined)}
        onChange={onChange}
      />
    )
  }
}
