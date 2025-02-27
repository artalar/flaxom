import {
  Atom,
  Ctx,
  CtxSpy,
  Fn,
  __count,
  atom,
  isAtom,
  throwReatomError,
} from '@reatom/core'
import { isRec, isShallowEqual, merge } from '@reatom/utils'

type Primitive = null | undefined | string | number | boolean | symbol | bigint

export type BuiltIns = Primitive | Date | RegExp

export type PartialDeep<T> = T extends BuiltIns
  ? T | undefined
  : T extends object
    ? T extends ReadonlyArray<any>
      ? never
      : {
          [K in keyof T]?: PartialDeep<T[K]>
        }
    : unknown

interface Match<Expression = any, State = never, Default = undefined>
  extends Atom<State | Default> {
  is<T, const MatchedExpression extends Expression = Expression>(
    clause:
      | MatchedExpression
      | Atom<MatchedExpression>
      | ((ctx: Ctx, expression: Expression) => boolean),
    statement:
      | T
      | Atom<T>
      | ((ctx: CtxSpy, expression: MatchedExpression) => T),
  ): Match<Expression, State | T, Default>
  with<T, Part extends PartialDeep<Expression>>(
    part: Part,
    statement?:
      | T
      | Atom<T>
      | ((ctx: CtxSpy, expression: Part & Expression) => T),
  ): Match<Exclude<Expression, Part>, T>
  truthy<T>(
    statement: T | Atom<T> | ((ctx: CtxSpy, expression: Expression) => T),
  ): Match<Expression, State | T, Default>
  falsy<T>(
    statement: T | Atom<T> | ((ctx: CtxSpy, expression: Expression) => T),
  ): Match<Expression, State | T, Default>
  default<T = never>(
    statement?: T | Atom<T> | ((ctx: CtxSpy, expression: Expression) => T),
  ): Match<Expression, State, T>
}

export function match<T>(
  expression: T | Atom<T> | ((ctx: CtxSpy) => T),
  name = __count('match'),
): Match<T> {
  type Case = {
    clause: (ctx: CtxSpy, expression: T) => boolean
    statement: {} | Atom | ((ctx: Ctx, expression: T) => any)
  }
  const cases: Array<Case> = []
  let _truthy: Case
  let _falsy: Case
  let _default: Case

  const matchAtom = atom((ctxSpy) => {
    const value = isAtom(expression)
      ? ctxSpy.spy(expression)
      : typeof expression === 'function'
        ? (expression as Fn)(ctxSpy)
        : expression

    const list = [...cases, _truthy, _falsy, _default].filter(Boolean)

    for (const { clause, statement } of list) {
      if (clause(ctxSpy, value)) {
        return isAtom(statement)
          ? ctxSpy.spy(statement)
          : typeof statement === 'function'
            ? statement(ctxSpy, value)
            : statement
      }
    }
    return undefined
  }, name)

  return Object.assign(matchAtom, {
    is(clause: any, statement: any) {
      cases.push({
        clause: isAtom(clause)
          ? (ctx, value) => Object.is(value, ctx.spy(clause))
          : typeof clause === 'function'
            ? clause
            : (ctx, value) => Object.is(value, clause),
        statement,
      })
      return matchAtom
    },
    with(part: any, statement: any) {
      cases.push({
        clause: (ctx, expr) => {
          const visit = (part: any, expr: any) => {
            if (isRec(part)) {
              for (const key in part) {
                if (!visit(part[key], expr[key])) return false
              }
              return true
            }
            return Object.is(part, expr)
          }

          return visit(part, expr)
        },
        statement,
      })
      return matchAtom
    },
    truthy(statement: any) {
      throwReatomError(_truthy, 'the case is already defined')
      _truthy = { clause: (ctx, value) => !!value, statement }
      return matchAtom
    },
    falsy(statement: any) {
      throwReatomError(_falsy, 'the case is already defined')
      _falsy = { clause: (ctx, value) => !value, statement }
      return matchAtom
    },
    default(statement = () => throwReatomError(true, 'no match') as never) {
      throwReatomError(_default, 'the case is already defined')
      _default = { clause: (ctx, value) => true, statement }
      return matchAtom
    },
  }) as Match<T>
}
