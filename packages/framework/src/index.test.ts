import { test, expect } from 'vitest'

import * as async from '@reatom/async'
import * as core from '@reatom/core'
import * as effects from '@reatom/effects'
import * as hooks from '@reatom/hooks'
import * as lens from '@reatom/lens'
import * as logger from '@reatom/logger'
import * as primitives from '@reatom/primitives'
import * as utils from '@reatom/utils'

test('base API', async () => {
  const packages = [async, core, effects, hooks, lens, logger, primitives, utils]

  const allExports = packages
    .reduce((acc, v) => [...acc, ...Object.keys(v)], new Array<string>())
    .filter((name) => name !== 'default')

  expect(allExports).toEqual([...new Set(allExports)])
})
