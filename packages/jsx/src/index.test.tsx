import * as assert from 'uvu/assert'
import { createTestCtx, mockFn, type TestCtx } from '@reatom/testing'
import { type Fn, type Rec, atom } from '@reatom/core'
import { reatomLinkedList } from '@reatom/primitives'
import { isConnected } from '@reatom/hooks'
import { reatomJsx, type JSX } from '.'
import { sleep } from '@reatom/utils'

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

it('static props & children', setup((ctx, h, hf, mount, parent) => {
  const element = <div id="some-id">Hello, world!</div>

  assert.is(element.tagName, 'DIV')
  assert.is(element.id, 'some-id')
  assert.is(element.childNodes.length, 1)
  assert.is(element.textContent, 'Hello, world!')
}))

it('dynamic props', setup((ctx, h, hf, mount, parent) => {
  const val = atom('val', 'val')
  const prp = atom('prp', 'prp')
  const atr = atom('atr', 'atr')

  const element = <div id={val} prop:prp={prp} attr:atr={atr} />

  mount(parent, element)

  assert.is(element.id, 'val')
  // @ts-expect-error `dunno` can't be inferred
  assert.is(element.prp, 'prp')
  assert.is(element.getAttribute('atr'), 'atr')

  val(ctx, 'val1')
  prp(ctx, 'prp1')
  atr(ctx, 'atr1')

  assert.is(element.id, 'val1')
  // @ts-expect-error `dunno` can't be inferred
  assert.is(element.prp, 'prp1')
  assert.is(element.getAttribute('atr'), 'atr1')
}))

it('children updates', setup((ctx, h, hf, mount, parent) => {
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

  assert.is(element.childNodes.length, 5)
  assert.is(element.childNodes[2]?.textContent, 'foo')
  assert.is(element.childNodes[4], a)

  val(ctx, 'bar')
  assert.is(element.childNodes[2]?.textContent, 'bar')

  assert.is(element.childNodes[4], a)
  route(ctx, 'b')
  assert.is(element.childNodes[4], b)
}))

it('dynamic children', setup((ctx, h, hf, mount, parent) => {
  const children = atom(<div />)

  const element = <div>{children}</div>

  mount(parent, element)

  assert.is(element.childNodes.length, 2)

  children(ctx, <div>Hello, world!</div>)
  assert.is(element.childNodes[1]?.textContent, 'Hello, world!')

  const inner = <span>inner</span>
  children(ctx, <div>{inner}</div>)
  assert.is(element.childNodes[1]?.childNodes[0], inner)

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
  assert.is((element as HTMLDivElement).innerText, 'beforeinnerafter')

  before(ctx, 'before...')
  assert.is((element as HTMLDivElement).innerText, 'before...innerafter')
}))

it('spreads', setup((ctx, h, hf, mount, parent) => {
  const clickTrack = mockFn()
  const props = atom({
    id: '1',
    'attr:b': '2',
    'on:click': clickTrack as Fn,
  })

  const element = <div $spread={props} />

  mount(parent, element)

  assert.is(element.id, '1')
  assert.is(element.getAttribute('b'), '2')
  assert.is(clickTrack.calls.length, 0)
  // @ts-expect-error
  element.click()
  assert.is(clickTrack.calls.length, 1)
}))

it('fragment as child', setup((ctx, h, hf, mount, parent) => {
  const child = (
    <>
      <div>foo</div>
      <>
        <div>bar</div>
      </>
    </>
  )
  mount(parent, child)

  assert.is(parent.childNodes.length, 2)
  assert.is(parent.childNodes[0]?.textContent, 'foo')
  assert.is(parent.childNodes[1]?.textContent, 'bar')
}))

it('array children', setup((ctx, h, hf, mount, parent) => {
  const n = atom(1)
  const list = atom((ctx) => (<>
    {...Array.from({ length: ctx.spy(n) }, (_, i) => <li>{i + 1}</li>)}
  </>))

  const element = (
    <ul>
      {list}
      <br />
    </ul>
  )

  mount(parent, element)

  assert.is(element.childNodes.length, 3)
  assert.is(element.textContent, '1')

  n(ctx, 2)
  assert.is(element.childNodes.length, 4)
  assert.is(element.textContent, '12')
}))

it('linked list', setup(async (ctx, h, hf, mount, parent) => {
  const list = reatomLinkedList((ctx, n: number) => atom(n))
  const jsxList = list.reatomMap((ctx, n) => <span>{n}</span>)
  const one = list.create(ctx, 1)
  const two = list.create(ctx, 2)

  mount(parent, <div>{jsxList}</div>)

  assert.is(parent.innerText, '12')
  assert.ok(isConnected(ctx, one))
  assert.ok(isConnected(ctx, two))

  list.swap(ctx, one, two)
  assert.is(parent.innerText, '21')

  list.remove(ctx, two)
  assert.is(parent.innerText, '1')
  await sleep()
  assert.ok(isConnected(ctx, one))
  assert.not.ok(isConnected(ctx, two))
}))

it('boolean as child', setup((ctx, h, hf, mount, parent) => {
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

  assert.is(element.childNodes.length, 2)
  assert.is(element.textContent, '')
}))

it('null as child', setup((ctx, h, hf, mount, parent) => {
  const nullAtom = atom(null, 'null')
  const nullValue = null

  const element = (
    <div>
      {nullAtom}
      {nullValue}
    </div>
  )

  assert.is(element.childNodes.length, 1)
  assert.is(element.textContent, '')
}))

it('undefined as child', setup((ctx, h, hf, mount, parent) => {
  const undefinedAtom = atom(undefined, 'undefined')
  const undefinedValue = undefined

  const element = (
    <div>
      {undefinedAtom}
      {undefinedValue}
    </div>
  )

  assert.is(element.childNodes.length, 1)
  assert.is(element.textContent, '')
}))

it('empty string as child', setup((ctx, h, hf, mount, parent) => {
  const emptyStringAtom = atom('', 'emptyString')
  const emptyStringValue = ''

  const element = (
    <div>
      {emptyStringAtom}
      {emptyStringValue}
    </div>
  )

  assert.is(element.childNodes.length, 1)
  assert.is(element.textContent, '')
}))

it('update skipped atom', setup((ctx, h, hf, mount, parent) => {
  const valueAtom = atom<number | undefined>(undefined, 'value')

  const element = <div>{valueAtom}</div>

  mount(parent, element)

  assert.is(parent.childNodes.length, 1)
  assert.is(parent.textContent, '')

  valueAtom(ctx, 123)

  assert.is(parent.childNodes.length, 1)
  assert.is(parent.textContent, '123')
}))

it('render HTMLElement atom', setup((ctx, h, hf, mount, parent) => {
  const htmlAtom = atom(<div>div</div>, 'html')

  const element = <div>{htmlAtom}</div>

  assert.is(element.innerHTML, '<!--html--><div>div</div>')
}))

it('render SVGElement atom', setup((ctx, h, hf, mount, parent) => {
  const svgAtom = atom(<svg:svg>svg</svg:svg>, 'svg')

  const element = <div>{svgAtom}</div>

  assert.is(element.innerHTML, '<!--svg--><svg>svg</svg>')
}))

it('custom component', setup((ctx, h, hf, mount, parent) => {
  const Component = (props: JSX.HTMLAttributes) => <div {...props} />

  assert.instance(<Component />, window.HTMLElement)
  assert.is(((<Component draggable="true" />) as HTMLElement).draggable, true)
  assert.equal(((<Component>123</Component>) as HTMLElement).innerText, '123')
}))

it('ref unmount callback', setup(async (ctx, h, hf, mount, parent) => {
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
  assert.instance(ref, window.HTMLElement)

  parent.remove()
  await sleep()
  assert.is(ref, null)
}))

it('child ref unmount callback', setup(async (ctx, h, hf, mount, parent) => {
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
  assert.instance(ref, window.HTMLElement)
  await sleep()

  ref!.remove()
  await sleep()
  assert.is(ref, null)
}))

it('same arguments in ref mount and unmount hooks', setup(async (ctx, h, hf, mount, parent) => {
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
  assert.instance(ref, window.HTMLElement)
  await sleep()

  ref!.remove()
  await sleep()
  assert.is(ref, null)

  assert.is(mountArgs[0], ctx)
  assert.is(mountArgs[1], component)

  assert.is(unmountArgs[0], ctx)
  assert.is(unmountArgs[1], component)
}))

it('css property and class attribute', setup(async (ctx, h, hf, mount, parent) => {
  const cls = 'class'
  const css = 'color: red;'

  const ref1 = (<div css={css} class={cls}></div>)
  const ref2 = (<div class={cls} css={css}></div>)

  const component = (
    <div>
      {ref1}
      {ref2}
    </div>
  )

  mount(parent, component)
  assert.instance(ref1, window.HTMLElement)
  assert.instance(ref2, window.HTMLElement)
  await sleep()

  assert.is(ref1.className, cls)
  assert.ok(ref1.dataset.reatom)

  assert.is(ref2.className, cls)
  assert.ok(ref2.dataset.reatom)

  assert.is(ref1.dataset.reatom, ref2.dataset.reatom)
}))

it('css custom property', setup(async (ctx, h, hf, mount, parent) => {
  const colorAtom = atom('red' as string | undefined)

  const component = (
    <div
      css:first-property={colorAtom}
      css:secondProperty={colorAtom}
    ></div>
  )

  mount(parent, component)
  await sleep()

  assert.is(component.style.getPropertyValue('--first-property'), 'red')
  assert.is(component.style.getPropertyValue('--secondProperty'), 'red')

  colorAtom(ctx, 'green')

  assert.is(component.style.getPropertyValue('--first-property'), 'green')
  assert.is(component.style.getPropertyValue('--secondProperty'), 'green')

  colorAtom(ctx, undefined)

  assert.is(component.style.getPropertyValue('--first-property'), '')
  assert.is(component.style.getPropertyValue('--secondProperty'), '')
}))

it('class and className attribute', setup(async (ctx, h, hf, mount, parent) => {
  const classAtom = atom('' as string | undefined)

  const ref1 = (<div class={classAtom}></div>)
  const ref2 = (<div className={classAtom}></div>)

  const component = (
    <div>
      {ref1}
      {ref2}
    </div>
  )

  mount(parent, component)
  await sleep()

  assert.ok(ref1.hasAttribute('class'))
  assert.ok(ref2.hasAttribute('class'))

  classAtom(ctx, 'cls')
  assert.is(ref1.className, 'cls')
  assert.is(ref2.className, 'cls')
  assert.ok(ref1.hasAttribute('class'))
  assert.ok(ref2.hasAttribute('class'))

  classAtom(ctx, undefined)
  assert.is(ref1.className, '')
  assert.is(ref2.className, '')
  assert.ok(!ref1.hasAttribute('class'))
  assert.ok(!ref2.hasAttribute('class'))
}))

it('ref mount and unmount callbacks order', setup(async (ctx, h, hf, mount, parent) => {
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
        <div ref={createRef(2)}>
        </div>
      </div>
    </div>
  )

  mount(parent, component)
  await sleep()
  parent.remove()
  await sleep()

  assert.equal(order, [2, 1, 0, 0, 1, 2])
}))

it('style object update', setup((ctx, h, hf, mount, parent) => {
  const styleAtom = atom({
    top: '0',
    right: undefined,
    bottom: null as unknown as undefined,
    left: '0',
  } as JSX.CSSProperties)

  const component = (
    <div style={styleAtom}></div>
  )

  mount(parent, component)

  assert.is(component.getAttribute('style'), 'top: 0px; left: 0px;')

  styleAtom(ctx, {
    top: undefined,
    bottom: '0',
  })

  assert.is(component.getAttribute('style'), 'left: 0px; bottom: 0px;')
}))

it('render different atom children', setup((ctx, h, hf, mount, parent) => {
  const name = 'child'
  const target = `<!--${name}-->`
  const childAtom = atom<Node | string>(<>
    <div>div</div>
    <p>p</p>
  </>, name)

  const element = <div>{childAtom}</div>
  assert.is(element.innerHTML, `<div>${target}div>div</div><p>p</p></div>`)

  childAtom(ctx, <span>span</span>)
  assert.is(element.innerHTML, `<div>${target}span>span</span></div>`)

  childAtom(ctx, 'text')
  assert.is(element.innerHTML, `<div>${target}text</div>`)
}))

it('render atom fragments', setup((ctx, h, hf, mount, parent) => {
  const bool1Atom = atom(false)
  const bool2Atom = atom(false)

  const element = (
    <div>
      <p>0</p>
      {atom(
        (ctx) => ctx.spy(bool1Atom)
          ? <>
            <p>1</p>
            {atom(
              (ctx) => ctx.spy(bool2Atom)
                ? <>
                  <p>2</p>
                  <p>3</p>
                </>
                : undefined,
              '2'
            )}
            <p>4</p>
          </>
          : undefined,
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
  assert.is(element.innerHTML, expect1)

  bool1Atom(ctx, false)
  bool2Atom(ctx, true)
  assert.is(element.innerHTML, expect1)

  bool1Atom(ctx, true)
  bool2Atom(ctx, false)
  assert.is(element.innerHTML, expect2)

  bool1Atom(ctx, true)
  bool2Atom(ctx, true)
  assert.is(element.innerHTML, expect3)

  bool1Atom(ctx, true)
  bool2Atom(ctx, false)
  assert.is(element.innerHTML, expect2)

  bool1Atom(ctx, false)
  bool2Atom(ctx, true)
  assert.is(element.innerHTML, expect1)

  bool1Atom(ctx, false)
  bool2Atom(ctx, false)
  assert.is(element.innerHTML, expect1)
}))
