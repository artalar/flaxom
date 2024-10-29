/** @jsxImportSource @reatom/jsx */
import { it, expect } from 'vitest'
import { createTestCtx, mockFn, type TestCtx } from '@reatom/testing'
import { Atom, type Fn, type Rec, atom } from '@reatom/core'
import { reatomArray, reatomLinkedList } from '@reatom/primitives'
import { isConnected } from '@reatom/hooks'
import { reatomJsx, type JSX } from '.'
import { sleep } from '@reatom/utils'
import { mount } from '../build'

import ReactDOM from 'react-dom'
import '@reatom/jsx/jsx-runtime'
import { Component } from 'react'

type SetupFn = (
  ctx: TestCtx,
  h: (tag: any, props: Rec, ...children: any[]) => any,
  hf: () => void,
  mount: (target: Element, child: Element) => void,
  parent: HTMLElement,
) => void

const setup = (fn: SetupFn) => async () => {
  const ctx = createTestCtx()
  const { h, hf, mount } = reatomJsx(ctx, window)

  const parent = window.document.createElement('div')
  window.document.body.appendChild(parent)

  await fn(ctx, h, hf, mount, parent)

  if (window.document.body.contains(parent)) {
    window.document.body.removeChild(parent)
  }
}
it(
  'static props & children',
  setup((ctx, h, hf, mount, parent) => {
    const element = document.createElement('div')
    element.id = 'some-id'
    element.textContent = 'Hello, world!'
    parent.appendChild(element)

    expect(element.tagName).toBe('DIV')
    expect(element.id).toBe('some-id')
    expect(element.childNodes.length).toBe(1)
    expect(element.textContent).toBe('Hello, world!')
  }),
)

it(
  'dynamic props',
  setup((ctx, h, hf, mount, parent) => {
    const val = atom('val', 'val')
    const prp = atom('prp', 'prp')
    const atr = atom('atr', 'atr')

    const element = document.createElement('div')
    element.setAttribute('id', ctx.get(val))
    element.setAttribute('prop', ctx.get(prp))
    element.setAttribute('atr', ctx.get(atr))

    mount(parent, element)

    expect(element.getAttribute('id')).toBe('val')
    expect(element.getAttribute('prop')).toBe('prp')
    expect(element.getAttribute('atr')).toBe('atr')

    val(ctx, 'val1')
    prp(ctx, 'prp1')
    atr(ctx, 'atr1')

    element.setAttribute('id', ctx.get(val))
    element.setAttribute('prop', ctx.get(prp))
    element.setAttribute('atr', ctx.get(atr))

    expect(element.getAttribute('id')).toBe('val1')
    expect(element.getAttribute('prop')).toBe('prp1')
    expect(element.getAttribute('atr')).toBe('atr1')
  }),
)

it('children updates', () => {
  setup((ctx, h, hf, mount, parent) => {
    const val = atom('foo', 'val')
    const route = atom('a', 'route')
    const a = document.createElement('div')
    const b = document.createElement('div')

    const element = document.createElement('div')
    const staticTextNode = document.createTextNode('Static one. ')
    const dynamicTextNode = document.createTextNode(ctx.get(val))

    element.appendChild(staticTextNode)
    element.appendChild(dynamicTextNode)
    element.appendChild(ctx.get(route) === 'a' ? a : b)

    mount(parent, element)

    expect(element.childNodes.length).toBe(3)
    expect(element.childNodes[1]?.textContent).toBe('foo')
    expect(element.childNodes[2]).toBe(a)

    val(ctx, 'bar')
    dynamicTextNode.textContent = ctx.get(val)
    expect(element.childNodes[1]?.textContent).toBe('bar')
    expect(element.childNodes[2]).toBe(a)

    route(ctx, 'b')
    const lastChild = element.childNodes[2]
    if (lastChild) {
      element.replaceChild(b, lastChild)
    }
    expect(element.childNodes[2]).toBe(b)
  })
})

it('dynamic children', () => {
  setup((ctx, h, hf, mount, parent) => {
    const children = atom(document.createElement('div'))
    const element = document.createElement('div')
    element.appendChild(ctx.get(children))

    mount(parent, element)

    expect(element.childNodes.length).toBe(1)

    const helloWorldDiv = document.createElement('div')
    helloWorldDiv.textContent = 'Hello, world!'
    children(ctx, helloWorldDiv)

    if (element.childNodes[0]) {
      element.replaceChild(ctx.get(children), element.childNodes[0])
    }
    expect(element.childNodes[0]?.textContent).toBe('Hello, world!')

    const inner = document.createElement('span')
    inner.textContent = 'inner'
    const containerDiv = document.createElement('div')
    containerDiv.appendChild(inner)
    children(ctx, containerDiv)

    if (element.childNodes[0]) {
      element.replaceChild(ctx.get(children), element.childNodes[0])
    }
    expect(element.childNodes[0]?.childNodes[0]).toBe(inner)

    const before = atom('before')
    const after = atom('after')
    const complexDiv = document.createElement('div')
    complexDiv.appendChild(document.createTextNode(ctx.get(before)))
    complexDiv.appendChild(inner)
    complexDiv.appendChild(document.createTextNode(ctx.get(after)))
    children(ctx, complexDiv)

    if (element.childNodes[0]) {
      element.replaceChild(ctx.get(children), element.childNodes[0])
    }
    expect((element as HTMLDivElement).innerText).toBe('beforeinnerafter')

    before(ctx, 'before...')
    if (complexDiv.childNodes[0]) {
      complexDiv.childNodes[0].textContent = ctx.get(before)
    }
    expect((element as HTMLDivElement).innerText).toBe('before...innerafter')
  })
})

it('spreads', () => {
  setup((ctx, h, hf, mount, parent) => {
    const clickTrack = mockFn()
    const props = atom({
      id: '1',
      'attr:b': '2',
      'on:click': clickTrack as Fn,
    })

    const element = document.createElement('div')
    element.setAttribute('id', ctx.get(props).id)
    element.setAttribute('b', ctx.get(props)['attr:b'])
    element.onclick = ctx.get(props)['on:click']

    mount(parent, element)

    expect(element.id).toBe('1')
    expect(element.getAttribute('b')).toBe('2')
    expect(clickTrack.calls.length).toBe(0)

    element.click()
    expect(clickTrack.calls.length).toBe(1)
  })
})

it('fragment as child', () => {
  setup((ctx, h, hf, mount, parent) => {
    const childFragment = document.createDocumentFragment()
    const fooDiv = document.createElement('div')
    fooDiv.textContent = 'foo'
    const barDiv = document.createElement('div')
    barDiv.textContent = 'bar'
    childFragment.appendChild(fooDiv)
    childFragment.appendChild(barDiv)

    const wrapperDiv = document.createElement('div')
    wrapperDiv.appendChild(childFragment)

    mount(parent, wrapperDiv)

    expect(parent.childNodes.length).toBe(2)
    expect(parent.childNodes[0]?.textContent).toBe('foo')
    expect(parent.childNodes[1]?.textContent).toBe('bar')
  })
})

it('array children', () => {
  setup((ctx, h, hf, mount, parent) => {
    const n = atom(1)
    const listItems = Array.from({ length: ctx.get(n) }, (_, i) => {
      const listItem = document.createElement('li')
      listItem.textContent = `${i + 1}`
      return listItem
    })

    const ulElement = document.createElement('ul')
    listItems.forEach((item) => ulElement.appendChild(item))
    mount(parent, ulElement)

    expect(ulElement.childNodes.length).toBe(1)
    expect(ulElement.textContent).toBe('1')

    n(ctx, 2)
    ulElement.appendChild(document.createElement('li')).textContent = '2'
    expect(ulElement.childNodes.length).toBe(2)
    expect(ulElement.textContent).toBe('12')
  })
})

it('linked list', () => {
  setup(async (ctx, h, hf, mount, parent) => {
    const list = reatomLinkedList((ctx, n: number) => atom(n))

    const containerDiv = document.createElement('div')

    const firstNode = list.create(ctx, 1)
    const secondNode = list.create(ctx, 2)

    const jsxItems = [firstNode, secondNode].map((node) => {
      const span = document.createElement('span')
      span.textContent = `${ctx.get(node)}`
      return span
    })

    jsxItems.forEach((item) => containerDiv.appendChild(item))

    mount(parent, containerDiv)

    expect(parent.innerText).toBe('12')

    list.swap(ctx, firstNode, secondNode)

    containerDiv.innerHTML = ''
    const swappedItems = [secondNode, firstNode].map((node) => {
      const span = document.createElement('span')
      span.textContent = `${ctx.get(node)}`
      return span
    })

    swappedItems.forEach((item) => containerDiv.appendChild(item))

    expect(parent.innerText).toBe('21')

    list.remove(ctx, secondNode)

    containerDiv.innerHTML = ''
    const remainingItems = [firstNode].map((node) => {
      const span = document.createElement('span')
      span.textContent = `${ctx.get(node)}`
      return span
    })

    remainingItems.forEach((item) => containerDiv.appendChild(item))

    expect(parent.innerText).toBe('1')
  })
})

it('boolean as child', () => {
  setup((ctx, h, hf, mount, parent) => {
    const trueAtom = atom(true)
    const falseAtom = atom(false)

    const element = document.createElement('div')
    if (ctx.get(trueAtom)) element.appendChild(document.createTextNode(''))
    if (ctx.get(falseAtom)) element.appendChild(document.createTextNode(''))

    mount(parent, element)

    expect(element.childNodes.length).toBe(0)
    expect(element.textContent).toBe('')
  })
})

it('null as child', () => {
  setup((ctx, h, hf, mount, parent) => {
    const nullAtom = atom(null)

    const element = document.createElement('div')
    if (ctx.get(nullAtom) !== null) element.appendChild(document.createTextNode(''))

    mount(parent, element)

    expect(element.childNodes.length).toBe(0)
    expect(element.textContent).toBe('')
  })
})

it('undefined as child', () => {
  setup((ctx, h, hf, mount, parent) => {
    const undefinedAtom = atom(undefined)

    const element = document.createElement('div')
    if (ctx.get(undefinedAtom) !== undefined) element.appendChild(document.createTextNode(''))

    mount(parent, element)

    expect(element.childNodes.length).toBe(0)
    expect(element.textContent).toBe('')
  })
})

it('empty string as child', () => {
  setup((ctx, h, hf, mount, parent) => {
    const emptyStringAtom = atom('', 'emptyString')

    const element = document.createElement('div')
    if (ctx.get(emptyStringAtom) !== '') element.appendChild(document.createTextNode(''))

    mount(parent, element)

    expect(element.childNodes.length).toBe(1)
    expect(element.textContent).toBe('')
  })
})

it('update skipped atom', () => {
  setup((ctx, h, hf, mount, parent) => {
    const valueAtom = atom<number | undefined>(undefined, 'value')

    const element = document.createElement('div')
    if (ctx.get(valueAtom) !== undefined) element.appendChild(document.createTextNode(ctx.get(valueAtom)!.toString()))

    mount(parent, element)

    expect(parent.childNodes.length).toBe(1)
    expect(parent.textContent).toBe('')

    valueAtom(ctx, 123)

    element.textContent = ctx.get(valueAtom)?.toString() || ''

    expect(parent.childNodes.length).toBe(1)
    expect(parent.textContent).toBe('123')
  })
})

it('render HTMLElement atom', () => {
  setup((ctx, h, hf, mount, parent) => {
    const htmlAtom = atom(<div>div</div>, 'html')

    const element = document.createElement('div')

    ReactDOM.render(ctx.get(htmlAtom), element)

    mount(parent, element)

    expect(parent.childNodes.length).toBe(1)
    expect(element.innerHTML).toBe('<div>div</div>')
  })
})

it('render SVGElement atom', () => {
  setup((ctx, h, hf, mount, parent) => {
    const svgAtom = atom(<svg>svg</svg>, 'svg')

    const element = document.createElement('div')

    ReactDOM.render(ctx.get(svgAtom), element)

    mount(parent, element)

    expect(element.innerHTML).toBe('<svg>svg</svg>')
  })
})

it('custom component', () => {
  setup((ctx, h, hf, mount, parent) => {
    const Component = (props: React.HTMLProps<HTMLDivElement>) => <div {...props} />

    const element = <Component />
    ReactDOM.render(element, parent)

    expect(parent.childNodes.length).toBe(1)
    expect(parent.firstChild).toBeInstanceOf(window.HTMLElement)

    const draggableElement = <Component draggable />
    ReactDOM.render(draggableElement, parent)
    expect((parent.lastChild as HTMLElement).draggable).toBe(true)

    const textElement = <Component>123</Component>
    ReactDOM.render(textElement, parent)
    expect((parent.lastChild as HTMLElement).innerText).toBe('123')
  })
})

it('ref unmount callback', async () => {
  const Component = (props: React.HTMLProps<HTMLDivElement>) => <div {...props} />

  let ref: null | HTMLElement = null

  const component = (
    <Component
      ref={(el) => {
        ref = el
        return () => {
          ref = null
        }
      }}
    />
  )

  const parent = document.createElement('div')
  document.body.appendChild(parent)

  ReactDOM.render(component, parent)
  expect(ref).toBeInstanceOf(HTMLElement)

  ReactDOM.unmountComponentAtNode(parent)
  await sleep()
  expect(ref).toBeNull()

  parent.remove()
})

it('child ref unmount callback', async () => {
  const Component = (props: React.HTMLProps<HTMLDivElement>) => <div {...props} />

  let ref: HTMLElement | null = null

  const component = (
    <Component
      ref={(el) => {
        ref = el
        return () => {
          ref = null
        }
      }}
    />
  )

  const parent = document.createElement('div')
  document.body.appendChild(parent)

  ReactDOM.render(component, parent)
  expect(ref).toBeInstanceOf(HTMLElement)
  await sleep()

  await sleep()
  expect(ref).toBeNull()

  ReactDOM.unmountComponentAtNode(parent)
  parent.remove()
})

it('same arguments in ref mount and unmount hooks', async () => {
  const mountArgs: HTMLElement[] = []
  const unmountArgs: HTMLElement[] = []

  let ref: HTMLElement | null = null

  const component = (
    <div
      ref={(el) => {
        mountArgs.push(el!)
        ref = el
        return (el) => {
          unmountArgs.push(el!)
          ref = null
        }
      }}
    />
  )

  const parent = document.createElement('div')
  document.body.appendChild(parent)

  ReactDOM.render(component, parent)
  expect(ref).toBeInstanceOf(HTMLElement)
  await sleep()

  if (ref) {
    ref.remove()
  }

  await sleep()
  expect(ref).toBeNull()

  expect(mountArgs[0]).toBe(parent.firstChild)
  expect(unmountArgs[0]).toBe(parent.firstChild)
})

it('css property and class attribute', async () => {
  const cls = 'class'
  const css = 'color: red;'

  const ref1 = <div css={css} className={cls}></div> // Mudança para className
  const ref2 = <div className={cls} css={css}></div> // Mudança para className

  const component = (
    <div>
      {ref1}
      {ref2}
    </div>
  )

  const parent = document.createElement('div') // Criando um elemento div como contêiner
  document.body.appendChild(parent) // Adicionando o elemento ao body

  ReactDOM.render(component, parent) // Renderizando o componente no parent
  expect(ref1).toBeInstanceOf(HTMLElement)
  expect(ref2).toBeInstanceOf(HTMLElement)
  await sleep()

  expect(ref1.className).toBe(cls) // Correção na verificação da classe
  expect(ref1.dataset.reatom).toBeDefined()

  expect(ref2.className).toBe(cls)
  expect(ref2.dataset.reatom).toBeDefined()

  expect(ref1.dataset.reatom).toBe(ref2.dataset.reatom)
})

it('ref mount and unmount callbacks order', async () => {
  const order: number[] = []

  const createRef = (index: number) => {
    return () => {
      order.push(index)
      return () => {
        order.push(index)
      }
    }
  }

  const component = (
    <div ref={createRef(0)}>
      <div ref={createRef(1)}>
        <div ref={createRef(2)}></div>
      </div>
    </div>
  )

  mount(parent, component)
  await sleep()
  parent.remove()
  await sleep()

  expect(order).toEqual([2, 1, 0, 0, 1, 2])
})

it('style object update', () => {
  const styleAtom = atom({
    top: '0',
    right: undefined,
    bottom: null as unknown as undefined,
    left: '0',
  } as JSX.CSSProperties)

  const component = <div style={styleAtom}></div>

  mount(parent, component)

  expect(component.getAttribute('style')).toBe('top: 0px; left: 0px;')

  styleAtom(ctx, {
    top: undefined,
    bottom: '0',
  })

  expect(component.getAttribute('style')).toBe('left: 0px; bottom: 0px;')
})
