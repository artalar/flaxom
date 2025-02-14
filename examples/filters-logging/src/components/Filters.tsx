import { reatomComponent } from "@reatom/npm-react"

import { useFilters } from "@/contexts/FiltersContext"
import { defaultFilters } from "@/lib/generators"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import * as model from "@/models/filters"

function ContextFilters() {
  console.log("Rendering Filters component")
  const filters = useFilters()

  return (
    <div className="w-full space-y-4">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <Select value={filters.category} onValueChange={filters.setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {defaultFilters.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Brand</label>
          <Select
            value={filters.brand}
            onValueChange={filters.setBrand}
            disabled={filters.loadingBrands || !filters.category}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {filters.brandOptions.map((brand) => (
                  <SelectItem key={brand.value} value={brand.value}>
                    {brand.label}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Model</label>
          <Select
            value={filters.model}
            onValueChange={filters.setModel}
            disabled={filters.loadingModels || !filters.brand}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {filters.modelOptions.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <label className="text-sm font-medium">Release Year</label>
          <Select
            value={filters.year.toString()}
            onValueChange={(value) => filters.setYear(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {defaultFilters.years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Production Country</label>
          <Select value={filters.country} onValueChange={filters.setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {defaultFilters.countries.map((country) => (
                <SelectItem key={country} value={country.toLowerCase()}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="shipping"
              checked={filters.shipping}
              onCheckedChange={filters.setShipping}
            />
            <Label htmlFor="shipping">Free Shipping</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="discount"
              checked={filters.hasDiscount}
              onCheckedChange={filters.setHasDiscount}
            />
            <Label htmlFor="discount">On Sale</Label>
          </div>
        </div>

        <Separator />

        <div>
          <label className="text-sm font-medium">Price Range</label>
          <div className="pt-4">
            <Slider
              value={[filters.priceRange[0]]}
              min={0}
              max={3000}
              step={50}
              onValueChange={(value) => filters.setPriceRange([value[0], filters.priceRange[1]])}
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm">${filters.priceRange[0]}</span>
              <span className="text-sm">${filters.priceRange[1]}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Rating</label>
          <Slider
            value={[filters.rating]}
            min={0}
            max={5}
            step={0.5}
            onValueChange={(value) => filters.setRating(value[0])}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">Active Filters</label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Category: {filters.category}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Brand: {filters.brand}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Model: {filters.model}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Year: {filters.year}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Country: {filters.country}
            </Badge>
            {filters.shipping && (
              <Badge variant="secondary" className="text-xs">
                Free Shipping
              </Badge>
            )}
            {filters.hasDiscount && (
              <Badge variant="secondary" className="text-xs">
                On Sale
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ReatomFilters = reatomComponent(function ReatomFilters({ ctx }) {
  return (
    <div className="w-full space-y-4">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <Select value={ctx.spy(model.category)} onValueChange={ctx.bind(model.category)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {defaultFilters.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Brand</label>
          <Select
            value={ctx.spy(model.brand)}
            onValueChange={ctx.bind(model.brand)}
            disabled={!!ctx.spy(model.brands.pendingAtom) || !ctx.spy(model.category)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {ctx.spy(model.brands.dataAtom).map((brand) => (
                  <SelectItem key={brand.value} value={brand.value}>
                    {brand.label}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Model</label>
          <Select
            value={ctx.spy(model.model)}
            onValueChange={ctx.bind(model.model)}
            disabled={!!ctx.spy(model.models.pendingAtom) || !ctx.spy(model.brand)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {ctx.spy(model.models.dataAtom).map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <label className="text-sm font-medium">Release Year</label>
          <Select
            value={ctx.spy(model.year).toString()}
            onValueChange={(value) => model.year(ctx, parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {defaultFilters.years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Production Country</label>
          <Select value={ctx.spy(model.country)} onValueChange={ctx.bind(model.country)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {defaultFilters.countries.map((country) => (
                <SelectItem key={country} value={country.toLowerCase()}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="shipping"
              checked={ctx.spy(model.shipping)}
              onCheckedChange={ctx.bind(model.shipping)}
            />
            <Label htmlFor="shipping">Free Shipping</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="discount"
              checked={ctx.spy(model.hasDiscount)}
              onCheckedChange={ctx.bind(model.hasDiscount)}
            />
            <Label htmlFor="discount">On Sale</Label>
          </div>
        </div>

        <Separator />

        <div>
          <label className="text-sm font-medium">Price Range</label>
          <div className="pt-4">
            <Slider
              value={[ctx.spy(model.priceRange)[0]]}
              min={0}
              max={3000}
              step={50}
              onValueChange={(value) =>
                model.priceRange(ctx, [value[0], ctx.get(model.priceRange)[1]])
              }
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm">${ctx.spy(model.priceRange)[0]}</span>
              <span className="text-sm">${ctx.spy(model.priceRange)[1]}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Rating</label>
          <Slider
            value={[ctx.spy(model.rating)]}
            min={0}
            max={5}
            step={0.5}
            onValueChange={(value) => model.rating(ctx, value[0])}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">Active Filters</label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              Category: {ctx.spy(model.category)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Brand: {ctx.spy(model.brand)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Model: {ctx.spy(model.model)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Year: {ctx.spy(model.year)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Country: {ctx.spy(model.country)}
            </Badge>
            {ctx.spy(model.shipping) && (
              <Badge variant="secondary" className="text-xs">
                Free Shipping
              </Badge>
            )}
            {ctx.spy(model.hasDiscount) && (
              <Badge variant="secondary" className="text-xs">
                On Sale
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export function Filters() {
  return <ContextFilters />
}
