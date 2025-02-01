import { test, expect } from "vitest";
import { createTestCtx, mockFn } from "@reatom/testing";
import { ParseAtoms, parseAtoms } from "@reatom/lens";
import { z } from "zod";
import { reatomZod } from "./";

test("base API", async () => {
  const model = reatomZod(
    z.object({ 
      n: z.number(), 
      s: z.string(), 
      readonly: z.string().readonly(),
    }),
    {
      sync: () => {
        track(parseAtoms(ctx, model));
      },
      initState: { n: 42, readonly: "foo" },
    }
  );
  const track = mockFn<[ParseAtoms<typeof model>], any>();
  const ctx = createTestCtx();

  expect(model.readonly).toBe("foo");
  expect(ctx.get(model.n)).toBe(42);

  model.s(ctx, "bar");
  expect(track.lastInput()).toEqual({ n: 42, s: "bar", readonly: "foo" });
});

test("right values for effects", async () => {
  const schema = z.object({
    refine: z.string().nullable().refine((v) => !v || v.length > 0, 'too short'),
    transform: z.string().transform(v => v.length > 3 ? 1337 : v),
  })

  const model = reatomZod(schema, {
    sync: () => {
      track(parseAtoms(ctx, model));
    },
    initState: {
      refine: 'string',
      transform: 1337,
    }
  })
  
  const track = mockFn<[ParseAtoms<typeof model>], any>();
  const ctx = createTestCtx();

  expect(ctx.get(model.refine)).toBe('string')
  expect(ctx.get(model.transform)).toBe(1337)
})

test("right values for catch", async () => {
  const schema = z.object({
    catch: z.string().nullable().catch(''),
  })

  const model = reatomZod(schema, {
    sync: () => {
      track(parseAtoms(ctx, model));
    },
    initState: {
      catch: null,
    }
  })
  
  const track = mockFn<[ParseAtoms<typeof model>], any>();
  const ctx = createTestCtx();

  expect(ctx.get(model.catch)).toBe(null)
})

test("right values for brand", async () => {
  const brandSchema = z.string().nullable().brand('foo');
  const brandedValue = brandSchema.parse('string');

  const schema = z.object({
    brand: brandSchema,
  })

  const model = reatomZod(schema, {
    sync: () => {
      track(parseAtoms(ctx, model));
    },
    initState: {
      brand: brandedValue,
    }
  })
  
  const track = mockFn<[ParseAtoms<typeof model>], any>();
  const ctx = createTestCtx();

  expect(ctx.get(model.brand)).toBe(brandedValue)
})

test("right values for pipeline", async () => {
  const dateValue = new Date();

  const schema = z.object({
    pipeline: z.union([z.number(), z.string(), z.date()]).pipe(z.coerce.date()),
  })

  const model = reatomZod(schema, {
    sync: () => {
      track(parseAtoms(ctx, model));
    },
    initState: {
      pipeline: dateValue,
    }
  })

  const track = mockFn<[ParseAtoms<typeof model>], any>();
  const ctx = createTestCtx();

  expect(ctx.get(model.pipeline)).toBe(dateValue)
})

test("right values for lazy", async () => {
  const lazySchema = z.lazy(() => z.object({
    number: z.number(),
    string: z.string(),
  }))

  const model = reatomZod(lazySchema, {
    sync: () => {
      track(parseAtoms(ctx, model));
    },
    initState: {
      number: 42,
      string: "test",
    }
  })

  const track = mockFn<[ParseAtoms<typeof model>], any>();
  const ctx = createTestCtx();

  expect(ctx.get(model.number)).toBe(42)
  expect(ctx.get(model.string)).toBe("test")
})
