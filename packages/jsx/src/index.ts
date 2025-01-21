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

const isSkipped = (value: unknown): value is boolean | '' | null | undefined =>
  typeof value === 'boolean' || value === '' || value == null

let unsubscribesMap = new WeakMap<Element, Array<Fn>>()
let unlink = (parent: JSX.Element, un: Unsubscribe) => {
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

export const reatomJsx = (ctx: Ctx, DOM: DomApis = globalThis.window) => {
  const StylesheetId = 'reatom-jsx-styles'
  let styles: Rec<string> = {}
  let stylesheet: HTMLStyleElement | undefined
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
        DOM.document.head.appendChild(stylesheet)
      }

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
        if (key === 'class' && element instanceof HTMLElement) element.className = val
        else element.setAttribute(key, val)
      }
    }
  }

  let h = (tag: any, props: Rec, ...children: any[]) => {
    if (tag === hf) return children

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

    let walk = (child: JSX.DOMAttributes<JSX.Element>['children']) => {
      if (Array.isArray(child)) {
        for (let i = 0; i < child.length; i++) walk(child[i])
      } else {
        if (isLinkedListAtom(child)) {
          walkLinkedList(ctx, element, child)
        } else if (isAtom(child)) {
          let innerChild = DOM.document.createTextNode('') as ChildNode | DocumentFragment
          let error: any
          var un: undefined | Unsubscribe = ctx.subscribe(child, (v): void => {
            try {
              if (un && !innerChild.isConnected && innerChild instanceof DOM.DocumentFragment === false) {
                un()
              } else {
                throwReatomError(
                  Array.isArray(v) && children.length > 1,
                  'array children with other children are not supported',
                )

                if (v instanceof DOM.Element) {
                  let list = unsubscribesMap.get(v)
                  if (!list) unsubscribesMap.set(v, (list = []))

                  if (un) element.replaceChild(v, innerChild)
                  innerChild = v
                } else if (Array.isArray(v)) {
                  if (un) element.replaceChildren(...v)
                  else {
                    const fragment = new DOM.DocumentFragment()
                    v.forEach((el) => fragment.append(el))
                    innerChild = fragment
                  }
                } else {
                  // TODO more tests
                  innerChild.textContent = isSkipped(v) ? '' : String(v)
                }
              }
            } catch (e) {
              error = e
            }
          })
          if (error) throw error
          unlink(element, un)
          element.appendChild(innerChild)
        } else if (!isSkipped(child)) {
          element.appendChild(
            isObject(child) && 'nodeType' in child
              ? (child as JSX.Element)
              : DOM.document.createTextNode(String(child)),
          )
        }
      }
    }

    for (let i = 0; i < children.length; i++) {
      walk(children[i])
    }

    return element
  }

  /** Fragment */
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
          const walker = DOM.document.createTreeWalker(removedNode, 1)

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
