// TODO: perhaps a peg parser would be more suggestive / succinct

import {
  Application,
  Coord,
  EmptyFormula,
  Formula,
  Number,
  Range,
  Textual,
} from './formula'

const EPSILON = 0
const EQUALS = 1
const IDENT = 2
const DECIMAL = 3
const OPEN_BRACKET = 4
const CLOSE_BRACKET = 5
const COMMA = 6
const COLON = 7
const CELL = 8

class Token {
  constructor(
    public token: number,
    public sequence: string,
  ) {}
}

class TokenInfo {
  constructor(
    public regex: string,
    public token: number,
  ) {}
}

class Tokenizer {
  tokenInfos = new Array<TokenInfo>()
  tokens = new Array<Token>()

  add(regex: string, token: number) {
    this.tokenInfos.push(new TokenInfo(regex, token))
  }

  tokenize(s: string) {
    this.tokens.length = 0
    while (s !== '') {
      let match = false
      for (const info of this.tokenInfos) {
        const result = s.match('^' + info.regex)
        if (result != null) {
          match = true
          const t = result[0].trim()
          this.tokens.push(new Token(info.token, t))
          s = s.slice(result[0].length)
          break
        }
      }
      if (!match) throw new Error('Unexpected char in input: ' + s)
    }
  }
}

const tokenizer = new Tokenizer()
tokenizer.add('[a-zA-Z_]\\d+', CELL)
tokenizer.add('[a-zA-Z_]\\w*', IDENT)
tokenizer.add('-?\\d+(\\.\\d*)?', DECIMAL)
tokenizer.add('=', EQUALS)
tokenizer.add(',', COMMA)
tokenizer.add(':', COLON)
tokenizer.add('\\(', OPEN_BRACKET)
tokenizer.add('\\)', CLOSE_BRACKET)

export class FormulaParser {
  formulaString = ''
  tokens = new Array<Token>()
  lookahead: Token = null!

  parse(formulaString: string): Formula {
    this.formulaString = formulaString
    try {
      tokenizer.tokenize(formulaString.replace(/\s+/g, ''))
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message)
      } else {
        console.error(err)
      }
    }
    this.tokens = tokenizer.tokens
    if (this.tokens.length === 0) return EmptyFormula
    this.lookahead = this.tokens[0]

    return this.formula()
  }

  private formula(): Formula {
    switch (this.lookahead.token) {
      case DECIMAL: {
        const n = this.lookahead.sequence
        this.nextToken()
        return new Number(parseFloat(n))
      }
      case EQUALS:
        this.nextToken()
        return this.expression()
      case EPSILON:
        return EmptyFormula
      default:
        return new Textual(this.formulaString)
    }
  }

  private expression(): Formula {
    const { token } = this.lookahead
    switch (token) {
      case CELL: {
        const c = this.lookahead.sequence.charCodeAt(0) - 'A'.charCodeAt(0)
        const r = parseInt(this.lookahead.sequence.slice(1))
        this.nextToken()

        const { token } = this.lookahead
        if (token === COLON) {
          // Range
          this.nextToken()
          if (this.lookahead.token === CELL) {
            const c2 = this.lookahead.sequence.charCodeAt(0) - 'A'.charCodeAt(0)
            const r2 = parseInt(this.lookahead.sequence.slice(1))
            this.nextToken()
            return new Range(new Coord(r, c), new Coord(r2, c2))
          } else {
            throw new Error('Incorrect Range: ' + this.lookahead.sequence)
          }
        } else {
          return new Coord(r, c)
        }
      }
      case DECIMAL: {
        const f = parseFloat(this.lookahead.sequence)
        this.nextToken()
        return new Number(f)
      }
      case IDENT:
        return this.application()
      default:
        throw new Error('Incorrect Expression: ' + this.lookahead.sequence)
    }
  }

  private application(): Formula {
    const opName = this.lookahead.sequence
    this.nextToken()

    const { token } = this.lookahead

    if (token !== OPEN_BRACKET) throw new Error('No opening bracket: ' + opName)

    this.nextToken()
    const args = new Array<Formula>()
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.lookahead.token === EPSILON)
        throw new Error('No closing bracket')

      args.push(this.expression())
      if (this.lookahead.token === COMMA) this.nextToken()
      if (this.lookahead.token === CLOSE_BRACKET)
        return new Application(opName, args)
    }
  }

  private nextToken(): void {
    this.tokens.shift()
    if (this.tokens.length === 0) this.lookahead = new Token(EPSILON, '')
    else this.lookahead = this.tokens[0]
  }
}
