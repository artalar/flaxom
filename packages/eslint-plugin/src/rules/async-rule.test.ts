import { RuleTester } from 'eslint'
import { asyncRule } from './async-rule'

const tester = new RuleTester(/* {
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
} */)

tester.run('async-rule', asyncRule, {
  valid: [
    `reatomAsync(async ctx => await ctx.schedule(() => someEffect()))`,
    `reatomAsync(async ctx => { foo(bar(await ctx.schedule(() => someEffect()))) })`,
  ],
  invalid: [
    {
      code: `reatomAsync(async ctx => await someEffect())`,
      errors: [{ message: /`ctx.schedule` is missing/ }],
      output: `reatomAsync(async ctx => await ctx.schedule(() => someEffect()))`,
    },
    {
      code: `reatomAsync(async ctx => { foo(bar(await someEffect())) })`,
      errors: [{ message: /`ctx.schedule` is missing/ }],
      output: `reatomAsync(async ctx => { foo(bar(await ctx.schedule(() => someEffect()))) })`,
    },
  ],
})
