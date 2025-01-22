import {
  atom,
  action,
  reatomArray,
  type AtomMut,
  type Ctx,
  type Atom,
  random,
} from '@reatom/framework'
import { type Formula, Textual } from './formula'
import { FormulaParser } from './parser'

export interface CellType {
  name: string
  initialContent: string
  contentAtom: AtomMut<string>
  formulaAtom: AtomMut<Formula>
  editingAtom: Atom<boolean>
  valueAtom: Atom<number>
  displayValueAtom: Atom<string>
  makeSelected(ctx: Ctx): void
  unselect(ctx: Ctx): void
  applyChange(ctx: Ctx): void
  abortEditing(ctx: Ctx): void
}

const reatomCell = (): CellType => {
  const name = `cell#${random(1, 1e10)}`

  const obj: CellType = {
    name,
    initialContent: '',
    contentAtom: atom('', `${name}.contentAtom`),
    formulaAtom: atom(new Textual('') as Formula, `${name}.formulaAtom`),
    editingAtom: atom(
      (ctx) => ctx.spy(selectedCellAtom) === obj,
      `${name}.editingAtom`,
    ),
    valueAtom: atom((ctx) => {
      try {
        const v = ctx.spy(obj.formulaAtom).eval(ctx.spy(cellsAtom))
        return ctx.spy(v)
      } catch (_err) {
        return NaN
      }
    }, `${name}.valueAtom`),
    displayValueAtom: atom((ctx) => {
      const f = ctx.spy(obj.formulaAtom)

      if (f.hasValue) {
        return ctx.spy(obj.valueAtom).toString()
      } else {
        return f.toString()
      }
    }, `${name}.displayValueAtom`),
    makeSelected: action((ctx: Ctx) => {
      selectedCellAtom(ctx, obj)
    }, `${name}.makeSelected`),
    unselect: action((ctx: Ctx) => {
      selectedCellAtom(ctx, null)
    }, `${name}.unselect`),
    applyChange: action((ctx: Ctx) => {
      const next = ctx.get(parserAtom).parse(ctx.get(obj.contentAtom))
      obj.formulaAtom(ctx, next)
    }, `${name}.applyChange`),
    abortEditing: action((ctx: Ctx) => {
      obj.contentAtom(ctx, obj.initialContent)
      obj.unselect(ctx)
    }, `${name}.abortEditing`),
  }

  return obj
}

const initialCells = Array.from({ length: 10 }, () =>
  Array.from({ length: 5 }, () => reatomCell()),
)

export const cellsAtom = reatomArray(initialCells, 'cellsAtom')

export const selectedCellAtom = atom<null | CellType>(null, 'selectedCellAtom')

export const storeAbort = action((ctx) => {
  const selected = ctx.get(selectedCellAtom)
  if (!selected) return
  selected.abortEditing(ctx)
}, 'storeAbort')

export const parserAtom = atom(new FormulaParser(), 'parserAtom')
