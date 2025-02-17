import { Atom, __count } from '@reatom/core'
import { assign } from '@reatom/utils'

export const withAssign =
  <Target extends Atom, Props extends object>(
    getProps: (target: Target, name: string) => Props,
  ) =>
  (target: Target) =>
    assign(target, getProps(target, target.__reatom.name!)) as Target & Props
