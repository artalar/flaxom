import * as estree from 'estree'
import { Rule } from 'eslint'
import { patternNames, reatomFactoryPattern } from '../shared'

type Domain = { is: 'absent' } | { is: 'static'; name: string } | { is: 'dynamic'; vary: string }

interface Name {
  domain: Domain
  local: boolean
  object: string | null
  unit: string
}

export const unitNamingRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      recommended: true,
      description: 'Ensures that all Reatom entities are correctly named.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          atomPrefix: {
            type: 'string',
          },
          atomPostfix: {
            type: 'string',
          },
          domainVariable: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    fixable: 'code',
  },

  create(context) {
    const {
      atomPrefix = '',
      atomPostfix = '',
      domainVariable = 'name',
    }: {
      atomPrefix?: string
      atomPostfix?: string
      domainVariable?: string
    } = context.options[0] ?? {}

    const domainScopes = [] as (Domain | null)[]
    const idScopes = [] as (estree.Identifier | null)[]

    return {
      ':matches(VariableDeclarator, Property)'(node: estree.VariableDeclarator | estree.Property) {
        const id = node.type === 'Property' ? node.key : node.id
        idScopes.push(id.type === 'Identifier' ? id : null)
      },
      ':matches(VariableDeclarator, Property):exit'() {
        idScopes.pop()
      },
      [`:function`](node: estree.Function) {
        const declarators =
          node.body.type === 'BlockStatement'
            ? node.body.body.flatMap((statement) => {
                return statement.type === 'VariableDeclaration' ? statement.declarations : []
              })
            : []
        const patterns = [...node.params, ...declarators.map((d) => d.id)]
        const declaresDomain = !!patterns.flatMap(patternNames).find((id) => id.name === domainVariable)

        if (declaresDomain) domainScopes.push({ is: 'dynamic', vary: domainVariable })
        else if ('id' in node && node.id && node.id.name.startsWith('reatom')) {
          domainScopes.push({ is: 'static', name: node.id.name.replace('reatom', '') })
        } else domainScopes.push(null)
      },
      [`:function:exit`]() {
        domainScopes.pop()
      },
      [`CallExpression[callee.name=${reatomFactoryPattern}]`](node: estree.CallExpression) {
        const args = node.arguments
        const nameNode =
          args.length === 2
            ? args[1]
            : args.length === 1 && args[0]!.type === 'ObjectExpression'
            ? args[0].properties.find(({ key }) => key.type === 'Identifier' && key.name === 'name')
            : undefined

        const expectedUnit = idScopes.at(-1)
        if (!expectedUnit) return
        const unitIsProp = (expectedUnit as any).parent.type === 'Property'
        const expectedObject = unitIsProp ? idScopes.at(-2)?.name ?? null : null
        const expectedDomain = domainScopes.findLast((scope) => scope !== null) || { is: 'absent' }

        if (!nameNode) {
          let fix: Rule.ReportFixer | undefined

          if (args.length === 1) {
            const printedName = printName({
              domain: expectedDomain,
              object: expectedObject,
              local: false,
              unit: expectedUnit.name,
            })
            if (args[0]!.type === 'ObjectExpression') {
              const config = args[0]
              if (config.properties.length) {
                const comma = context.sourceCode.getText().endsWith(',') ? '' : ', '
                fix = (fixer) => fixer.insertTextAfter(config.properties.at(-1)!, `${comma}name: ${printedName}`)
              } else {
                fix = (fixer) => fixer.replaceText(config, `{ name: ${printedName} }`)
              }
            } else {
              fix = (fixer) => fixer.insertTextAfter(args[0]!, `, ${printedName}`)
            }
          }

          context.report({
            node,
            message: `"${(node.callee as estree.Identifier).name}" call is missing a name`,
            fix,
          })
          return
        }

        const replaceNameFix = (fixer: Rule.RuleFixer, local = false) =>
          fixer.replaceText(
            nameNode,
            printName({
              domain: expectedDomain,
              object: expectedObject,
              local,
              unit: expectedUnit.name,
            }),
          )

        let parsedName: Name | undefined
        parseName: {
          if (nameNode.type === 'Literal' && typeof nameNode.value === 'string') {
            const matches = nameNode.value.match(/^(?:([\w$]+)\.)?(?:([\w$]+)\.)?(_)?([\w$]+)$/)
            if (!matches) break parseName
            const domainNameMatch = matches[1]
            const objectMatch = matches[2]
            // here we make names like "Atoms.someAtom" where Atoms is expectedObject work
            const domainIsObject = expectedObject && expectedDomain.is === 'absent' && domainNameMatch && !objectMatch
            const domainName = domainIsObject ? null : domainNameMatch
            const object = objectMatch ?? (domainIsObject ? domainNameMatch : null)
            const local = !!matches[3]
            const unit = matches[4]!
            const domain: Domain = domainName ? { is: 'static', name: domainName } : { is: 'absent' }
            parsedName = { domain, object, local, unit }
          }

          if (nameNode.type === 'TemplateLiteral') {
            if (nameNode.expressions.length !== 1) break parseName
            if (nameNode.expressions[0]!.type !== 'Identifier') break parseName
            if (nameNode.quasis.length !== 2) break parseName
            if (nameNode.quasis[0]!.value.raw !== '') break parseName
            if (!nameNode.quasis[1]!.value.raw.startsWith('.')) break parseName
            const domainVary = nameNode.expressions[0].name
            const afterDomain = nameNode.quasis[1]!.value.raw.slice(1)
            const [object, self] = afterDomain.includes('.') ? afterDomain.split('.') : [null, afterDomain]
            const local = self.startsWith('_')
            const unit = afterDomain.slice(local ? 1 : 0).split('.').at(-1)
            parsedName = { domain: { is: 'dynamic', vary: domainVary }, object, local, unit }
          }
        }
        if (!parsedName) {
          context.report({
            node: nameNode,
            message: 'Unit name must be a correctly formatted string literal',
            fix: replaceNameFix,
          })
          return
        }

        let message: string | undefined
        checkName: {
          if (parsedName.unit !== expectedUnit.name) {
            message = `Unit name must be "${expectedUnit.name}"`
            break checkName
          }
          if (JSON.stringify(parsedName.domain) !== JSON.stringify(expectedDomain)) {
            if (expectedDomain.is === 'absent') message = 'Unit must have no domain'
            if (expectedDomain.is === 'dynamic') message = `Unit domain must be derived from "${expectedDomain.vary}"`
            if (expectedDomain.is === 'static') message = `Unit domain must be "${expectedDomain.name}"`
            break checkName
          }
        }
        if (message) {
          context.report({ node: nameNode, message, fix: (fixer) => replaceNameFix(fixer, parsedName.local) })
        }

        if (!parsedName.unit.startsWith(atomPrefix)) {
          context.report({
            node: nameNode,
            message: `Atom name must start with "${atomPrefix}"`,
            fix: (fixer) => [
              fixer.replaceText(
                nameNode,
                printName({ ...parsedName, unit: atomPrefix + parsedName.unit + atomPostfix }),
              ),
              fixer.replaceText(expectedUnit, atomPrefix + expectedUnit.name + atomPostfix),
            ],
          })
        }
        if (!parsedName.unit.endsWith(atomPostfix)) {
          context.report({
            node: nameNode,
            message: `Atom name must end with "${atomPrefix}"`,
            fix: (fixer) => [
              fixer.replaceText(nameNode, printName({ ...parsedName, unit: parsedName.unit + atomPostfix })),
              fixer.replaceText(expectedUnit, expectedUnit.name + atomPostfix),
            ],
          })
        }
      },
    }
  },
}

function printName(name: Name) {
  const base = (name.object ? name.object + '.' : '') + (name.local ? '_' : '') + name.unit
  if (name.domain.is === 'dynamic') return '`${' + name.domain.vary + '}.' + base + '`'
  if (name.domain.is === 'static') return `'${name.domain.name}.${base}'`
  return `'${base}'`
}
