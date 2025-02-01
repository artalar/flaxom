import { expect, expectTypeOf, it } from "vitest";
import { AtomMut, NumberAtom, reatomZod } from ".";
import { z } from "zod";
import { StringAtom } from "@reatom/primitives";

it("right types for basic schema", async () => {
	const schema = z.object({
		n: z.number(),
		s: z.string(),
		readonly: z.string().readonly(),
		nullable: z.string().nullable(),
		optional: z.string().optional(),
	})
	const model = reatomZod(schema)
	type InferedSchema = z.infer<typeof schema>;

	expectTypeOf(model.n).toEqualTypeOf<NumberAtom>()
	expectTypeOf(model.s).toEqualTypeOf<AtomMut<InferedSchema['s']>>()
	expectTypeOf(model.readonly).toEqualTypeOf<InferedSchema['readonly']>()
	expectTypeOf(model.nullable).toEqualTypeOf<AtomMut<InferedSchema['nullable']>>()
	expectTypeOf(model.optional).toEqualTypeOf<AtomMut<InferedSchema['optional']>>()
})

it("right types for catch", async () => {
	const catchSchema = z.string().nullable().catch('');
	const model = reatomZod(catchSchema)
	type InferedSchema = z.infer<typeof catchSchema>;

	expectTypeOf(model).toEqualTypeOf<AtomMut<InferedSchema>>()
})

it("right types for effects", async () => {
	const schema = z.object({
		refine: z.string().nullable().refine((v) => !v || v.length > 0, 'too short'),
		transform: z.string().transform(v => v.length > 3 ? 1337 : v),
		transformedRefine: z.string()
			.transform(v => v.length > 3 ? 1337 : v)
			.refine((v) => typeof v !== 'string' || v.length > 0, 'too short'),
		refinedTransform: z.string()
			.refine((v) => !v || v.length > 0, 'too short')
			.transform(v => v.length > 3 ? 1337 : v)
	})

	const model = reatomZod(schema);
	type InferedSchema = z.infer<typeof schema>;

	expectTypeOf(model.refine).toEqualTypeOf<AtomMut<InferedSchema['refine']>>()
	expectTypeOf(model.transform).toEqualTypeOf<AtomMut<InferedSchema['transform']>>()
	expectTypeOf(model.transformedRefine).toEqualTypeOf<AtomMut<InferedSchema['transformedRefine']>>()
	expectTypeOf(model.refinedTransform).toEqualTypeOf<AtomMut<InferedSchema['refinedTransform']>>()
})

it("right types for brands", async () => {
	const brandSchema = z.union([z.string(), z.number()]).nullish().brand('foo');
	const model = reatomZod(brandSchema)

	expectTypeOf(model).toEqualTypeOf<AtomMut<string | number | null | undefined>>()
})

it("right types for pipeline", async () => {
	const pipelineSchema = z.union([z.number(), z.string(), z.date()]).pipe(z.coerce.date())
	const model = reatomZod(pipelineSchema)
	type InferedSchema = z.infer<typeof pipelineSchema>;

	expectTypeOf(model).toEqualTypeOf<AtomMut<InferedSchema>>()
})

it("right types for lazy", async () => {
	const lazySchema = z.lazy(() => z.object({
		number: z.number(),
		string: z.string(),
	}))

	const model = reatomZod(lazySchema)
	type InferedSchema = z.infer<typeof lazySchema>;

	expectTypeOf(model.number).toEqualTypeOf<NumberAtom>();
	expectTypeOf(model.string).toEqualTypeOf<AtomMut<InferedSchema['string']>>();
})
