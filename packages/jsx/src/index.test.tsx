import { it, expect } from 'vitest'
import { createTestCtx, mockFn, type TestCtx } from '@reatom/testing'
import { type Fn, type Rec, atom } from '@reatom/core'
import { reatomLinkedList } from '@reatom/primitives'
import { isConnected } from '@reatom/hooks'
import { sleep } from '@reatom/utils'

import { Bind, reatomJsx, type JSX } from '.'

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

/** Only for highlight */
const html = (arr: TemplateStringsArray, ...args: any[]) => {
  const html = arr.reduce((acc, str, i) => {
    return acc + str + (args[i] || '')
  }, '')
  return html
}

it(
  'static props & children',
  setup((ctx, h, hf, mount, parent) => {
    const element = <div id="some-id">Hello, world!</div>

    expect(element.tagName).toEqual('DIV')
    expect(element.id).toEqual('some-id')
    expect(element.childNodes.length).toEqual(1)
    expect(element.textContent).toEqual('Hello, world!')
  }),
)

it(
  'dynamic props',
  setup((ctx, h, hf, mount, parent) => {
    const val = atom('val', 'val')
    const prp = atom('prp', 'prp')
    const atr = atom('atr', 'atr')

    const element = <div id={val} prop:prp={prp} attr:atr={atr} />

    mount(parent, element)

    expect(element.id).toEqual('val')
    // @ts-expect-error `dunno` can't be inferred
    expect(element.prp).toEqual('prp')
    expect(element.getAttribute('atr')).toEqual('atr')

    val(ctx, 'val1')
    prp(ctx, 'prp1')
    atr(ctx, 'atr1')

    expect(element.id).toEqual('val1')
    // @ts-expect-error `dunno` can't be inferred
    expect(element.prp, 'prp1')
    expect(element.getAttribute('atr')).toEqual('atr1')
  }),
)

it(
  'children updates',
  setup((ctx, h, hf, mount, parent) => {
    const val = atom('foo', 'val')

    const route = atom('a', 'route')
    const a = window.document.createElement('div')
    const b = window.document.createElement('div')

    const element = (
      <div>
        Static one. {val}
        {atom((ctx) => (ctx.spy(route) === 'a' ? a : b))}
      </div>
    )

    mount(parent, element)

    expect(element.childNodes.length).toEqual(5)
    expect(element.childNodes[2]?.textContent).toEqual('foo')
    expect(element.childNodes[4]).toEqual(a)

    val(ctx, 'bar')
    expect(element.childNodes[2]?.textContent).toEqual('bar')

    expect(element.childNodes[4]).toEqual(a)
    route(ctx, 'b')
    expect(element.childNodes[4]).toEqual(b)
  }),
)

it(
  'dynamic children',
  setup((ctx, h, hf, mount, parent) => {
    const children = atom(<div />)

    const element = <div>{children}</div>

    mount(parent, element)

    expect(element.childNodes.length).toEqual(2)

    children(ctx, <div>Hello, world!</div>)
    expect(element.childNodes[1]?.textContent).toEqual('Hello, world!')

    const inner = <span>inner</span>
    children(ctx, <div>{inner}</div>)
    expect(element.childNodes[1]?.childNodes[0]).toEqual(inner)

    const before = atom('before', 'before')
    const after = atom('after', 'after')
    children(
      ctx,
      <div>
        {before}
        {inner}
        {after}
      </div>,
    )
    expect((element as HTMLDivElement).textContent).toEqual('beforeinnerafter')

    before(ctx, 'before...')
    expect((element as HTMLDivElement).textContent).toEqual('before...innerafter')
  }),
)

it(
  'spreads',
  setup((ctx, h, hf, mount, parent) => {
    const clickTrack = mockFn()
    const props = atom({
      id: '1',
      'attr:b': '2',
      'on:click': clickTrack as Fn,
    })

    const element = <div $spread={props} />

    mount(parent, element)

    expect(element.id).toEqual('1')
    expect(element.getAttribute('b')).toEqual('2')
    expect(clickTrack.calls.length).toEqual(0)
    // @ts-expect-error
    element.click()
    expect(clickTrack.calls.length).toEqual(1)
  }),
)

it(
  'fragment as child',
  setup((ctx, h, hf, mount, parent) => {
    const child = (
      <>
        <div>foo</div>
        <>
          <div>bar</div>
        </>
      </>
    )
    mount(parent, child)

    expect(parent.childNodes.length).toBe(2)
    expect(parent.childNodes[0]?.textContent).toBe('foo')
    expect(parent.childNodes[1]?.textContent).toBe('bar')
  }),
)

it(
  'array children',
  setup((ctx, h, hf, mount, parent) => {
    const n = atom(1)
    const list = atom((ctx) => <>{...Array.from({ length: ctx.spy(n) }, (_, i) => <li>{i + 1}</li>)}</>)

    const element = (
      <ul>
        {list}
        <br />
      </ul>
    )

    mount(parent, element)

    expect(element.childNodes.length).toEqual(3)
    expect(element.textContent).toEqual('1')

    n(ctx, 2)
    expect(element.childNodes.length).toEqual(4)
    expect(element.textContent).toEqual('12')
  }),
)

it(
  'linked list',
  setup(async (ctx, h, hf, mount, parent) => {
    const list = reatomLinkedList((ctx, n: number) => atom(n))
    const jsxList = list.reatomMap((ctx, n) => <span>{n}</span>)
    const one = list.create(ctx, 1)
    const two = list.create(ctx, 2)

    mount(parent, <div>{jsxList}</div>)

    expect(parent.textContent).toEqual('12')
    expect(isConnected(ctx, one))
    expect(isConnected(ctx, two))

    list.swap(ctx, one, two)
    expect(parent.textContent).toEqual('21')

    list.remove(ctx, two)
    expect(parent.textContent).toEqual('1')
    await sleep()
    expect(isConnected(ctx, one)).toBe(true)
    expect(isConnected(ctx, two)).toBe(false)
  }),
)

it(
  'boolean as child',
  setup((ctx, h, hf, mount, parent) => {
    const trueAtom = atom(true, 'true')
    const trueValue = true
    const falseAtom = atom(false, 'false')
    const falseValue = false

    const element = (
      <div>
        {trueAtom}
        {trueValue}
        {falseAtom}
        {falseValue}
      </div>
    )

    expect(element.childNodes.length).toEqual(2)
    expect(element.textContent).toEqual('')
  }),
)

it(
  'null as child',
  setup((ctx, h, hf, mount, parent) => {
    const nullAtom = atom(null, 'null')
    const nullValue = null

    const element = (
      <div>
        {nullAtom}
        {nullValue}
      </div>
    )

    expect(element.childNodes.length).toEqual(1)
    expect(element.textContent).toEqual('')
  }),
)

it(
  'undefined as child',
  setup((ctx, h, hf, mount, parent) => {
    const undefinedAtom = atom(undefined, 'undefined')
    const undefinedValue = undefined

    const element = (
      <div>
        {undefinedAtom}
        {undefinedValue}
      </div>
    )

    expect(element.childNodes.length).toEqual(1)
    expect(element.textContent).toEqual('')
  }),
)

it(
  'empty string as child',
  setup((ctx, h, hf, mount, parent) => {
    const emptyStringAtom = atom('', 'emptyString')
    const emptyStringValue = ''

    const element = (
      <div>
        {emptyStringAtom}
        {emptyStringValue}
      </div>
    )

    expect(element.childNodes.length).toEqual(1)
    expect(element.textContent).toEqual('')
  }),
)

it(
  'update skipped atom',
  setup((ctx, h, hf, mount, parent) => {
    const valueAtom = atom<number | undefined>(undefined, 'value')

    const element = <div>{valueAtom}</div>

    mount(parent, element)

    expect(parent.childNodes.length).toEqual(1)
    expect(parent.textContent).toEqual('')

    valueAtom(ctx, 123)

    expect(parent.childNodes.length).toEqual(1)
    expect(parent.textContent).toEqual('123')
  }),
)

it(
  'render HTMLElement atom',
  setup((ctx, h, hf, mount, parent) => {
    const htmlAtom = atom(<div>div</div>, 'html')

    const element = <div>{htmlAtom}</div>

    expect(element.innerHTML).toEqual('<!--html--><div>div</div>')
  }),
)

it(
  'render SVGElement atom',
  setup((ctx, h, hf, mount, parent) => {
    const svgAtom = atom(<svg:svg>svg</svg:svg>, 'svg')

    const element = <div>{svgAtom}</div>

    expect(element.innerHTML).toEqual('<!--svg--><svg>svg</svg>')
  }),
)

it(
  'custom component',
  setup((ctx, h, hf, mount, parent) => {
    const Component = (props: JSX.HTMLAttributes) => <div {...props} />

    expect(<Component />).instanceOf(window.HTMLElement)
    expect(((<Component draggable="true" />) as HTMLElement).draggable).toEqual(true)
    expect(((<Component>123</Component>) as HTMLElement).textContent).toEqual('123')
  }),
)

it(
  'ref unmount callback',
  setup(async (ctx, h, hf, mount, parent) => {
    const Component = (props: JSX.HTMLAttributes) => <div {...props} />

    let ref: null | HTMLElement = null

    const component = (
      <Component
        ref={(ctx, el) => {
          ref = el
          return () => {
            ref = null
          }
        }}
      />
    )

    mount(parent, component)
    expect(ref).instanceOf(window.HTMLElement)

    parent.remove()
    await sleep()
    expect(ref).toEqual(null)
  }),
)

it(
  'child ref unmount callback',
  setup(async (ctx, h, hf, mount, parent) => {
    const Component = (props: JSX.HTMLAttributes) => <div {...props} />

    let ref: null | HTMLElement = null

    const component = (
      <Component
        ref={(ctx, el) => {
          ref = el
          return () => {
            ref = null
          }
        }}
      />
    )

    mount(parent, component)
    expect(ref).instanceOf(window.HTMLElement)
    await sleep()

    ref!.remove()
    await sleep()
    expect(ref).toEqual(null)
  }),
)

it(
  'same arguments in ref mount and unmount hooks',
  setup(async (ctx, h, hf, mount, parent) => {
    const mountArgs: unknown[] = []
    const unmountArgs: unknown[] = []

    let ref: null | HTMLElement = null

    const component = (
      <div
        ref={(ctx, el) => {
          mountArgs.push(ctx, el)
          ref = el
          return (ctx, el) => {
            unmountArgs.push(ctx, el)
            ref = null
          }
        }}
      />
    )

    mount(parent, component)
    expect(ref).instanceOf(window.HTMLElement)
    await sleep()

    ref!.remove()
    await sleep()
    expect(ref).toEqual(null)

    expect(mountArgs[0]).toEqual(ctx)
    expect(mountArgs[1]).toEqual(component)

    expect(unmountArgs[0]).toEqual(ctx)
    expect(unmountArgs[1]).toEqual(component)
  }),
)

it(
  'css property and class attribute',
  setup(async (ctx, h, hf, mount, parent) => {
    const cls = 'class'
    const css = 'color: red;'

    const ref1 = <div css={css} class={cls}></div>
    const ref2 = <div class={cls} css={css}></div>

    const component = (
      <div>
        {ref1}
        {ref2}
      </div>
    )

    mount(parent, component)
    expect(ref1).instanceOf(window.HTMLElement)
    expect(ref2).instanceOf(window.HTMLElement)
    await sleep()

    expect(ref1.className).toEqual(cls)
    expect(ref1.dataset.reatom).toBeTruthy()

    expect(ref2.className).toEqual(cls)
    expect(ref2.dataset.reatom).toBeTruthy()

    expect(ref1.dataset.reatom, ref2.dataset.reatom)
  }),
)

it(
  'css custom property',
  setup(async (ctx, h, hf, mount, parent) => {
    const colorAtom = atom('red' as string | undefined)

    const component = <div css:first-property={colorAtom} css:secondProperty={colorAtom}></div>

    mount(parent, component)
    await sleep()

    expect(component.style.getPropertyValue('--first-property'), 'red')
    expect(component.style.getPropertyValue('--secondProperty'), 'red')

    colorAtom(ctx, 'green')

    expect(component.style.getPropertyValue('--first-property'), 'green')
    expect(component.style.getPropertyValue('--secondProperty'), 'green')

    colorAtom(ctx, undefined)

    expect(component.style.getPropertyValue('--first-property'), '')
    expect(component.style.getPropertyValue('--secondProperty'), '')
  }),
)

it(
  'class and className attribute',
  setup(async (ctx, h, hf, mount, parent) => {
    const classAtom = atom('' as string | undefined)

    const ref1 = <div class={classAtom}></div>
    const ref2 = <div className={classAtom}></div>

    const component = (
      <div>
        {ref1}
        {ref2}
      </div>
    )

    mount(parent, component)
    await sleep()

    expect(ref1.hasAttribute('class'))
    expect(ref2.hasAttribute('class'))

    classAtom(ctx, 'cls')
    expect(ref1.className).toEqual('cls')
    expect(ref2.className).toEqual('cls')
    expect(ref1.hasAttribute('class')).toBeTruthy()
    expect(ref2.hasAttribute('class')).toBeTruthy()

    classAtom(ctx, undefined)
    expect(ref1.className).toEqual('')
    expect(ref2.className).toEqual('')
    expect(!ref1.hasAttribute('class')).toBeTruthy()
    expect(!ref2.hasAttribute('class')).toBeTruthy()
  }),
)

it(
  'ref mount and unmount callbacks order',
  setup(async (ctx, h, hf, mount, parent) => {
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

    expect(order).toStrictEqual([2, 1, 0, 0, 1, 2])
  }),
)

it(
  'style object update',
  setup((ctx, h, hf, mount, parent) => {
    const styleTopAtom = atom<JSX.StyleProperties['top']>('0')
    const styleRightAtom = atom<JSX.StyleProperties['right']>(undefined)
    const styleBottomAtom = atom<JSX.StyleProperties['bottom']>(null)
    const styleLeftAtom = atom<JSX.StyleProperties['left']>('0')
    const styleAtom = atom<JSX.StyleProperties>((ctx) => ({
      top: ctx.spy(styleTopAtom),
      right: ctx.spy(styleRightAtom),
      bottom: ctx.spy(styleBottomAtom),
      left: ctx.spy(styleLeftAtom),
    }))

    const firstEl = <div style={styleAtom}></div>
    const secondEl = (
      <div
        style:top={styleTopAtom}
        style:right={styleRightAtom}
        style:bottom={styleBottomAtom}
        style:left={styleLeftAtom}
      ></div>
    )

    const component = (
      <div>
        {firstEl}
        {secondEl}
      </div>
    )

    mount(parent, component)

    expect(firstEl.getAttribute('style')).toEqual('top: 0px; left: 0px;')
    expect(secondEl.getAttribute('style')).toEqual('top: 0px; left: 0px;')

    styleTopAtom(ctx, undefined)
    styleBottomAtom(ctx, 0)

    expect(firstEl.getAttribute('style')).toEqual('left: 0px; bottom: 0px;')
    expect(secondEl.getAttribute('style')).toEqual('left: 0px; bottom: 0px;')
  }),
)

it(
  'render different atom children',
  setup((ctx, h, hf, mount, parent) => {
    const aChild = atom(<span>a</span>, 'aChild')
    const a = atom(
      <>
        {aChild}
        <span />
      </>,
      'a',
    )

    const bChild = atom(<div>b</div>, 'bChild')
    const b = atom(
      <>
        <div />
        {bChild}
      </>,
      'b',
    )

    const container = (
      <main>
        <>
          {a}
          {b}
        </>
      </main>
    )

    mount(parent, container)
    expect(container.innerHTML).toEqual(
      `<!--a--><!--aChild--><span>a</span><span></span><!--b--><div></div><!--bChild--><div>b</div>`,
    )

    aChild(ctx, <h1>A</h1>)
    expect(container.innerHTML).toEqual(
      `<!--a--><!--aChild--><h1>A</h1><span></span><!--b--><div></div><!--bChild--><div>b</div>`,
    )

    // @ts-expect-error
    bChild(ctx, null)
    expect(container.innerHTML).toEqual(`<!--a--><!--aChild--><h1>A</h1><span></span><!--b--><div></div><!--bChild-->`)

    bChild(ctx, <div>B</div>)
    expect(container.innerHTML).toEqual(
      `<!--a--><!--aChild--><h1>A</h1><span></span><!--b--><div></div><!--bChild--><div>B</div>`,
    )
  }),
)

it(
  'render atom fragments',
  setup((ctx, h, hf, mount, parent) => {
    const bool1Atom = atom(false)
    const bool2Atom = atom(false)

    const element = (
      <div>
        <p>0</p>
        {atom(
          (ctx) =>
            ctx.spy(bool1Atom) ? (
              <>
                <p>1</p>
                {atom(
                  (ctx) =>
                    ctx.spy(bool2Atom) ? (
                      <>
                        <p>2</p>
                        <p>3</p>
                      </>
                    ) : undefined,
                  '2',
                )}
                <p>4</p>
              </>
            ) : undefined,
          '1',
        )}
        <p>5</p>
      </div>
    )

    const expect1 = '<p>0</p><!--1--><p>5</p>'
    const expect2 = '<p>0</p><!--1--><p>1</p><!--2--><p>4</p><p>5</p>'
    const expect3 = '<p>0</p><!--1--><p>1</p><!--2--><p>2</p><p>3</p><p>4</p><p>5</p>'

    bool1Atom(ctx, false)
    bool2Atom(ctx, false)
    expect(element.innerHTML).toEqual(expect1)

    bool1Atom(ctx, false)
    bool2Atom(ctx, true)
    expect(element.innerHTML).toEqual(expect1)

    bool1Atom(ctx, true)
    bool2Atom(ctx, false)
    expect(element.innerHTML).toEqual(expect2)

    bool1Atom(ctx, true)
    bool2Atom(ctx, true)
    expect(element.innerHTML).toEqual(expect3)

    bool1Atom(ctx, true)
    bool2Atom(ctx, false)
    expect(element.innerHTML).toEqual(expect2)

    bool1Atom(ctx, false)
    bool2Atom(ctx, true)
    expect(element.innerHTML).toEqual(expect1)

    bool1Atom(ctx, false)
    bool2Atom(ctx, false)
    expect(element.innerHTML).toEqual(expect1)
  }),
)

it(
  'Bind',
  setup(async (ctx, h, hf, mount, parent) => {
    const div = (<div />) as HTMLDivElement
    const input = (<input />) as HTMLInputElement
    const svg = (<svg:svg />) as SVGSVGElement

    const inputState = atom('42')

    const testDiv = (
      <Bind
        element={div}
        // @ts-expect-error there should be an error here
        value={inputState}
      />
    )
    const testInput = (
      <Bind element={input} value={inputState} on:input={(ctx, e) => inputState(ctx, e.currentTarget.value)} />
    )
    const testSvg = (
      <Bind element={svg}>
        <svg:path d="M 10 10 H 100" />
      </Bind>
    )

    mount(
      parent,
      <main>
        {testDiv}
        {testInput}
        {testSvg}
      </main>,
    )

    await sleep()

    inputState(ctx, '43')

    expect(input.value).toEqual('43')
    expect(testSvg.innerHTML).toEqual('<path d="M 10 10 H 100"></path>')
  }),
)
