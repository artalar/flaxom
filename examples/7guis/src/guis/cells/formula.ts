import { Atom, atom } from '@reatom/framework'
import { CellType } from './model'

type Env = Array<Array<CellType>>

export abstract class Formula {
  eval(_cells: Env): Atom<number> {
    return atom(0)
  }
  getReferences(_cells: Env): CellType[] {
    return []
  }
  get hasValue(): boolean {
    return true
  }
}

export class Textual extends Formula {
  constructor(public value: string) {
    super()
  }

  toString() {
    return this.value
  }

  get hasValue(): boolean {
    return false
  }
}

export class Number extends Formula {
  constructor(public value: number) {
    super()
  }

  toString() {
    return this.value.toString()
  }

  eval(_cells: Env): Atom<number> {
    return atom(this.value)
  }
}

export class Coord extends Formula {
  constructor(
    public row: number,
    public col: number,
  ) {
    super()
  }

  toString() {
    return (
      String.fromCharCode('A'.charCodeAt(0) + this.col) + this.row.toString()
    )
  }

  eval(cells: Env): Atom<number> {
    return atom((ctx) => {
      return ctx.spy(cells[this.row][this.col].valueAtom)
    })
  }

  getReferences(cells: Env): CellType[] {
    return [cells[this.row][this.col]]
  }
}

export class Range extends Formula {
  constructor(
    public c1: Coord,
    public c2: Coord,
  ) {
    super()
  }

  toString() {
    return this.c1.toString() + ':' + this.c2.toString()
  }

  get hasValue(): boolean {
    return false
  }

  eval(): never {
    throw new Error('Range cannot be evaluated!')
  }

  getReferences(cells: Env): CellType[] {
    const result = []

    for (let r = this.c1.row; r <= this.c2.row; r++) {
      for (let c = this.c1.col; c <= this.c2.col; c++) {
        result.push(cells[r][c])
      }
    }

    return result
  }
}

type Op = (vals: number[]) => number

const opTable: { [name: string]: Op } = {
  add: (vals: number[]) => vals[0] + vals[1],
  sub: (vals: number[]) => vals[0] - vals[1],
  div: (vals: number[]) => vals[0] / vals[1],
  mul: (vals: number[]) => vals[0] * vals[1],
  mod: (vals: number[]) => vals[0] % vals[1],
  sum: (vals: number[]) => vals.reduce((prev, curr) => prev + curr, 0),
  prod: (vals: number[]) => vals.reduce((prev, curr) => prev * curr, 1),
}

const evalList = (cells: Env, args: Formula[]) => {
  const result: Atom[] = []
  for (const a of args) {
    if (a instanceof Range) {
      for (const c of a.getReferences(cells)) {
        result.push(c.valueAtom)
      }
    } else {
      result.push(a.eval(cells))
    }
  }
  return result
}

export class Application extends Formula {
  constructor(
    public name: string,
    public args: Array<Formula>,
  ) {
    super()
  }

  toString() {
    return this.name + '(' + this.args.map((a) => a.toString()).join(', ') + ')'
  }

  eval(cells: Env): Atom<number> {
    try {
      return atom((ctx) => {
        const list = evalList(cells, this.args)
        const vals = list.map((item) => {
          return ctx.spy(item)
        })
        return opTable[this.name](vals)
      })
    } catch (_err) {
      return atom(NaN)
    }
  }

  getReferences(cells: Env): CellType[] {
    const result: CellType[] = []

    for (const a of this.args) {
      result.concat(a.getReferences(cells))
    }

    return result
  }
}

export const EmptyFormula = new Textual('')
