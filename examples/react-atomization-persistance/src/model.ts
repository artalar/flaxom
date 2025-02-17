import {
  Action,
  action,
  atom,
  AtomMut,
  ParseAtoms,
  parseAtoms,
  withInit,
  random,
} from '@reatom/framework'

export type Field = {
  id: number
  name: string
  value: AtomMut<string>
  remove: Action
}

const KEY = 'FIELDS'
const fromLS = () => {
  const snap = localStorage.getItem(KEY)
  if (!snap) return []
  const json: ParseAtoms<Array<Field>> = JSON.parse(snap)
  return json.map(({ id, name, value }) => reatomField(id, name, value))
}
const toLS = action((ctx) => {
  const list = parseAtoms(ctx, listAtom)
  localStorage.setItem(KEY, JSON.stringify(list))
}, 'toLS')

const reatomField = (id: number, name: string, value: string): Field => {
  const valueName = `field.value#${name}`
  const field: Field = {
    id,
    name,
    value: atom(value, valueName),
    remove: action(
      (ctx) => listAtom(ctx, (state) => state.filter((el) => el !== field)),
      `${valueName}.remove`,
    ),
  }
  field.value.onChange(toLS)

  return field
}

export const listAtom = atom(new Array<Field>(), 'listAtom').pipe(
  withInit(fromLS),
)
listAtom.onChange(toLS)

export const newFieldAtom = atom('', 'newFieldAtom')

export const createField = action((ctx) => {
  if (!ctx.get(newFieldAtom)) return

  const field = reatomField(random(), ctx.get(newFieldAtom), '')

  newFieldAtom(ctx, '')
  listAtom(ctx, (state) => [...state, field])
}, 'createField')
