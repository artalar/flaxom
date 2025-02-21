import React from 'react'
import { Component } from 'react'
import { atom } from '@reatom/framework'
import { reatomComponent, useAtom } from '@reatom/npm-react'
import { Flex, Label, TextInput } from '~/basic'

function isNumeric(n: string): boolean {
  return !isNaN(parseFloat(n)) && isFinite(Number(n))
}

class TempConvPure extends Component<{
  testId: string
  celsius: string
  fahrenheit: string
  onChangeCelsius: React.ChangeEventHandler<HTMLInputElement>
  onChangeFahrenheit: React.ChangeEventHandler<HTMLInputElement>
}> {
  getBackground = (mine: string, other: string): string | undefined => {
    if (mine === '') return undefined
    if (!isNumeric(mine)) return 'coral'
    if (!isNumeric(other)) return 'lightgray'
    return undefined
  }

  render() {
    const { celsius, fahrenheit, onChangeCelsius, onChangeFahrenheit, testId } =
      this.props
    return (
      <Flex data-testid={testId} className="items-center">
        <TextInput
          data-testid="inputCelsius"
          style={{ background: this.getBackground(celsius, fahrenheit) }}
          value={celsius}
          onChange={onChangeCelsius}
        />
        <Label>Celsius = </Label>
        <TextInput
          data-testid="inputFahrenheit"
          style={{ background: this.getBackground(fahrenheit, celsius) }}
          value={fahrenheit}
          onChange={onChangeFahrenheit}
        />
        <Label>Fahrenheit</Label>
      </Flex>
    )
  }
}

export const TempConvManual = () => {
  const [celsius, setCelsius] = useAtom('')
  const [fahrenheit, setFahrenheit] = useAtom('')

  const handleChangeCelsius = React.useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >(
    (event) => {
      const value = event.currentTarget.value
      setCelsius(value)
      if (!isNumeric(value)) return
      const c = parseFloat(value)
      const nextFahrenheit = Math.round(c * (9 / 5) + 32).toString()
      setFahrenheit(nextFahrenheit)
    },
    [setCelsius, setFahrenheit],
  )

  const handleChangeFahrenheit = React.useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >(
    (event) => {
      const value = event.currentTarget.value
      setFahrenheit(value)
      if (!isNumeric(value)) return
      const f = parseFloat(value)
      const nextCelsius = Math.round((f - 32) * (5 / 9)).toString()
      setCelsius(nextCelsius)
    },
    [setFahrenheit, setCelsius],
  )

  return (
    <TempConvPure
      testId="TempConvManual"
      celsius={celsius}
      fahrenheit={fahrenheit}
      onChangeCelsius={handleChangeCelsius}
      onChangeFahrenheit={handleChangeFahrenheit}
    />
  )
}

const celsiusAtom = atom('', 'celsiusAtom')
const fahrenheitAtom = atom('', 'fahrenheitAtom')

celsiusAtom.onChange((ctx, value) => {
  if (!isNumeric(value)) return
  const c = parseFloat(value)
  fahrenheitAtom(ctx, Math.round(c * (9 / 5) + 32).toString())
})

fahrenheitAtom.onChange((ctx, value) => {
  if (!isNumeric(value)) return
  const f = parseFloat(value)
  celsiusAtom(ctx, Math.round((f - 32) * (5 / 9)).toString())
})

export const TempConvAuto = reatomComponent(({ ctx }) => {
  return (
    <TempConvPure
      testId="TempConvAuto"
      celsius={ctx.spy(celsiusAtom)}
      fahrenheit={ctx.spy(fahrenheitAtom)}
      onChangeCelsius={(e) => {
        celsiusAtom(ctx, e.target.value)
      }}
      onChangeFahrenheit={(e) => {
        fahrenheitAtom(ctx, e.target.value)
      }}
    />
  )
}, 'TempConvAuto')
