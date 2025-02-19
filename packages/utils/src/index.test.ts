import { describe, test, expect } from 'vitest'

import { isDeepEqual, toAbortError, toStringKey, mockRandom } from './'

describe('Utility Functions Tests', () => {
  test('isDeepEqual Set', () => {
    expect(
      isDeepEqual(new Set([{ a: 1 }, { a: 2 }]), new Set([{ a: 1 }, { a: 2 }])),
    ).toBe(true)
    expect(
      isDeepEqual(new Set([{ a: 1 }, { a: 2 }]), new Set([{ a: 2 }, { a: 1 }])),
    ).toBe(false)
  })

  test('isDeepEqual Map', () => {
    expect(
      isDeepEqual(
        new Map([[{ a: 1 }, 1], [{ a: 2 }, 2]]) /* prettier-ignore */,
        new Map([[{ a: 1 }, 1], [{ a: 2 }, 2]]) /* prettier-ignore */,
      ),
    ).toBe(true)
    expect(
      isDeepEqual(
        new Map([[{ a: 1 }, 1], [{ a: 2 }, 2]]) /* prettier-ignore */,
        new Map([[{ a: 2 }, 2], [{ a: 1 }, 1]]) /* prettier-ignore */,
      ),
    ).toBe(false)
    expect(
      isDeepEqual(
        new Map([[{ a: 1 }, 1], [{ a: 2 }, 2]]) /* prettier-ignore */,
        new Map([[{ a: 1 }, 1], [{ a: 2 }, 2]]) /* prettier-ignore */,
      ),
    ).toBe(true)
    expect(
      isDeepEqual(
        new Map([[1, { a: 1 }], [2, { a: 2 }]]) /* prettier-ignore */,
        new Map([[2, { a: 2 }], [1, { a: 1 }]]) /* prettier-ignore */,
      ),
    ).toBe(false)
    expect(
      isDeepEqual(
        new Map([[1, { a: 1 }], [2, { a: 2 }]]) /* prettier-ignore */,
        new Map([[1, { a: 1 }], [2, { a: 2 }]]) /* prettier-ignore */,
      ),
    ).toBe(true)
  })

  test('toAbortError', () => {
    const err = new Error('test')
    const abortErr = toAbortError(err)
    expect(abortErr.name).toBe('AbortError')
    expect(abortErr.message).toBe('test')
    expect(abortErr.cause).toBe(err)
  })

  test('toStringKey', () => {
    const CLASS = new AbortController()

    const obj: Record<string, any> = {}
    obj.obj = obj
    obj.class = { CLASS, class: { CLASS } }
    obj.list = [
      Object.create(null),
      undefined,
      false,
      true,
      0,
      '0',
      Symbol('0'),
      Symbol.for('0'),
      0n,
      () => 0,
      new Map([['key', 'val']]),
      Object.assign(new Date(0), {
        toString(this: Date) {
          return this.toISOString()
        },
      }),
      /regexp/,
    ]

    const target = `[reatom Object#1][reatom Array#2][reatom string]class[reatom Object#3][reatom Array#4][reatom string]class[reatom Object#5][reatom Array#6][reatom string]CLASS[reatom AbortController#7][reatom Array#8][reatom string]CLASS[reatom AbortController#7][reatom Array#9][reatom string]list[reatom Array#10][reatom Object#11][reatom undefined]undefined[reatom boolean]false[reatom boolean]true[reatom number]0[reatom string]0[reatom Symbol]0[reatom Symbol]0[reatom bigint]0[reatom Function#12][reatom Map#13][reatom Array#14][reatom string]key[reatom string]val[reatom object]1970-01-01T00:00:00.000Z[reatom object]/regexp/[reatom Array#15][reatom string]obj[reatom Object#1]`

    let i = 1
    const unmock = mockRandom(() => i++)

    expect(toStringKey(obj)).toBe(target)
    expect(toStringKey(obj)).toBe(toStringKey(obj))

    unmock()
    expect(toStringKey(obj)).toBe(toStringKey(obj))
  })
})
