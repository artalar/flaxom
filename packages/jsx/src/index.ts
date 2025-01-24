import { action, Atom, AtomMut, createCtx, Ctx, Fn, isAtom, Rec, throwReatomError, Unsubscribe } from '@reatom/core'
import { isObject, random } from '@reatom/utils'
import { type LinkedList, type LLNode, isLinkedListAtom, LL_NEXT } from '@reatom/primitives'
import type { JSX } from './jsx'

declare type JSXElement = JSX.Element

export type FC<Props = {}> = (props: Props & { children?: JSXElement }) => JSXElement

export type { JSXElement, JSX }

export { type ClassNameValue, cn } from './utils'

type DomApis = Pick<
  typeof window,
  'document' | 'Node' | 'Text' | 'Element' | 'MutationObserver' | 'HTMLElement' | 'DocumentFragment'
>

/**
 * @see https://github.com/preactjs/preact/blob/d16a34e275e31afd6738a9f82b5ba2fb9dbf032b/src/diff/props.js#L107
 * @see https://www.measurethat.net/Benchmarks/Show/7818
 */
const propertiesAsAttribute = new Set([
  'width',
  'height',
  'href',
  'list',
  'form',
  /** Default value in browsers is `-1` and an empty string is cast to `0` instead */
  'tabIndex',
  'download',
  'rowSpan',
  'colSpan',
  'role',
  'popover',
])

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
      while (parent.parentElement && !unsubscribesMap.get(parent)?.push(() => parent.isConnected || un())) {
        parent = parent.parentElement
      }
    }
  })
}

const walkLinkedList = (ctx: Ctx, el: JSX.Element, list: Atom<LinkedList<LLNode<JSX.Element>>>) => {
  let lastVersion = -1
  unlink(
    el,
    ctx.subscribe(list, (state) => {
      if (state.version - 1 > lastVersion) {
        el.innerHTML = ''
        for (let { head } = state; head; head = head[LL_NEXT]) {
          el.append(head)
        }
      } else {
        for (const change of state.changes) {
          if (change.kind === 'create') {
            el.append(change.node)
          }
          if (change.kind === 'remove') {
            el.removeChild(change.node)
          }
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
    }),
  )
}

export const reatomJsx = (ctx: Ctx, DOM: DomApis = globalThis.window, options?: {
  /**
   * Adds a style element containing styles from the `css` property to the document.
   * @default true
   */
  appendStylesheet?: boolean
}) => {
  let name = ''

  /** @see https://www.measurethat.net/Benchmarks/Show/33272 */
  let styles: Rec<string> = {}
  let stylesheet: HTMLStyleElement = DOM.document.createElement('style')
  stylesheet.id = 'reatom-jsx-styles'
  if (options?.appendStylesheet !== false) DOM.document.head.appendChild(stylesheet)

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
      let styleId = styles[val]
      if (!styleId) {
        styleId = styles[val] = `${name ? name + '_' : ''}${random(0, 1e6).toString()}`
        stylesheet.innerText += '[data-reatom="' + styleId + '"]{' + val + '}\n'
      }
      /** @see https://measurethat.net/Benchmarks/Show/11819 */
      element.setAttribute('data-reatom', styleId)
    } else if (key === 'style' && typeof val === 'object') {
      for (const key in val) {
        if (val[key] == null) element.style.removeProperty(key)
        else element.style.setProperty(key, val[key])
      }
    } else if (
      !propertiesAsAttribute.has(key)
      && element instanceof DOM.HTMLElement
      && (key in element || key === 'class')
    ) {
      if (key === 'class') key = 'className'
      // @ts-ignore
      element[key] = val == null ? '' : val
    } else {
      if (key === 'className') key = 'class'
      if (key.startsWith('attr:')) key = key.slice(5)

      /**
       * @note aria- and data- attributes have no boolean representation.
		   * A `false` value is different from the attribute not being
		   * present, so we can't remove it. For non-boolean aria
		   * attributes we could treat false as a removal, but the
		   * amount of exceptions would cost too many bytes. On top of
		   * that other frameworks generally stringify `false`.
       */
      if (val == null || (val === false && key[4] !== '-')) element.removeAttribute(key)
      else element.setAttribute(key, key == 'popover' && val == true ? '' : val)
    }
  }

  const walkAtom = (ctx: Ctx, anAtom: Atom<JSX.ElementPrimitiveChildren>): DocumentFragment => {
    const fragment = DOM.document.createDocumentFragment()
    const target = DOM.document.createComment(anAtom.__reatom.name ?? '')
    fragment.append(target)

    let childNodes: ChildNode[] = []
    const un = ctx.subscribe(anAtom, (v): void => {
      childNodes.forEach((node) => node.remove())

      if (v instanceof DOM.Node) {
        childNodes = v instanceof DOM.DocumentFragment ? [...v.childNodes] : [v as ChildNode]
        target.after(v)
      } else if (isSkipped(v)) {
        childNodes = []
      } else {
        const node = DOM.document.createTextNode(String(v))
        childNodes = [node]
        target.after(node)
      }
    })

    if (!unsubscribesMap.get(target)) unsubscribesMap.set(target, [])
    unlink(target, un)

    return fragment
  }

  let h = (tag: any, props: Rec, ...children: any[]) => {
    if (isAtom(tag)) {
      return walkAtom(ctx, tag)
    }

    if (tag === hf) {
      const fragment = DOM.document.createDocumentFragment()
      children = children.map((child) => isAtom(child) ? walkAtom(ctx, child) : child)
      fragment.append(...children)
      return fragment
    }

    props ??= {}

    if (typeof tag === 'function') {
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

    if ('children' in props) children = props.children

    let element: JSX.Element = tag.startsWith('svg:')
      ? DOM.document.createElementNS('http://www.w3.org/2000/svg', tag.slice(4))
      : DOM.document.createElement(tag)

    for (let k in props) {
      if (k !== 'children') {
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
              ;(prop as AtomMut)(ctx, name === 'valueAsNumber' ? +event.target.value : event.target[name])
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
          walkLinkedList(ctx, element, child)
        } else if (isAtom(child)) {
          const fragment = walkAtom(ctx, child)
          element.append(fragment)
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
    target.append(...[child].flat(Infinity))

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
