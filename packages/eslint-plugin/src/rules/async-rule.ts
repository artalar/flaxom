import type { Rule } from 'eslint'
import type * as estree from 'estree'
import { reatomFactoryPattern } from '../shared'

export const asyncRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      recommended: true,
      description:
        'Ensures that asynchronous interactions within Reatom functions are wrapped with `ctx.schedule`.',
    },
    fixable: 'code',
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      [`CallExpression[callee.name=${reatomFactoryPattern}] > :matches(ArrowFunctionExpression[async=true], FunctionExpression[async=true]) AwaitExpression`](
        node: estree.AwaitExpression,
      ) {
        const arg = node.argument
        if (
          arg.type === 'CallExpression' &&
          arg.callee.type === 'MemberExpression' &&
          arg.callee.object.type === 'Identifier' &&
          arg.callee.object.name === 'ctx' &&
          arg.callee.property.type === 'Identifier' &&
          arg.callee.property.name === 'schedule'
        ) {
          return
        }

        context.report({
          node,
          message:
            '`ctx.schedule` is missing in an await expression within a Reatom-wrapped function',
          fix: (fixer) => [
            fixer.insertTextBefore(node.argument, 'ctx.schedule(() => '),
            fixer.insertTextAfter(node.argument, ')'),
          ],
        })
      },
    }
  },
}
