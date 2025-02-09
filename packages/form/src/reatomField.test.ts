import { test, expect, vi, assert } from 'vitest'
import { createCtx } from '@reatom/core'
import { reatomField, withField } from '.'
import { reatomEnum, reatomLinkedList } from '@reatom/primitives';

test(`validateOnChange`, async () => {
  const ctx = createCtx();
  const field = reatomField('', { name: 'fieldAtom', validateOnChange: true });
  const changeFn = vi.fn();
  field.validation.trigger.onCall(() => changeFn());

  field.change(ctx, 'value');
  expect(changeFn).toHaveBeenCalledTimes(1);
})

test(`validateOnBlur`, async () => {
  const ctx = createCtx();
  const field = reatomField('', { name: 'fieldAtom', validateOnBlur: true });
  const blurFn = vi.fn();
  field.validation.trigger.onCall(() => blurFn());

  field.focus.out(ctx);
  expect(blurFn).toHaveBeenCalledTimes(1);
})

test(`keepErrorOnChange`, async () => {
  const ctx = createCtx()
  const validate = () => {
    throw new Error('validation error');
  }

  const fieldWithKeep = reatomField('', {
    name: 'fieldKeep',
    validate,
    keepErrorOnChange: true
  })

  const fieldWithoutKeep = reatomField('', {
    name: 'fieldNoKeep',
    validate,
    keepErrorOnChange: false
  })

  fieldWithKeep.validation.trigger(ctx)
  fieldWithoutKeep.validation.trigger(ctx)

  expect(ctx.get(fieldWithKeep.validation).error).toBe('validation error')
  expect(ctx.get(fieldWithoutKeep.validation).error).toBe('validation error')

  fieldWithKeep.change(ctx, 'new value')
  fieldWithoutKeep.change(ctx, 'new value')

  expect(ctx.get(fieldWithKeep.validation).error).toBe('validation error')
  expect(ctx.get(fieldWithoutKeep.validation).error).toBeUndefined()
})

test(`toState and fromState`, async () => {
  const ctx = createCtx()
  const label = 'label';

  const field = reatomField({ label, value: 1337 }, {
    name: 'fieldAtom',
    fromState: (ctx, state) => state.value,
    toState: (ctx, value) => ({ label, value }),
  });

  field(ctx, { label, value: 1000 });
  expect(ctx.get(field.value)).toEqual(1000);

  field.change(ctx, 2000);
  expect(ctx.get(field)).toEqual({ label, value: 2000 });
})

test(`withField`, async () => {
  const ctx = createCtx()
  const field = reatomEnum(['lel', 'kek', 'shmek'], 'fieldAtom').pipe(withField('lel'));

  field.setLel(ctx);
  expect(ctx.get(field)).toBe('lel');

  expect(field.value.__reatom.name).toBe('fieldAtom.value');
})
