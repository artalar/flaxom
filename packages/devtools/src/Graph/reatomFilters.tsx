import { parseAtoms, assign, LinkedListAtom, Action, atom, Fn, Ctx, action, AtomMut } from '@reatom/framework'
import { JSX } from '@reatom/jsx'
import { reatomZod, ZodAtomization } from '@reatom/npm-zod'
import { z } from 'zod'

import * as icons from './icons'
import { Lines } from './reatomLines'
import { buttonCss } from '../utils'

export const Filter = z.object({
  search: z.string(),
  type: z.enum(['filter', 'hide', 'highlight']),
  color: z.string(),
  active: z.boolean(),
})
export type Filter = ZodAtomization<typeof Filter>
export type FilterJSON = z.infer<typeof Filter>

export const Filters = z.object({
  search: Filter,
  valuesSearch: z.string(),
  exclude: z.string(),
  preview: z.boolean(),
  time: z.boolean(),
  folded: z.boolean(),
  size: z.number(),
  list: z.array(Filter),
})
export type Filters = ZodAtomization<typeof Filters>
export type FiltersJSON = z.infer<typeof Filters>

const DEFAULT_COLOR = '#BABACF'

const HIGHLIGHT_COLOR = '#e82020'

const initState: FiltersJSON = {
  search: { search: '', type: 'filter', color: HIGHLIGHT_COLOR, active: true },
  preview: true,
  time: true,
  folded: true,
  valuesSearch: '',
  exclude: '',
  size: 1000,
  list: [{ search: `(^_)|(\._)`, type: 'hide', color: DEFAULT_COLOR, active: true }],
}
const version = 'v25'

const FilterView = ({ filter, remove }: { filter: Filter; remove?: Fn<[Ctx]> }) => (
  <tr>
    <td
      css={`
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      <Checkbox
        aria-label="is filter active"
        model:checked={filter.active}
        css={`
          width: 30px;
          margin-right: 5px;
          padding: 0;
          border: none;
          display: flex;
          justify-content: center;
          align-items: center;
          outline: none;

          &[type='checkbox']:before {
            width: 16px;
            height: 16px;
          }
          &[type='checkbox']:after {
            width: 14px;
            height: 14px;
          }

          &[type='checkbox']:focus:before,
          &[type='checkbox']:hover:before {
            border-width: 2px;
          }
        `}
      />
      <FilterButton
        title="filter"
        aria-label="filter"
        disabled={atom((ctx) => ctx.spy(filter.type) === 'filter')}
        on:click={filter.type.setFilter}
        css:background={icons.matchIcon}
      />
      <FilterButton
        title="hide"
        aria-label="hide"
        disabled={atom((ctx) => ctx.spy(filter.type) === 'hide')}
        on:click={filter.type.setHide}
        css:background={icons.notMatchIcon}
      />
      <span
        data-highlight={atom((ctx) => ctx.spy(filter.type) === 'highlight')}
        css={`
          position: relative;
          width: 30px;
          height: 30px;
          margin-right: 5px;
          border: 2px solid #151134;
          border-radius: 2px;
          box-sizing: border-box;
          overflow: hidden;
          outline: none;
          &:has(input:focus),
          &:hover {
            border: 4px solid #151134;
          }
          &:before {
            position: absolute;
            content: '';
            width: 100%;
            height: 100%;
            background: ${icons.paintIconBucket};
            background-size: 80%;
            background-repeat: no-repeat;
            background-position: center;
            z-index: 1;
            pointer-events: none;
          }

          & input {
            opacity: 0;
          }

          &[data-highlight] {
            border: 4px double #151134;
            & input {
              opacity: 1;
            }
          }
        `}
      >
        <input
          title="highlight"
          aria-label="highlight"
          type="color"
          on:click={(ctx, e) => {
            if (ctx.get(filter.type) !== 'highlight') {
              filter.type.setHighlight(ctx)
              e.preventDefault()
            }
          }}
          model:value={filter.color}
          css={`
            padding: 0;
            border: none;
            position: absolute;
            width: 40px;
            height: 40px;
            top: -6px;
            left: -6px;
          `}
        />
      </span>
    </td>
    <td>
      <div
        css={`
          display: inline-flex;
          justify-content: center;
          align-items: center;
          flex-wrap: nowrap;
        `}
      >
        <input
          placeholder="RegExp"
          model:value={filter.search}
          css={`
            border: 1px solid #151134;
            height: 30px;
            padding: 0 4px;
            box-sizing: border-box;
            background: none;
          `}
        />
        {remove && (
          <FilterButton
            css={`
              margin-left: 10px;
              padding-bottom: 2px;
            `}
            title="Remove"
            aria-label="Remove filter"
            on:click={remove}
            css:background={icons.removeIcon}
          />
        )}
      </div>
    </td>
  </tr>
)

const FilterButton = (props: JSX.IntrinsicElements['button'] & { 'css:background': string }) => (
  <button
    {...props}
    css={`
      width: 30px;
      height: 30px;
      padding: 0;
      margin-right: 5px;
      display: flex;
      justify-content: center;
      align-items: center;

      background: var(--background);
      background-size: 80%;
      background-repeat: no-repeat;
      background-position: center;

      border: 2px solid #151134;
      border-radius: 2px;

      &:outline: none;

      &:focus,
      &:hover {
        border: 4px solid #151134;
      }
      &[disabled] {
        border: 4px double #151134;
      }
      ${props.css || ''}
    `}
  />
)

const ActionButton = (props: JSX.IntrinsicElements['button']) => (
  <button
    {...props}
    css={`
      ${buttonCss}
      flex-shrink: 0;
      width: 95px;
      ${props.css || ''}
    `}
  />
)

const Checkbox = (props: JSX.IntrinsicElements['input']) => (
  <input
    {...props}
    css={`
      position: relative;
      margin-right: 5px;
      &:before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        border-radius: 2px;
        background: #e1e0eb;
        border: 1px solid #151134;
      }
      &:checked:after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        background: #151134;
        clip-path: polygon(14% 44%, 0 65%, 50% 90%, 90% 16%, 70% 0%, 43% 62%);
      }
      ${props.css || ''}
    `}
  />
)

const ActionLabel = ({ model, children, ...props }: JSX.IntrinsicElements['label'] & { model: AtomMut<boolean> }) => (
  <label
    {...props}
    css={`
      ${buttonCss}
      flex-shrink: 0;
      width: 95px;
      padding: 2px 6px 2px 2px;
      /* TODO : fix this */
      &:has(input:focus) {
        border: 2px solid #151134;
      }
      ${props.css || ''}
    `}
  >
    <Checkbox model:checked={model} />
    {children as any}
  </label>
)
export const reatomFilters = (
  {
    list,
    lines,
    redrawLines,
    initSize,
  }: {
    list: LinkedListAtom
    lines: Lines
    redrawLines: Action<[], void>
    initSize: number
  },
  name: string,
) => {
  const KEY = name + version

  try {
    const snapshotString = localStorage.getItem(KEY)
    const snapshotObject = snapshotString && JSON.parse(snapshotString)
    var snapshot: undefined | FiltersJSON = Filters.parse(snapshotObject || { ...initState, size: initSize })
  } catch {
    snapshot = { ...initState, size: initSize }
  }

  const filters = reatomZod(Filters, {
    initState: snapshot,
    sync: (ctx) => {
      redrawLines(ctx)
      ctx.schedule(() => {
        localStorage.setItem(KEY, JSON.stringify(parseAtoms(ctx, filters)))
      })
    },
    name: `${name}.filters`,
  })

  const trackSize = action((ctx) => {
    const target = ctx.get(filters.size)
    let { size } = ctx.get(list)

    if (size <= target) return

    list.batch(ctx, () => {
      while (size > target) {
        const { head } = ctx.get(list)
        if (!head) return
        list.remove(ctx, head)
        size--
      }
    })
  }, `${name}.trackSize`)

  list.onChange(trackSize)
  filters.size.onChange(trackSize)

  const FiltersComponent = () => (
    <div
      css={`
        flex-shrink: 0;
        max-height: 40%;
        overflow: auto;
        & input::placeholder {
          color: currentColor;
          opacity: 0.8;
        }
      `}
    >
      <fieldset
        on:click={(ctx, e) => {
          if (e.target === e.currentTarget && ctx.get(filters.folded)) {
            filters.folded(ctx, false)
          }
        }}
        data-folded={filters.folded}
        css={`
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 0 20px;

          &[data-folded] {
            max-height: 0px;
            overflow: hidden;
            padding-bottom: 0;
          }
        `}
      >
        <legend
          css={`
            cursor: pointer;
          `}
          aria-label="Show/hide filters"
          title="Show/hide filters"
          tabindex={0}
          role="button"
          aria-expanded={filters.folded}
          on:click={filters.folded.toggle}
        >
          controls
        </legend>
        <form
          on:submit={(ctx, e) => {
            e.preventDefault()
            const search = ctx.get(filters.search.search)
            const type = ctx.get(filters.search.type)
            filters.list.create(ctx, { search, type })
            filters.search.search(ctx, '')
            filters.search.type.reset(ctx)
            filters.search.color(ctx, HIGHLIGHT_COLOR)
          }}
          css={`
            display: inline-flex;
            align-items: center;
          `}
        >
          <table
            css={`
              width: fit-content;
            `}
          >
            <FilterView filter={filters.search} />
          </table>
          <button
            css={`
              width: 70px;
              height: 30px;
              padding-bottom: 2px;
              background: none;
              border: 2px solid #151134;
              margin-left: 5px;
            `}
          >
            save
          </button>
        </form>
        <hr
          css={`
            width: 100%;
            border-top: 1px solid gray;
            border-bottom: none;
          `}
        />
        <table
          css={`
            width: fit-content;
          `}
        >
          {filters.list.reatomMap((ctx, filter) => (
            <FilterView filter={filter} remove={(ctx) => filters.list.remove(ctx, filter)} />
          ))}
        </table>
        <hr
          css={`
            width: 100%;
            border-top: 1px solid gray;
            border-bottom: none;
          `}
        />
        <span>
          <input
            title="Search in states"
            aria-label="Search in states"
            model:value={filters.valuesSearch}
            placeholder="Search in states"
            type="search"
            css={`
              width: 200px;
              height: 30px;
              padding: 0 4px;
              border: 1px solid #151134;
              border-radius: 2px;
              background: none;
              margin-right: 10px;
            `}
          />
          <input
            title="Exclude"
            aria-label="Exclude"
            model:value={filters.exclude}
            placeholder="Exclude"
            type="search"
            css={`
              width: 200px;
              height: 30px;
              padding: 0 4px;
              border: 1px solid #151134;
              border-radius: 2px;
              background: none;
            `}
          />
        </span>
        <hr
          css={`
            width: 100%;
            border-top: 1px solid gray;
            border-bottom: none;
          `}
        />
        <div
          css={`
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          `}
        >
          <ActionButton on:click={list.clear}>clear logs</ActionButton>
          <ActionButton disabled={atom((ctx) => ctx.spy(lines).size === 0)} on:click={lines.clear}>
            clear lines
          </ActionButton>
          <ActionLabel model={filters.preview}>preview</ActionLabel>
          <ActionLabel model={filters.time}>time</ActionLabel>
          <label
            css={`
              flex-shrink: 0;
              display: flex;
              align-items: center;
            `}
          >
            {atom((ctx) => `logged ${ctx.spy(list).size} of `)}
            <input
              model:valueAsNumber={filters.size}
              css:width={atom((ctx) => `${Math.max(3, ctx.spy(filters.size).toString().length)}em`)}
              css={`
                width: var(--width);
                background: none;
                border: none;
                margin-left: 5px;
                &:focus {
                  outline: 2px solid #151134;
                }
              `}
            />
          </label>
        </div>
      </fieldset>
    </div>
  )

  return assign(filters, {
    element: <FiltersComponent />,
  })
}
