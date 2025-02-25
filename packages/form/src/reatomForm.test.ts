import { test, expect, describe } from 'vitest'
import { createCtx } from '@reatom/core'
import { reatomField, reatomForm, withField } from '.'
import { reatomBoolean } from '@reatom/primitives';

test(`adding and removing fields`, async () => {
	const ctx = createCtx();
	const form = reatomForm(fieldArray => ({
		field: reatomField('initial', 'fieldAtom'),
		list: fieldArray({
			initState: ['initial'],
			create: (ctx, param) => reatomField(param, 'fieldAtom')
		}),
	}));

	expect(ctx.get(form.fields.field)).toBe('initial');
	expect(ctx.get(form.fields.list).size).toBe(1);

	form.fields.list.create(ctx, 'initial');
	expect(ctx.get(form.fields.list).size).toBe(2);

	form.fields.list.clear(ctx);
	expect(ctx.get(form.fields.list).size).toBe(0);
})

test('focus states', () => {
	const ctx = createCtx()
	const form = reatomForm(fieldArray => ({
		field1: { initState: '', validate: () => { } },
		field2: { initState: '', validate: () => { } },
		list: fieldArray({
			initState: ['initial'],
			create: (ctx, param) => reatomField(param, 'fieldAtom')
		}),
	}));

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

	const form = reatomForm(fieldArray => ({
		field1: { initState: '', contract, validateOnChange: true },
		field2: { initState: '', contract, validateOnChange: true },
		rest: fieldArray<string>([])
	}), {
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

	const fieldNoValidationTrigger = rest.create(ctx, '');
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
	const form = reatomForm(fieldArray => ({
		field: { initState: 'initial', validate: () => { } },
		array: fieldArray(['one', 'two', 'free']),
	}), {
		validateOnChange: true
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

describe('fieldArray and array literals as a fieldArray', () => {
	test('flat array literals', () => {
		const ctx = createCtx()
		const form = reatomForm({
			array: ['hey']
		})

		const arrayField = form.fields.array;
		expect(ctx.get(arrayField.array).length).toBe(1);

		const field = ctx.get(arrayField.array)[0]!;
		expect(ctx.get(field.value)).toBe('hey');

		arrayField.create(ctx, 'new');
		expect(ctx.get(arrayField.array).length).toBe(2);

		const newField = ctx.get(arrayField.array)[1]!;
		expect(ctx.get(newField.value)).toBe('new');
	})

	test('nested array literals and using fieldArray deep inside', () => {
		const ctx = createCtx()
		const form = reatomForm(fieldArray => ({
			nestedArray: [
				{
					array: ['hey'],
					emptyArray: new Array<string>(),
					emptyArrayExplicit: fieldArray<string>([])
				}
			]
		}))

		const nestedArray = ctx.get(form.fields.nestedArray.array);
		expect(nestedArray.length).toBe(1);

		const array = nestedArray[0]!.array.array;
		expect(ctx.get(array).length).toBe(1);

		expect(ctx.get(ctx.get(array)[0]!.value)).toBe('hey');

		nestedArray[0]!.array.create(ctx, 'new');
		expect(ctx.get(array).length).toBe(2);

		expect(ctx.get(ctx.get(array)[1]!.value)).toBe('new');

		const emptyArray = nestedArray[0]!.emptyArray.array;
		expect(ctx.get(emptyArray).length).toBe(0);

		const emptyArrayExplicit = nestedArray[0]!.emptyArrayExplicit.array;
		expect(ctx.get(emptyArrayExplicit).length).toBe(0);

		nestedArray[0]!.emptyArray.create(ctx, 'new');
		expect(ctx.get(emptyArray).length).toBe(1);
	})

	test('nested array literals and fieldArray in initState', () => {
		const ctx = createCtx()

		const form = reatomForm(fieldArray => ({		
			addresses: [
				{
					country: '',
					street: '',
					city: '',
					tags: ['defaultTag', 'defaultTag2'],
					phoneNumbers: fieldArray({
						initState: Array<{ number: string, priority: boolean }>(),
						create: (ctx, { number, priority }) => ({
							number,
							priority: reatomBoolean(priority).pipe(withField(priority))
						})
					}),
				}
			]
		}));

		const addresses = ctx.get(form.fields.addresses.array);
		const phoneNumbers = addresses[0]!.phoneNumbers;
		expect(ctx.get(phoneNumbers.array).length).toBe(0);

		phoneNumbers.create(ctx, { number: '778899', priority: true });
		expect(ctx.get(phoneNumbers.array).length).toBe(1);

	})
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

describe('init array with reset', () => {
	test('flat fields with array', () => {
		const ctx = createCtx()
		const form = reatomForm({
			dummy: 1,
			list: [
				{
					kek: 'lel',
					arr: ['1', '2']
				}
			]
		})

		form.reset(ctx, { list: [] })

		expect(ctx.get(form.fields.list.array).length).toEqual(0)

		form.fields.dummy.change(ctx, 2);

		form.reset(ctx, { 
			list: [
				{ kek: 'lel', arr: ['1'] }
			] 
		})

		expect(ctx.get(form.fields.list.array).length).toEqual(1)
		expect(ctx.get(ctx.get(ctx.get(form.fields.list.array)[0]!.arr.array)[0]!.value)).toEqual('1')
		expect(ctx.get(form.fields.dummy)).toEqual(1)
	})

	test('nested fields with array', () => {
		const ctx = createCtx()

		const form = reatomForm({
			list: [
				{
					nestedList: [
						{ number: '123', priority: Boolean(true) }
					]
				}
			]
		})

		form.reset(ctx, {
			list: [
				{
					nestedList: []
				},
				{
					nestedList: [
						{ number: '321', priority: false },
						{ number: '456', priority: true }
					]
				}
			]
		})

		const listArray = ctx.get(form.fields.list.array)
		expect(listArray.length).toEqual(2)

		const firstItemNestedList = ctx.get(listArray[0]!.nestedList.array)
		expect(firstItemNestedList.length).toEqual(0)

		const secondItemNestedList = ctx.get(listArray[1]!.nestedList.array)
		expect(secondItemNestedList.length).toEqual(2)

		const firstNestedItem = secondItemNestedList[0]!
		expect(ctx.get(firstNestedItem.number)).toEqual('321')
		expect(ctx.get(firstNestedItem.priority)).toEqual(false)

		const secondNestedItem = secondItemNestedList[1]!
		expect(ctx.get(secondNestedItem.number)).toEqual('456')
		expect(ctx.get(secondNestedItem.priority)).toEqual(true)
	})
})
