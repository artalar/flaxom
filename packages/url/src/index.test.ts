import { describe, test, expect, vi } from 'vitest'
import { createTestCtx, mockFn } from '@reatom/testing'
import { searchParamsAtom, setupUrlAtomSettings, updateFromSource, urlAtom } from './'

describe('URL Atom Tests', () => {
  test('direct updateFromSource call should be ignored', async () => {
    const ctx = createTestCtx()

    const sync = mockFn()
    setupUrlAtomSettings(ctx, () => new URL('http://example.com'), sync)
    ctx.get(urlAtom)

    expect(sync.calls.length).toBe(0)
    searchParamsAtom.set(ctx, 'test', '1')
    expect(sync.calls.length).toBe(1)
    expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=1')

    const un = urlAtom.onChange(async (ctx) => {
      un()
      await null
      searchParamsAtom.set(ctx, 'test', '3')
    })

    const url = new URL(ctx.get(urlAtom))
    url.searchParams.set('test', '2')
    updateFromSource(ctx, url)
    expect(sync.calls.length).toBe(1)
    expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=2')
    await null
    expect(sync.calls.length).toBe(2)
    expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=3')
  })

  test('SearchParamsAtom.lens', () => {
    const ctx = createTestCtx()

    setupUrlAtomSettings(ctx, () => new URL('http://example.com'))
    const testAtom = searchParamsAtom.lens('test', (value = '1') => Number(value))

    testAtom(ctx, 2)
    expect(ctx.get(testAtom)).toBe(2)
    expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=2')

    testAtom(ctx, 3)
    expect(ctx.get(urlAtom).href).toBe('http://example.com/?test=3')

    urlAtom.go(ctx, '/path')
    expect(ctx.get(testAtom)).toBe(1)
    expect(ctx.get(urlAtom).href).toBe('http://example.com/path')
  })
})
