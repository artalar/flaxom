import { scheduleImportRule } from './schedule-import-rule.ts'
import { RuleTester } from 'eslint'

const tester = new RuleTester(/* {
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
} */)

tester.run('schedule-import-rule', scheduleImportRule, {
  valid: [
    {
      code: `import { wrap } from "@reatom/framework";\nwrap(ctx, () => {})`,
    },
    {
      code: `import { wrap } from "@reatom/framework";\nwrap(ctx, () => 'Dev')`,
    },
    {
      code: `import { schedule } from "@reatom/framework";\nschedule(ctx, () => 'Dev', -1)`,
    },
    {
      code: `import { wrap, schedule } from "@reatom/framework";\nschedule(ctx, () => 'Dev', -1)`,
    },
    {
      code: `import { schedule, wrap } from "@reatom/framework";\nwrap(ctx, () => 'Dev')`,
    },
  ],
  invalid: [
    {
      code: 'ctx.schedule()',
      output: `import { wrap } from "@reatom/framework";\nwrap(ctx, () => {})`,
      errors: [{ message: "Use 'wrap(ctx, cb)' instead of deprecated 'ctx.schedule(cb)'." }],
    },
    {
      code: "ctx.schedule(() => 'Dev')",
      output: `import { wrap } from "@reatom/framework";\nwrap(ctx, () => 'Dev')`,
      errors: [{ message: "Use 'wrap(ctx, cb)' instead of deprecated 'ctx.schedule(cb)'." }],
    },
    {
      code: "ctx.schedule(() => 'Dev', -1)",
      output: `import { schedule } from "@reatom/framework";\nschedule(ctx, () => 'Dev', -1)`,
      errors: [{ message: "Use 'schedule(ctx, cb, n)' instead of deprecated 'ctx.schedule(cb, n)'." }],
    },
    {
      code: `import { schedule } from "@reatom/framework";\nctx.schedule(() => 'Dev', -1)`,
      output: `import { schedule } from "@reatom/framework";\nschedule(ctx, () => 'Dev', -1)`,
      errors: [{ message: "Use 'schedule(ctx, cb, n)' instead of deprecated 'ctx.schedule(cb, n)'." }],
    },
    {
      code: `import { wrap } from "@reatom/framework";\nctx.schedule(() => 'Dev', -1)`,
      output: `import { wrap, schedule } from "@reatom/framework";\nschedule(ctx, () => 'Dev', -1)`,
      errors: [{ message: "Use 'schedule(ctx, cb, n)' instead of deprecated 'ctx.schedule(cb, n)'." }],
    },
    {
      code: `import { schedule } from "@reatom/framework";\nctx.schedule(() => 'Dev')`,
      output: `import { schedule, wrap } from "@reatom/framework";\nwrap(ctx, () => 'Dev')`,
      errors: [{ message: "Use 'wrap(ctx, cb)' instead of deprecated 'ctx.schedule(cb)'." }],
    },
  ],
})
