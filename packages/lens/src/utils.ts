import { Atom } from '@reatom/core'

export const mapName = (
  { __reatom: proto }: Atom,
  operator: string,
  name?: string,
) => name ?? `${proto.name}.${operator}`
