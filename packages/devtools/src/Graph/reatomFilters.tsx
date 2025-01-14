import { parseAtoms, assign, LinkedListAtom, Action, atom, Fn, Ctx, noop, action } from '@reatom/framework'
import { h, hf, JSX } from '@reatom/jsx'
import { reatomZod, ZodAtomization } from '@reatom/npm-zod'
import { z } from 'zod'

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

const initState: FiltersJSON = {
  search: { name: '', search: '', type: 'match', color: '#e82020', default: true },
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
    <th
      scope="row"
      css={`
        font-weight: normal;
        text-align: start;
        padding-right: 10px;
      `}
    >
      {filter.name}
    </th>
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
      >
        =
      </FilterButton>
      <FilterButton
        title="not match"
        aria-label="not match"
        disabled={atom((ctx) => ctx.spy(filter.type) === 'mismatch')}
        on:click={filter.type.setMismatch}
      >
        ≠
      </FilterButton>
      <FilterButton
        isInput
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
        css:border={atom((ctx) =>
          ctx.spy(filter.type) === 'highlight' ? '2px solid rgb(21 19 50 / 20%)' : '2px solid transparent',
        )}
        css={`
          font-size: 10px;
          filter: unset;
          border: var(--border);
        `}
      />
      {!(filter.default && filter.name === '') && (
        <FilterButton
          title="exclude"
          aria-label="exclude"
          disabled={atom((ctx) => ctx.spy(filter.type) === 'exclude')}
          on:click={filter.type.setExclude}
          css={`
            font-size: 10px;
          `}
        >
          🗑️
        </FilterButton>
      )}
      <FilterButton
        title={atom((ctx) => (ctx.spy(filter.type) === 'off' ? 'enable' : 'disable'))}
        aria-label={atom((ctx) => (ctx.spy(filter.type) === 'off' ? 'enable' : 'disable'))}
        disabled={atom((ctx) => ctx.spy(filter.type) === 'off')}
        on:click={filter.type.setOff}
      >
        {atom((ctx) => (ctx.spy(filter.type) === 'off' ? 'll' : '◼'))}
      </FilterButton>
    </td>
    <td>
      <input
        id={id}
        placeholder="RegExp"
        model:value={filter.search}
        readonly={filter.default && filter.name === 'private'}
      />
      {!filter.default && (
        <button title="Remove" aria-label="Remove filter" on:click={remove}>
          x
        </button>
      )}
    </td>
  </tr>
)

const FilterButton = ({
  isInput,
  ...props
}: (JSX.IntrinsicElements['button'] & { isInput?: false }) | (JSX.IntrinsicElements['input'] & { isInput: true })) => {
  const Component = isInput ? 'input' : 'button'
  return (
    // @ts-expect-error
    <Component
      {...props}
      css={`
        width: 25px;
        height: 20px;
        padding: 0;
        margin-right: 5px;
        border: 2px solid transparent;
        border-radius: 2px;
        font-size: 14px;
        filter: grayscale(1);
        &[disabled] {
          border: 2px solid rgb(21 19 50 / 20%);
        }
        ${props.css || ''}
      `}
    />
  )
}

export const reatomFilters = (
  {
    list,
    clearLines,
    redrawLines,
    initSize,
  }: {
    list: LinkedListAtom
    clearLines: Action<[], void>
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

  return assign(filters, {
    element: (
      <div>
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
            }}
            css={`
              display: inline-flex;
              align-items: center;
            `}
          >
            <table
              css={`
                width: fit-content;
                margin-left: -15px;
              `}
            >
              <FilterView id={filters.search.search.__reatom.name!} filter={filters.search} remove={noop} />
            </table>
            <button
              css={`
                width: 70px;
              `}
            >
              save
            </button>
          </form>
          <hr
            css={`
              width: 100%;
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
          <input
            title="Search in states"
            aria-label="Search in states"
            model:value={filters.valuesSearch}
            placeholder="Search in states"
            type="search"
            css={`
              width: 200px;
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
            <button
              on:click={clearLines}
              css={`
                background: none;
                border: none;
                cursor: pointer;
                flex-shrink: 0;
              `}
            >
              clear lines
            </button>
            <button
              on:click={list.clear}
              css={`
                background: none;
                border: none;
                cursor: pointer;
                flex-shrink: 0;
              `}
            >
              clear logs
            </button>
            <label
              css={`
                flex-shrink: 0;
                display: flex;
                align-items: center;
              `}
            >
              {atom((ctx) => `size ${ctx.spy(list).size} of `)}
              <input
                model:valueAsNumber={filters.size}
                css:width={atom((ctx) => `${Math.max(3, ctx.spy(filters.size).toString().length)}em`)}
                css={`
                  width: var(--width);
                  background: #ffffff80;
                  border: none;
                  margin-left: 5px;
                `}
              />
            </label>
            <label
              css={`
                flex-shrink: 0;
                display: flex;
                align-items: center;
              `}
            >
              <input model:checked={filters.inlinePreview} />
              inline preview
            </label>
            <label
              css={`
                flex-shrink: 0;
                display: flex;
                align-items: center;
              `}
            >
              <input model:checked={filters.hoverPreview} />
              hover preview
            </label>
            <label
              css={`
                flex-shrink: 0;
                display: flex;
                align-items: center;
              `}
            >
              <input model:checked={filters.timestamps} />
              timestamps
            </label>
          </div>
        </fieldset>
      </div>
    ),
  })
}
