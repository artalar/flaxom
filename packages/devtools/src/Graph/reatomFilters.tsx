import { parseAtoms, assign, LinkedListAtom, Action, atom, Fn, Ctx, noop, action, omit } from '@reatom/framework'
import { JSX } from '@reatom/jsx'
import { reatomZod, ZodAtomization } from '@reatom/npm-zod'
import { z } from 'zod'

import * as icons from './icons'
import { Lines } from './reatomLines'

export const Filter = z.object({
  name: z.string().readonly(),
  search: z.string(),
  type: z.enum(['match', 'mismatch', 'exclude', 'highlight', 'off']),
  color: z.string(),
  default: z.boolean().readonly(),
})
export type Filter = ZodAtomization<typeof Filter>
export type FilterJSON = z.infer<typeof Filter>

export const Filters = z.object({
  search: Filter,
  valuesSearch: z.string(),
  hoverPreview: z.boolean(),
  inlinePreview: z.boolean(),
  timestamps: z.boolean(),
  folded: z.boolean(),
  size: z.number(),
  list: z.array(Filter),
})
export type Filters = ZodAtomization<typeof Filters>
export type FiltersJSON = z.infer<typeof Filters>

const DEFAULT_COLOR = '#BABACF'

const HIGHLIGHT_COLOR = '#e82020'

const initState: FiltersJSON = {
  search: { name: '', search: '', type: 'match', color: HIGHLIGHT_COLOR, default: true },
  hoverPreview: false,
  inlinePreview: true,
  timestamps: true,
  folded: true,
  valuesSearch: '',
  size: 1000,
  list: [{ name: 'private', search: `(^_)|(\._)`, type: 'mismatch', color: DEFAULT_COLOR, default: true }],
}
const version = 'v24'

const FilterView = ({ id, filter, remove }: { id: string; filter: Filter; remove: Fn<[Ctx]> }) => (
  <tr>
    {/* <th
      scope="row"
      css={`
        font-weight: normal;
        text-align: start;
        padding-right: 10px;
      `}
    >
      {filter.name}
    </th> */}
    <td
      css={`
        display: flex;
        justify-content: center;
        align-items: center;
      `}
    >
      <FilterButton
        title="match"
        aria-label="match"
        disabled={atom((ctx) => ctx.spy(filter.type) === 'match')}
        on:click={filter.type.setMatch}
        css:background={icons.matchIcon}
      />
      <FilterButton
        title="not match"
        aria-label="not match"
        disabled={atom((ctx) => ctx.spy(filter.type) === 'mismatch')}
        on:click={filter.type.setMismatch}
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
          &:hover {
            border: 4px solid #151134;
          }
          &[data-highlight] {
            border: 4px double #151134;
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
      {!(filter.default && filter.name === '') && (
        <FilterButton
          title="exclude"
          aria-label="exclude"
          disabled={atom((ctx) => ctx.spy(filter.type) === 'exclude')}
          on:click={filter.type.setExclude}
          css:background={icons.excludeIcon}
        />
      )}
      <FilterButton
        title={atom((ctx) => (ctx.spy(filter.type) === 'off' ? 'enable' : 'disable'))}
        aria-label={atom((ctx) => (ctx.spy(filter.type) === 'off' ? 'enable' : 'disable'))}
        disabled={atom((ctx) => ctx.spy(filter.type) === 'off')}
        on:click={filter.type.setOff}
        css:background={icons.stopIcon}
      />
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
          id={id}
          placeholder="RegExp"
          model:value={filter.search}
          readonly={filter.default && filter.name === 'private'}
          css={`
            border: 1px solid #151134;
            height: 30px;
            padding: 0 4px;
            box-sizing: border-box;
            background: none;
          `}
        />
        {!filter.default && (
          <FilterButton
            css={`
              margin-left: 5px;
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
      background: none;
      border: none;
      flex-shrink: 0;
      width: 80px;
      height: 30px;
      border: 2px solid #151134;
      border-radius: 2px;
      padding: 2px 4px;
      &:hover {
        border: 4px solid #151134;
      }
      ${props.css || ''}
    `}
  />
)

const ActionLabel = (props: JSX.IntrinsicElements['label']) => (
  <label
    {...props}
    css={`
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 30px;
      width: 150px;
      padding: 2px 4px;
      box-sizing: border-box;
      border: 2px solid #151134;
      border-radius: 2px;
      &:hover {
        border: 4px solid #151134;
      }
      ${props.css || ''}
    `}
  />
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
            const name = ctx.get(filters.search.search)
            const type = ctx.get(filters.search.type)
            filters.list.create(ctx, {
              name,
              search: name.toLocaleLowerCase(),
              type,
              default: false,
            })
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
              /* margin-left: -15px; */
            `}
          >
            <FilterView id={filters.search.search.__reatom.name!} filter={filters.search} remove={noop} />
          </table>
          <button
            css={`
              width: 70px;
              height: 30px;
              padding-bottom: 2px;
              background: none;
              border: 2px solid #151134;
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
            <FilterView
              id={`${filters.list.__reatom.name}-${filter.name}`}
              filter={filter}
              remove={(ctx) => filters.list.remove(ctx, filter)}
            />
          ))}
        </table>
        <hr
          css={`
            width: 100%;
            border-top: 1px solid gray;
            border-bottom: none;
          `}
        />
        <input
          title="Search in states"
          aria-label="Search in states"
          model:value={filters.valuesSearch}
          placeholder="Search in states"
          type="search"
          css={`
            width: 200px;
            height: 30px;
            /* margin: 14px 0; */
            padding: 0 4px;
            border: 1px solid #151134;
            border-radius: 2px;
            background: none;
          `}
        />
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
            gap: 14px;
            flex-wrap: wrap;
          `}
        >
          <ActionButton on:click={list.clear}>clear logs</ActionButton>
          <ActionButton disabled={atom((ctx) => ctx.spy(lines).size === 0)} on:click={lines.clear}>
            clear lines
          </ActionButton>
          <ActionLabel>
            <input model:checked={filters.inlinePreview} />
            inline preview
          </ActionLabel>
          <ActionLabel>
            <input model:checked={filters.hoverPreview} />
            hover preview
          </ActionLabel>
          <ActionLabel>
            <input model:checked={filters.timestamps} />
            timestamps
          </ActionLabel>
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
