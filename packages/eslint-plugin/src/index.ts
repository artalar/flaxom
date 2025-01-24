import { ESLint } from 'eslint'
import { asyncRule } from './rules/async-rule'
import { unitNamingRule } from './rules/unit-naming-rule'
import { scheduleImportRule } from './rules/schedule-import-rule.ts'

const rules = {
  'unit-naming-rule': unitNamingRule,
  'async-rule': asyncRule,
  'schedule-import-rule': scheduleImportRule,
}

export default {
  rules,
  configs: {
    recommended: {
      rules: Object.fromEntries(
        Object.keys(rules).map((ruleName) => {
          return [`@reatom/${ruleName}`, 'error']
        }),
      ),
    },
  },
} satisfies ESLint.Plugin
