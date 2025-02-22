import {
  type Atom,
  type Action,
  type Ctx,
  type Rec,
  atom,
  action,
  type Fn,
  throwReatomError,
  __count,
  isAtom,
} from '@reatom/core'
import { isObject } from '@reatom/utils'

type State<T> = T extends Atom<infer Value> ? Value : T

const readonly = <T extends Atom>(
  anAtom: T,
): {
  [K in keyof T]: T[K]
} => ({
  ...anAtom,
})

export const LL_PREV = Symbol('Reatom linked list prev')
export const LL_NEXT = Symbol('Reatom linked list next')

/** Linked List is reusing the model reference to simplify the reference sharing and using it as a key of LL methods.
 * Btw, symbols works fine with serialization and will not add a garbage to an output.
 */
export type LLNode<T extends Rec = Rec> = T & {
  [LL_PREV]: null | LLNode<T>
  [LL_NEXT]: null | LLNode<T>
}

type LLChanges<Node extends LLNode> =
  | { kind: 'create'; node: Node }
  | { kind: 'remove'; node: Node }
  | { kind: 'swap'; a: Node; b: Node }
  | { kind: 'move'; node: Node; after: null | Node }
  | { kind: 'clear' }

export interface LinkedList<Node extends LLNode = LLNode> {
  head: null | Node
  tail: null | Node
  size: number
  version: number
  changes: Array<LLChanges<Node>>
}

export interface LinkedListLikeAtom<T extends LinkedList = LinkedList>
  extends Atom<T> {
  __reatomLinkedList: true

  array: Atom<Array<T extends LinkedList<infer LLNode> ? LLNode : never>>
}

export interface LinkedListAtom<
  Params extends any[] = any[],
  Node extends Rec = Rec,
  Key extends keyof Node = never,
> extends LinkedListLikeAtom<LinkedList<LLNode<Node>>> {
  batch: Action<[cb: Fn]>

  create: Action<Params, LLNode<Node>>
  remove: Action<[LLNode<Node>], boolean>
  swap: Action<[a: LLNode<Node>, b: LLNode<Node>], void>
  move: Action<[node: LLNode<Node>, after: null | LLNode<Node>], void>
  clear: Action<[], void>

  find: (ctx: Ctx, cb: (node: LLNode<Node>) => boolean) => null | LLNode<Node>

  /** This lazy map is useful for working with serializable identifier,
   * but it is not recommended to use it for large (thousands elements) lists */
  map: Key extends never ? never : Atom<Map<State<Node[Key]>, LLNode<Node>>>

  linkedList: (initState: Array<Node>) => LinkedList<LLNode<Node>>

  reatomMap: <T extends Rec>(
    cb: (ctx: Ctx, node: LLNode<Node>) => T,
    options?:
      | string
      | {
          name?: string
          onCreate?: (ctx: Ctx, node: LLNode<T>) => void
          onRemove?: (ctx: Ctx, node: LLNode<T>, origin: LLNode<Node>) => void
          onSwap?: (ctx: Ctx, payload: { a: LLNode<T>; b: LLNode<T> }) => void
          onMove?: (ctx: Ctx, node: LLNode<T>) => void
          onClear?: (
            ctx: Ctx,
            lastState: LinkedListDerivedState<LLNode<Node>, LLNode<T>>,
          ) => void
        },
  ) => LinkedListDerivedAtom<LLNode<Node>, LLNode<T>>

  // reatomFilter: (
  //   cb: (ctx: CtxSpy, node: Node) => any,
  //   name?: string,
  // ) => Atom<ListType<Node>>

  // reatomReduce: <T>(
  //   options: {
  //     init: T
  //     add: (ctx: CtxSpy, acc: T, node: LLNode<Node>) => T
  //     del: (ctx: Ctx, acc: T, node: LLNode<Node>) => T
  //   },
  //   name?: string,
  // ) => Atom<T>
}

// TODO rename to `DerivedLinkedList`
export interface LinkedListDerivedState<Node extends LLNode, T extends LLNode>
  extends LinkedList<T> {
  map: WeakMap<Node, T>
}

export interface LinkedListDerivedAtom<Node extends LLNode, T extends LLNode>
  extends LinkedListLikeAtom<LinkedListDerivedState<Node, T>> {}

const addLL = <Node extends LLNode>(
  state: LinkedList<Node>,
  node: Node | Omit<Node, keyof LLNode>,
  after: null | Node,
) => {
  if (node === after) return

  if (after) {
    // updateLL(node as Node, after, after[LL_PREV])
    ;(node as Node)[LL_PREV] = after
    ;(node as Node)[LL_NEXT] = after[LL_NEXT]
    after[LL_NEXT] = node as Node
    if (state.tail === after) {
      state.tail = node as Node
    }
  } else {
    ;(node as Node)[LL_PREV] = null
    ;(node as Node)[LL_NEXT] = state.head
    if (state.head) {
      state.head[LL_PREV] = node as Node
    }
    if (!state.tail) {
      state.tail = node as Node
    }
    state.head = node as Node
  }
  state.size++
}

const removeLL = <Node extends LLNode>(state: LinkedList<Node>, node: Node) => {
  if (state.head === node) {
    state.head = node[LL_NEXT] as Node
  } else if (node[LL_PREV] !== null) {
    node[LL_PREV][LL_NEXT] = node[LL_NEXT]
  }

  if (state.tail === node) {
    state.tail = node[LL_PREV] as Node
  } else if (node[LL_NEXT] !== null) {
    node[LL_NEXT][LL_PREV] = node[LL_PREV]
  }

  node[LL_PREV] = null
  node[LL_NEXT] = null

  state.size--
}

const swapLL = <Node extends LLNode>(
  state: LinkedList<Node>,
  a: Node,
  b: Node,
): void => {
  if (a === b) return

  // If b is the head, swap a and b to make a the head
  if (state.head === b) return swapLL(state, b, a)

  const prevA = a[LL_PREV]
  const nextA = a[LL_NEXT]
  const prevB = b[LL_PREV]
  const nextB = b[LL_NEXT]

  // Check if they are adjacent
  if (nextA === b) {
    // a is before b
    a[LL_NEXT] = nextB
    b[LL_PREV] = prevA
    b[LL_NEXT] = a
    a[LL_PREV] = b

    if (nextB) nextB[LL_PREV] = a
    if (prevA) prevA[LL_NEXT] = b
  } else if (nextB === a) {
    // b is before a
    b[LL_NEXT] = nextA
    a[LL_PREV] = prevB
    a[LL_NEXT] = b
    b[LL_PREV] = a

    if (nextA) nextA[LL_PREV] = b
    if (prevB) prevB[LL_NEXT] = a
  } else {
    // Non-adjacent nodes, just swap them
    if (prevA) prevA[LL_NEXT] = b
    if (nextA) nextA[LL_PREV] = b
    if (prevB) prevB[LL_NEXT] = a
    if (nextB) nextB[LL_PREV] = a

    a[LL_PREV] = prevB
    a[LL_NEXT] = nextB
    b[LL_PREV] = prevA
    b[LL_NEXT] = nextA
  }

  // Update head and tail pointers if necessary
  if (state.head === a) {
    state.head = b
  } else if (state.head === b) {
    state.head = a
  }

  if (state.tail === a) {
    state.tail = b
  } else if (state.tail === b) {
    state.tail = a
  }
}

const moveLL = <Node extends LLNode>(
  state: LinkedList<Node>,
  node: Node,
  after: null | Node,
) => {
  removeLL(state, node)
  addLL(state, node, after)
}

const clearLL = <Node extends LLNode>(state: LinkedList<Node>) => {
  while (state.tail) removeLL(state, state.tail)
}

const toArray = <T extends Rec>(
  head: null | LLNode<T>,
  prev?: Array<LLNode<T>>,
): Array<LLNode<T>> => {
  let arr: Array<LLNode<T>> = []
  let i = 0
  while (head) {
    if (prev !== undefined && prev[i] !== head) prev = undefined
    arr.push(head)
    head = head[LL_NEXT]
    i++
  }
  return arr.length === prev?.length ? prev : arr
}

export const reatomLinkedList = <
  Params extends any[],
  Node extends Rec,
  Key extends keyof Node = never,
>(
  options:
    | ((ctx: Ctx, ...params: Params) => Node)
    | {
        create: (ctx: Ctx, ...params: Params) => Node
        initState?: Array<Node>
        key?: Key
      },
  name = __count('reatomLinkedList'),
): LinkedListAtom<Params, Node, Key> => {
  const {
    create: userCreate,
    initState = [],
    key = undefined,
  } = typeof options === 'function' ? { create: options } : options
  const _name = name

  const isLL = (node: Node): node is LLNode<Node> =>
    !!node && LL_NEXT in node && LL_PREV in node

  const throwModel = (node: Node) =>
    throwReatomError(isLL(node), 'The data is already in a linked list.')
  const throwNotModel = (node: Node) =>
    throwReatomError(!isLL(node), 'The passed data is not a linked list node.')

  // for batching
  let STATE: null | LinkedList<LLNode<Node>> = null

  const linkedList = atom(STATE!, name)
  linkedList.__reatom.initState = () => {
    try {
      return createLinkedList(initState)
    } finally {
      STATE = null
    }
  }

  const createLinkedList = (initState: Node[]): LinkedList<LLNode<Node>> => {
    const state = {
      size: 0,
      version: 1,
      changes: [],
      head: null,
      tail: null,
    }

    for (const node of initState) {
      throwModel(node)
      addLL(state, node, state.tail)
    }

    return state;
  }

  const batchFn = <T>(ctx: Ctx, cb: Fn<[Ctx], T>): T => {
    if (STATE) return cb(ctx)

    STATE = linkedList(ctx, ({ head, tail, size, version }) => ({
      size,
      version: version + 1,
      changes: [],
      head,
      tail,
    }))

    try {
      return cb(ctx)
    } finally {
      STATE = null
    }
  }

  const batch = action(batchFn, `${name}._batch`)

  const create = action((ctx, ...params: Params): LLNode<Node> => {
    return batchFn(ctx, () => {
      const node = userCreate(ctx, ...params) as LLNode<Node>

      throwReatomError(
        !isObject(node) && typeof node !== 'function',
        `reatomLinkedList can operate only with objects or functions, received "${node}".`,
      )
      throwModel(node)

      addLL(STATE!, node, STATE!.tail)

      STATE!.changes.push({ kind: 'create', node })

      return node
    })
  }, `${name}.create`)

  const remove = action((ctx, node: LLNode<Node>): boolean => {
    return batchFn(ctx, () => {
      throwNotModel(node)

      if (
        node[LL_PREV] === null &&
        node[LL_NEXT] === null &&
        STATE!.tail !== node
      )
        return false

      removeLL(STATE!, node)

      STATE!.changes.push({ kind: 'remove', node })

      return true
    })
  }, `${name}.remove`)

  const swap = action((ctx, a: LLNode<Node>, b: LLNode<Node>): void => {
    return batchFn(ctx, () => {
      throwNotModel(a)
      throwNotModel(b)

      if (a === b) return

      swapLL(STATE!, a, b)

      STATE!.changes.push({ kind: 'swap', a, b })
    })
  }, `${name}.swap`)

  const move = action(
    (ctx, node: LLNode<Node>, after: null | LLNode<Node>): void => {
      return batchFn(ctx, () => {
        throwNotModel(node)

        moveLL(STATE!, node, after)

        STATE!.changes.push({ kind: 'move', node, after })
      })
    },
    `${name}.move`,
  )

  const clear = action((ctx): void => {
    return batchFn(ctx, () => {
      clearLL(STATE!)

      STATE!.changes.push({ kind: 'clear' })
    })
  }, `${name}.clear`)

  const find = (
    ctx: Ctx,
    cb: (node: LLNode<Node>) => boolean,
  ): null | LLNode<Node> => {
    for (let { head } = ctx.get(linkedList); head; head = head[LL_NEXT]) {
      if (cb(head)) return head
    }
    return null
  }

  const array: LinkedListAtom<Params, Node, Key>['array'] = atom(
    (ctx, state: Array<LLNode<Node>> = []) =>
      toArray(ctx.spy(linkedList).head, state),
    `${name}.array`,
  )

  const map = key
    ? (atom(
        (ctx) =>
          new Map(
            // use array as it already memoized and simplifies the order tracking
            ctx.spy(array).map((node) => {
              const keyValue = node[key]
              return [
                isAtom(keyValue) ? ctx.spy(keyValue) : keyValue,
                node,
              ] as const
            }),
          ),
      ) as LinkedListAtom<Params, Node, Key>['map'])
    : (undefined as never)

  const reatomMap = <T extends Rec>(
    cb: (ctx: Ctx, node: LLNode<Node>) => T,
    options:
      | string
      | {
          name?: string
          onCreate?: (ctx: Ctx, node: LLNode<T>) => void
          onRemove?: (ctx: Ctx, node: LLNode<T>, origin: LLNode<Node>) => void
          onSwap?: (ctx: Ctx, payload: { a: LLNode<T>; b: LLNode<T> }) => void
          onMove?: (ctx: Ctx, node: LLNode<T>) => void
          onClear?: (
            ctx: Ctx,
            lastState: LinkedListDerivedState<LLNode<Node>, LLNode<T>>,
          ) => void
        } = {},
  ): LinkedListDerivedAtom<LLNode<Node>, LLNode<T>> => {
    const { name = __count(`${_name}.reatomMap`), ...hooks } =
      typeof options === 'string' ? { name: options } : options

    type State = LinkedListDerivedState<LLNode<Node>, LLNode<T>>

    const mapList = atom((ctx, mapList?: State): State => {
      throwReatomError(
        STATE,
        `Can't compute the map of the linked list inside the batching.`,
      )

      const ll = ctx.spy(linkedList)

      if (
        !mapList ||
        /* some update was missed */ ll.version - 1 > mapList.version
      ) {
        if (mapList) hooks.onClear?.(ctx, mapList)

        mapList = {
          size: ll.size,
          version: ll.version,
          changes: [],
          head: null,
          tail: null,
          map: new WeakMap(),
        }

        for (let head = ll.head; head; head = head[LL_NEXT]) {
          const node = cb(ctx, head) as LLNode<T>
          addLL(mapList, node, mapList.tail)
          mapList.map.set(head, node)
          hooks.onCreate?.(ctx, node)
        }
        // cover extra size changes from `addLL`
        mapList.size = ll.size
      } else {
        mapList = {
          head: mapList.head,
          tail: mapList.tail,
          size: mapList.size,
          version: ll.version,
          changes: [],
          map: mapList.map,
        }

        for (const change of ll.changes) {
          switch (change.kind) {
            case 'create': {
              const node = cb(ctx, change.node) as LLNode<T>
              addLL(mapList, node, mapList.tail)
              mapList.map.set(change.node, node)
              mapList.changes.push({ kind: 'create', node })
              hooks.onCreate?.(ctx, node)
              break
            }
            case 'remove': {
              const node = mapList.map.get(change.node)!
              removeLL(mapList, node)
              mapList.map.delete(change.node)
              mapList.changes.push({ kind: 'remove', node })
              hooks.onRemove?.(ctx, node, change.node)
              break
            }
            case 'swap': {
              const a = mapList.map.get(change.a)!
              const b = mapList.map.get(change.b)!
              swapLL(mapList, a, b)
              mapList.changes.push({ kind: 'swap', a, b })
              hooks.onSwap?.(ctx, { a, b })
              break
            }
            case 'move': {
              const node = mapList.map.get(change.node)!
              const after = change.after ? mapList.map.get(change.after)! : null
              moveLL(mapList, node, after)
              mapList.changes.push({ kind: 'move', node, after })
              hooks.onMove?.(ctx, node)
              break
            }
            case 'clear': {
              hooks.onClear?.(ctx, mapList)
              clearLL(mapList)
              mapList.changes.push({ kind: 'clear' })
              break
            }
            default: {
              const kind: never = change
              const error = new Error(`Unhandled linked list change "${kind}"`)
              throw error
            }
          }
        }
      }

      throwReatomError(
        mapList.size !== ll.size,
        "Inconsistent linked list, is's a bug, please report an issue",
      )

      return mapList
    }, name)

    const array: LinkedListDerivedAtom<LLNode<Node>, LLNode<T>>['array'] = atom(
      (ctx, state: Array<LLNode<T>> = []) =>
        toArray(ctx.spy(mapList).head, state),
      `${name}.array`,
    )

    return Object.assign(mapList, { array, __reatomLinkedList: true as const })
  }

  // TODO there is a bug with `del` logic
  // const reatomReduce = <T>(
  //   {
  //     init,
  //     add,
  //     del,
  //   }: {
  //     init: T
  //     add: (ctx: CtxSpy, acc: T, node: LLNode<Node>) => T
  //     del: (ctx: Ctx, acc: T, node: LLNode<Node>) => T
  //   },
  //   name = __count(`${_name}.reatomReduce`),
  // ): Atom<T> => {
  //   const acc = atom(init, `${name}._acc`)
  //   const controllers = reatomMap(
  //     (ctx, node) =>
  //       atom(
  //         (ctx) => {
  //           acc(ctx, (state) =>
  //             add(
  //               ctx,
  //               /* is the first calc */ ctx.cause.listeners.size
  //                 ? del(ctx, state, node)
  //                 : state,
  //               node,
  //             ),
  //           )
  //         },
  //         __count(`${name}._controllers`),
  //       ).pipe(
  //         withAssign((target) => ({
  //           unsubscribe: ctx.subscribe(target, noop),
  //         })),
  //       ),
  //     {
  //       name: `${name}._controllers`,
  //       onRemove(ctx, node, origin) {
  //         acc(ctx, (state) => del(ctx, state, origin))
  //         node.unsubscribe()
  //       },
  //       onClear(ctx, mapList) {
  //         for (let head = mapList.head; head; head = head[LL_NEXT]) {
  //           head.unsubscribe()
  //         }
  //         acc(ctx, () => init)
  //       },
  //     },
  //   )

  //   onDisconnect(controllers, (ctx) => {
  //     for (let head = ctx.get(controllers).head; head; head = head[LL_NEXT]) {
  //       head.unsubscribe()
  //     }
  //   })

  //   return atom((ctx) => {
  //     ctx.spy(controllers)
  //     return ctx.spy(acc)
  //   }, name)
  // }

  return Object.assign(linkedList, {
    batch,
    create,
    remove,
    swap,
    move,
    clear,

    find,

    array,
    map,
    linkedList: createLinkedList,

    reatomMap,
    // reatomFilter,
    // reatomReduce,

    __reatomLinkedList: true as const,
  }).pipe(readonly)
}

export const isLinkedListAtom = (thing: any): thing is LinkedListLikeAtom =>
  thing?.__reatomLinkedList === true
