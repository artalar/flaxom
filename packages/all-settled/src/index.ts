import { takeNested } from '@reatom/effects'

console.warn(
  'This package is outdated and will be removed soon, `all-settled` is `takeNested` now and part of the [effects](https://www.reatom.dev/package/effects) package',
)

export const allSettled = takeNested
