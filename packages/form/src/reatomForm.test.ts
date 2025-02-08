import { test, expect } from 'vitest'
import { createCtx } from '@reatom/core'
import { reatomForm } from '.'

test(`adding and removing fields`, async () => {  
  const ctx = createCtx();
  const form = reatomForm({ name: 'testForm', onSubmit: () => {} });
  const field = form.reatomField('', 'fieldAtom');
  expect(ctx.get(form.fieldsList).length).toBe(0);

  field.change(ctx, 'value');
  expect(ctx.get(form.fieldsList).length).toBe(1);

  field.remove(ctx);  
  expect(ctx.get(form.fieldsList).length).toBe(0);
})

test('focus states', () => {
  const ctx = createCtx()
  const form = reatomForm({ name: 'testForm', onSubmit: () => {} })
  const field1 = form.reatomField('', 'field1')
  const field2 = form.reatomField('', 'field2')

  field1.change(ctx, 'value')
  field2.change(ctx, 'value')

  expect(ctx.get(form.focus)).toEqual({
    active: false,
    dirty: true,
    touched: true,
  })

  field1.focus.in(ctx)
  expect(ctx.get(form.focus).active).toBe(true)

  field1.focus.out(ctx)
  expect(ctx.get(form.focus).active).toBe(false)
  expect(ctx.get(form.focus).touched).toBe(true)
})

test('validation states', async () => {
  const ctx = createCtx()

  const form = reatomForm({
    name: 'testForm',
    onSubmit: () => {},
    validate: () => {
      throw new Error('Form validation error')
    },
  })

  const contract = (value: string) => {
    if(value === 'errorValue')
      throw new Error('Contract error')
  }

  const field1 = form.reatomField('', {
    name: 'field1',
    contract,
    validateOnChange: true,
  })

  const field2 = form.reatomField('', {
    name: 'field2',
    contract,
    validateOnChange: true,
  })

  field1.change(ctx, 'value')
  field2.change(ctx, 'value')

  expect(ctx.get(form.validation)).toEqual({
    error: undefined,
    meta: undefined,
    triggered: true,
    validating: false,
  })

  field2.change(ctx, 'errorValue')

  expect(ctx.get(form.validation)).toEqual({
    error: 'Contract error',
    meta: undefined,
    triggered: true,
    validating: false,
  })

  field2.reset(ctx);

  await form.submit(ctx).catch(() => {})
  expect(ctx.get(form.submit.error)?.message).toBe('Form validation error')

  const fieldNoValidationTrigger = form.reatomField('', {
    name: 'field3',
    contract,
  });

  fieldNoValidationTrigger.change(ctx, 'value');

  expect(ctx.get(form.validation)).toEqual({
    error: undefined,
    meta: undefined,
    triggered: false,
    validating: false,
  })
})

test('reset', () => {
  const ctx = createCtx()
  const form = reatomForm({ name: 'testForm', onSubmit: () => {} })
  const field = form.reatomField('initial', 'field')

  field.change(ctx, 'value')
  field.focus.in(ctx)
  field.focus.out(ctx)
  field.validation.trigger(ctx)

  form.reset(ctx)

  expect(ctx.get(field)).toBe('initial')
  expect(ctx.get(field.focus)).toEqual({
    active: false,
    dirty: false,
    touched: false,
  })
  expect(ctx.get(field.validation)).toEqual({
    error: undefined,
    meta: undefined,
    triggered: false,
    validating: false,
  })
})
