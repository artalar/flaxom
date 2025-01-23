import { AtomCache, AtomProto } from '@reatom/framework'

export const getColor = ({ proto }: AtomCache): string =>
  proto.isAction
    ? proto.name!.endsWith('.onFulfill')
      ? '#e6ab73'
      : proto.name!.endsWith('.onReject')
      ? '#e67373'
      : '#ffff80'
    : '#151134'

export const getStartCause = (cause: AtomCache): AtomCache =>
  cause.cause?.cause == null ? cause : getStartCause(cause.cause)

const idxMap = new WeakMap<AtomCache, string>()
let idx = 0
export const getId = (node: AtomCache) => {
  let id = idxMap.get(node)
  if (!id) {
    idxMap.set(node, (id = `${node.proto.name}-${++idx}`))
  }
  return id
}

export const followingsMap = new (class extends Map<AtomCache, Array<AtomCache>> {
  add(patch: AtomCache) {
    while (patch.cause?.cause) {
      let followings = this.get(patch.cause)
      if (!followings) {
        this.set(patch.cause, (followings = []))
      }
      followings.push(patch)
      patch = patch.cause
    }
  }
})()

export const highlighted = new Set<AtomCache>()

export const actionsStates = new WeakMap<AtomCache, Array<any>>()

export const history = new (class extends WeakMap<AtomProto, Array<AtomCache>> {
  add(patch: AtomCache) {
    let list = this.get(patch.proto)
    if (!list) {
      list = []
      this.set(patch.proto, list)
    } else {
      if (list.length > 6) list.pop()
    }
    list.unshift(patch)
  }
})()
