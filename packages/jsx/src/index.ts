import {
  action,
  Atom,
  AtomMut,
  createCtx,
  Ctx,
  Fn,
  isAtom,
  Rec,
  throwReatomError,
  Unsubscribe,
} from '@reatom/core'
import { noop, random } from '@reatom/utils'
import {
  type LinkedList,
  type LLNode,
  isLinkedListAtom,
  LL_NEXT,
} from '@reatom/primitives'
import type { AttributesAtomMaybe, JSX } from './jsx'

declare type JSXElement = JSX.Element

export type FC<Props = {}> = (
  props: Props & { children?: JSXElement },
) => JSXElement

export type { JSXElement, JSX }

export { type ClassNameValue, cn } from './utils'

type DomApis = Pick<
  typeof window,
  | 'document'
  | 'Node'
  | 'Text'
  | 'Element'
  | 'MutationObserver'
  | 'HTMLElement'
  | 'DocumentFragment'
>

const isSkipped = (value: unknown): value is boolean | '' | null | undefined =>
  typeof value === 'boolean' || value === '' || value == null

let unsubscribesMap = new WeakMap<Node, Array<Fn>>()
let unlink = (parent: Node, un: Unsubscribe) => {
  // check the connection in the next tick
  // to give the user (programmer) an ability
  // to put the created element in the dom
  Promise.resolve().then(() => {
    if (!parent.isConnected) un()
    else {
      while (
        parent.parentElement &&
        !unsubscribesMap.get(parent)?.push(() => parent.isConnected || un())
      ) {
        parent = parent.parentElement
      }
    }
  })
}

const walkLinkedList = (
  ctx: Ctx,
  DOM: DomApis,
  el: JSX.Element,
  list: Atom<LinkedList<LLNode<JSX.Element>>>,
) => {
  let lastVersion = -1

  const cb = (state: LinkedList<LLNode<JSX.Element>>) => {
    if (state.version - 1 > lastVersion) {
      el.innerHTML = ''
      for (let { head } = state; head; head = head[LL_NEXT]) {
        throwNativeFragment(head)
        el.append(head)
      }
    } else {
      for (const change of state.changes) {
        if (change.kind === 'create') {
          throwNativeFragment(change.node)
          el.append(change.node)
        }
        if (change.kind === 'remove') {
          if (isLiveFragment(change.node)) {
            const fragment = change.node.__reatomFragment
            fragment.update()
            fragment.start.remove()
            fragment.end.remove()
          } else {
            el.removeChild(change.node)
          }
        }
        // TODO support fragments
        if (change.kind === 'swap') {
          let [aNext, bNext] = [change.a.nextSibling, change.b.nextSibling]
          if (bNext) {
            el.insertBefore(change.a, bNext)
          } else {
            el.append(change.a)
          }

          if (aNext) {
            el.insertBefore(change.b, aNext)
          } else {
            el.append(change.b)
          }
        }
        // TODO support fragments
        if (change.kind === 'move') {
          if (change.after) {
            change.after.insertAdjacentElement('afterend', change.node)
          } else {
            el.append(change.node)
          }
        }
        if (change.kind === 'clear') {
          el.innerHTML = ''
        }
      }
    }
    lastVersion = state.version
  }

  // it's critical to not use not a last state, but the each state.
  const unSubscribe = ctx.subscribe(list, noop)
  const unChange = list.onChange((ctx, state) => cb(state))

  cb(ctx.get(list))

  unlink(el, () => {
    unSubscribe()
    unChange()
  })
}

type LiveDocumentFragment = DocumentFragment & {
  __reatomFragment: {
    start: Comment
    end: Comment
    update: (element?: JSX.ElementPrimitiveChildren) => void
  }
}

// TODO optimize
const isLiveFragment = (node: Node): node is LiveDocumentFragment => {
  return (
    String(node) === '[object DocumentFragment]' && '__reatomFragment' in node
  )
}
const throwNativeFragment = (element: JSX.Element) => {
  throwReatomError(
    String(element) === '[object DocumentFragment]' &&
      '__reatomFragment' in element === false,
    'native fragment is not supported',
  )
}

const createLiveFragment = (
  DOM: DomApis,
  name: string,
): LiveDocumentFragment => {
  const fragment = DOM.document.createDocumentFragment()
  const start = DOM.document.createComment(name)
  const end = start.cloneNode() as Comment
  fragment.append(start, end)

  const update = (element?: JSX.ElementPrimitiveChildren) => {
    while (start.nextSibling && start.nextSibling !== end) {
      start.nextSibling!.remove?.()
    }

    if (element instanceof DOM.Node) {
      start.after(element)
    } else if (!isSkipped(element)) {
      const node = isAtom(element)
        ? walkAtom(ctx, DOM, element)
        : DOM.document.createTextNode(String(element))
      start.after(node)
    }
  }

  return Object.assign(fragment, {
    __reatomFragment: {
      start,
      end,
      update,
    },
  })
}

const walkAtom = (
  ctx: Ctx,
  DOM: DomApis,
  anAtom: Atom<JSX.ElementPrimitiveChildren>,
): DocumentFragment => {
  const fragment = createLiveFragment(DOM, anAtom.__reatom.name!)

  const un = ctx.subscribe(anAtom, fragment.__reatomFragment.update)

  unsubscribesMap.set(fragment.__reatomFragment.start, [])
  unlink(fragment.__reatomFragment.start, un)

  return fragment
}

const patchStyleProperty = (
  style: CSSStyleDeclaration,
  key: string,
  value: any,
): void => {
  if (value == null) style.removeProperty(key)
  else style.setProperty(key, value)
}

export const reatomJsx = (
  ctx: Ctx,
  DOM: DomApis = globalThis.window,
  {
    stylesheetContainer = DOM.document.head,
  }: {
    /**
     * The container to which the styles will be added.
     * @default DOM.document.head
     */
    stylesheetContainer?: Node
  } = {},
) => {
  const styles: Rec<string> = {}
  const stylesheet = (
    config.stylesheetContainer ?? DOM.document.head
  ).appendChild(DOM.document.createElement('style'))
  let name = ''

  let set = (element: JSX.Element, key: string, val: any) => {
    if (key.startsWith('on:')) {
      key = key.slice(3)
      // only for logging purposes
      val = action(val, `${name}.${element.nodeName.toLowerCase()}._${key}`)
      element.addEventListener(key, (event) => val(ctx, event))
    } else if (key.startsWith('css:')) {
      key = '--' + key.slice(4)
      if (val == null) element.style.removeProperty(key)
      else element.style.setProperty(key, String(val))
    } else if (key === 'css') {
      stylesheet ??= DOM.document.getElementById(StylesheetId) as any
      if (!stylesheet) {
        stylesheet = DOM.document.createElement('style')
        stylesheet.id = StylesheetId
        stylesheetContainer.appendChild(stylesheet)
      }

      const prefix = name ? name + '_' : ''
      const styleKey = prefix + val
      let styleId = styles[styleKey]
      if (!styleId) {
        styleId = styles[styleKey] = prefix + random(0, 1e6).toString()
        stylesheet.innerText += '[data-reatom="' + styleId + '"]{' + val + '}\n'
      }
      /** @see https://measurethat.net/Benchmarks/Show/11819 */
      element.setAttribute('data-reatom', styleId)
    } else if (key === 'style' && typeof val === 'object') {
      for (const key in val) patchStyleProperty(element.style, key, val[key])
    } else if (key.startsWith('style:')) {
      key = key.slice(6)
      patchStyleProperty(element.style, key, val)
    } else if (key.startsWith('prop:')) {
      // @ts-expect-error
      element[key.slice(5)] = val
    } else {
      if (key.startsWith('attr:')) {
        key = key.slice(5)
      }
      if (key === 'className') key = 'class'
      if (val == null || val === false) element.removeAttribute(key)
      else {
        val = val === true ? '' : String(val)
        /**
         * @see https://measurethat.net/Benchmarks/Show/54
         * @see https://measurethat.net/Benchmarks/Show/31249
         */
        if (key === 'class' && element instanceof HTMLElement)
          element.className = val
        else element.setAttribute(key, val)
      }
    }
  }

  let h = (tag: any, props: Rec, ...children: any[]) => {
    if (isAtom(tag)) {
      return walkAtom(ctx, DOM, tag)
    }

    if (tag === hf) {
      // needed for `walkLinkedList`
      const fragment = createLiveFragment(DOM, '')
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        fragment.append(isAtom(child) ? walkAtom(ctx, DOM, child) : child)
      }
      fragment.append(fragment.__reatomFragment.end)
      return fragment
    }

    props ??= {}

    let element: JSX.Element

    if (typeof tag === 'function') {
      if (tag === Bind) {
        element = props.element
        props.element = undefined
      } else {
        if (children.length) {
          props.children = children
        }

        let _name = name
        try {
          name = tag.name
          return tag(props)
        } finally {
          name = _name
        }
      }
    } else {
      element = tag.startsWith('svg:')
        ? DOM.document.createElementNS(
            'http://www.w3.org/2000/svg',
            tag.slice(4),
          )
        : DOM.document.createElement(tag)
    }

    if ('children' in props) children = props.children

    for (let k in props) {
      if (k !== 'children' && k !== 'element') {
        let prop = props[k]
        if (k === 'ref') {
          ctx.schedule(() => {
            const cleanup = prop(ctx, element)
            if (typeof cleanup === 'function') {
              let list = unsubscribesMap.get(element)
              if (!list) unsubscribesMap.set(element, (list = []))
              unlink(element, () => cleanup(ctx, element))
            }
          })
        } else if (isAtom(prop) && !prop.__reatom.isAction) {
          if (k.startsWith('model:')) {
            let name = (k = k.slice(6)) as 'value' | 'valueAsNumber' | 'checked'
            set(element, 'on:input', (ctx: Ctx, event: any) => {
              ;(prop as AtomMut)(
                ctx,
                name === 'valueAsNumber'
                  ? +event.target.value
                  : event.target[name],
              )
            })
            if (k === 'valueAsNumber') {
              k = 'value'
              set(element, 'type', 'number')
            }
            if (k === 'checked') {
              set(element, 'type', 'checkbox')
            }
            k = 'prop:' + k
          }
          // TODO handle unsubscribe!
          let un: undefined | Unsubscribe
          un = ctx.subscribe(prop, (v) =>
            !un || element.isConnected
              ? k === '$spread'
                ? Object.entries(v).forEach(([k, v]) => set(element, k, v))
                : set(element, k, v)
              : un(),
          )

          unlink(element, un)
        } else {
          set(element, k, prop)
        }
      }
    }

    /**
     * @todo Explore adding elements to a DocumentFragment before adding them to a Document.
     * @see https://www.measurethat.net/Benchmarks/Show/13274
     */
    let walk = (child: JSX.DOMAttributes<JSX.Element>['children']) => {
      if (Array.isArray(child)) {
        for (let i = 0; i < child.length; i++) walk(child[i])
      } else {
        if (isLinkedListAtom(child)) {
          walkLinkedList(ctx, DOM, element, child)
        } else if (isAtom(child)) {
          element.append(walkAtom(ctx, DOM, child))
        } else if (!isSkipped(child)) {
          element.append(child as Node | string)
        }
      }
    }

    for (let i = 0; i < children.length; i++) {
      walk(children[i])
    }

    return element
  }

  /**
   * Fragment.
   * @todo Describe a function as a component.
   */
  let hf = () => {}

  let mount = (target: Element, child: Element) => {
    // TODO fix
    // target.append(...[child].flat(Infinity))
    target.append(child)

    new DOM.MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        for (let removedNode of mutation.removedNodes) {
          /**
           * @see https://stackoverflow.com/a/64551276
           * @note A custom NodeFilter function slows down performance by 1.5 times.
           */
          const walker = DOM.document.createTreeWalker(removedNode, 1 | 128)

          do {
            const node = walker.currentNode as Element
            unsubscribesMap.get(node)?.forEach((fn) => fn())
            unsubscribesMap.delete(node)
          } while (walker.nextNode())
        }
      }
    }).observe(target.parentElement!, {
      childList: true,
      subtree: true,
    })
  }

  return { h, hf, mount }
}

export const ctx = createCtx()
export const { h, hf, mount } = reatomJsx(ctx)

/**
 * This simple utility needed only for syntax highlighting and it just concatenates all passed strings.
 * Falsy values are ignored, except for `0`.
 */
export const css = (strings: TemplateStringsArray, ...values: any[]) => {
  let result = ''
  for (let i = 0; i < strings.length; i++) {
    result += strings[i] + (values[i] || values[i] === 0 ? values[i] : '')
  }
  return result
}

export const Bind = <T extends Element>(
  props: { element: T } & AttributesAtomMaybe<
    Partial<Omit<T, 'children'>> & JSX.DOMAttributes<T>
  >,
): T => props.element
