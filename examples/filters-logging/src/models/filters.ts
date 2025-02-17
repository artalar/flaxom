import { atom, reatomEnum, reatomResource, withComputed, withDataAtom } from "@reatom/framework"
import { fetchBrandsByCategory, fetchModelsByBrand, defaultFilters } from "@/lib/generators"

export const category = reatomEnum(defaultFilters.categories, "category")

export const brands = reatomResource(async (ctx) => {
  const categoryState = ctx.spy(category)
  if (!categoryState) return []
  return await ctx.schedule(() => fetchBrandsByCategory(categoryState))
}, "brands").pipe(withDataAtom([]))
export const brand = atom("", "brand").pipe(
  withComputed((ctx) => ctx.spy(brands.dataAtom)[0]?.value ?? ""),
)

export const models = reatomResource(async (ctx) => {
  await ctx.spy(brands.promiseAtom)
  const brandState = ctx.get(brand)
  if (!brandState) return []
  return await ctx.schedule(() => fetchModelsByBrand(brandState))
}, "models").pipe(withDataAtom([]))
export const model = atom("", "model").pipe(
  withComputed((ctx) => ctx.spy(models.dataAtom)[0]?.value ?? ""),
)

export const year = atom(2024, "year")
export const country = atom("", "country")
export const shipping = atom(false, "shipping")
export const hasDiscount = atom(false, "hasDiscount")
export const priceRange = atom<[number, number]>([0, 3000], "priceRange")
export const rating = atom(0, "rating")
export const material = atom("", "material")
export const weight = atom<[number, number]>([0, 10], "weight")
export const volume = atom<[number, number]>([0, 5], "volume")
export const energyRating = atom("", "energyRating")
export const type = atom("", "type")
export const shape = atom("", "shape")
export const specialFeatures = atom<string[]>([], "specialFeatures")
