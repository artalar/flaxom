import { test, expect } from 'vitest'
import { createCtx } from '@reatom/core'
import { FieldAtom, reatomField, reatomForm } from '.'
import { reatomArray, reatomSet } from '@reatom/primitives';
import exp from 'constants';

test(`adding and removing fields`, async () => {
	const ctx = createCtx();
	const form = reatomForm({
		field: reatomField('initial', 'fieldAtom'),
		list: [
			reatomField('initial', 'fieldAtom')
		],
	}, {
		name: 'testForm',
		onSubmit: () => { }
	});

	expect(ctx.get(form.fields.field)).toBe('initial');
	expect(ctx.get(form.fields.list).size).toBe(1);

	form.fields.list.create(ctx, reatomField('initial', 'fieldAtom'));
	expect(ctx.get(form.fields.list).size).toBe(2);

	form.fields.list.clear(ctx);
	expect(ctx.get(form.fields.list).size).toBe(0);
})

test('focus states', () => {
	const ctx = createCtx()
	const form = reatomForm({
		field1: { initState: '', validate: () => { } },
		field2: { initState: '', validate: () => { } },
		list: [
			reatomField('initial', 'fieldAtom')
		]
	}, {
		name: 'testForm',
		onSubmit: () => { }
	})

	form.fields.field1.change(ctx, 'value')
	form.fields.field2.change(ctx, 'value')

	expect(ctx.get(form.focus)).toEqual({
		active: false,
		dirty: true,
		touched: true,
	})

	form.fields.field1.focus.in(ctx)
	expect(ctx.get(form.focus).active).toBe(true)

	form.fields.field1.focus.out(ctx)
	expect(ctx.get(form.focus).active).toBe(false)
	expect(ctx.get(form.focus).touched).toBe(true)

	form.reset(ctx);

	const list = ctx.get(form.fields.list.array);
	list[0]?.change(ctx, 'value');

	expect(ctx.get(form.focus)).toEqual({
		active: false,
		dirty: true,
		touched: true,
	})

	form.fields.list.clear(ctx);

	expect(ctx.get(form.focus)).toEqual({
		active: false,
		dirty: false,
		touched: false,
	})
})

test('validation states', async () => {
	const ctx = createCtx()

	const contract = (value: string) => {
		if (value === 'errorValue')
			throw new Error('Contract error')
	}

	const form = reatomForm({
		field1: { initState: '', contract, validateOnChange: true },
		field2: { initState: '', contract, validateOnChange: true },
		rest: new Array<FieldAtom<string>>()
	}, {
		name: 'testForm',
		onSubmit: () => { },
		validate: () => {
			throw new Error('Form validation error')
		},
	})

	const { field1, field2, rest } = form.fields

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

	await form.submit(ctx).catch(() => { })
	expect(ctx.get(form.submit.error)?.message).toBe('Form validation error')

	const fieldNoValidationTrigger = reatomField('');
	rest.create(ctx, fieldNoValidationTrigger);

	fieldNoValidationTrigger.change(ctx, 'value');

	expect(ctx.get(form.validation)).toEqual({
		error: undefined,
		meta: undefined,
		triggered: true,
		validating: false,
	})

	rest.clear(ctx);
	field1.change(ctx, 'value')

	expect(ctx.get(form.validation)).toEqual({
		error: undefined,
		meta: undefined,
		triggered: true,
		validating: false,
	})
})

test('default options for fields', async () => {
	const ctx = createCtx()
	const form = reatomForm({
		field: { initState: 'initial', validate: () => { } },
		array: ['one', 'two', 'free']
	}, {
		name: 'testForm',
		validateOnChange: true,
		onSubmit: () => { }
	});

	const { field, array } = form.fields;

	field.change(ctx, 'value');

	expect(ctx.get(field.validation)).toEqual({
		error: undefined,
		meta: undefined,
		triggered: true,
		validating: false,
	})

	ctx.get(array.array).forEach(field => {
		field.change(ctx, 'value');

		expect(ctx.get(field.validation)).toEqual({
			error: undefined,
			meta: undefined,
			triggered: true,
			validating: false,
		})
	});
})


test('reset', () => {
	const ctx = createCtx()
	const form = reatomForm({
		field: { initState: 'initial', validate: () => { } },
	}, {
		name: 'testForm',
		onSubmit: () => { }
	})

	const { field } = form.fields;

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
