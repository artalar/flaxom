import React, { createContext, useContext, useState, useEffect } from "react"

import {
  FilterOption,
  fetchBrandsByCategory,
  fetchModelsByBrand,
  defaultFilters,
} from "@/lib/generators"

interface FiltersContextType {
  category: string
  brand: string
  model: string
  year: number
  country: string
  shipping: boolean
  hasDiscount: boolean
  priceRange: [number, number]
  rating: number
  material: string
  weight: [number, number]
  volume: [number, number]
  energyRating: string
  type: string
  shape: string
  specialFeatures: string[]

  brandOptions: FilterOption[]
  modelOptions: FilterOption[]

  loadingBrands: boolean
  loadingModels: boolean

  setCategory: (value: string) => void
  setBrand: (value: string) => void
  setModel: (value: string) => void
  setYear: (value: number) => void
  setCountry: (value: string) => void
  setShipping: (value: boolean) => void
  setHasDiscount: (value: boolean) => void
  setPriceRange: (value: [number, number]) => void
  setRating: (value: number) => void
  setMaterial: (value: string) => void
  setWeight: (value: [number, number]) => void
  setVolume: (value: [number, number]) => void
  setEnergyRating: (value: string) => void
  setType: (value: string) => void
  setShape: (value: string) => void
  setSpecialFeatures: (value: string[]) => void
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState(defaultFilters.categories[0] as string)
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState(2024)
  const [country, setCountry] = useState("")
  const [shipping, setShipping] = useState(false)
  const [hasDiscount, setHasDiscount] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000])
  const [rating, setRating] = useState(0)
  const [material, setMaterial] = useState("")
  const [weight, setWeight] = useState<[number, number]>([0, 10])
  const [volume, setVolume] = useState<[number, number]>([0, 5])
  const [energyRating, setEnergyRating] = useState("")
  const [type, setType] = useState("")
  const [shape, setShape] = useState("")
  const [specialFeatures, setSpecialFeatures] = useState<string[]>([])

  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([])
  const [modelOptions, setModelOptions] = useState<FilterOption[]>([])

  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)

  useEffect(() => {
    if (!category) return

    setLoadingBrands(true)

    fetchBrandsByCategory(category)
      .then((options) => {
        setBrandOptions(options)
        if (options.length > 0) {
          setBrand(options[0].value)
        }
      })
      .finally(() => setLoadingBrands(false))
  }, [category])

  useEffect(() => {
    if (!brand) return

    setLoadingModels(true)

    fetchModelsByBrand(brand)
      .then((options) => {
        setModelOptions(options)
        if (options.length > 0) {
          setModel(options[0].value)
        }
      })
      .finally(() => setLoadingModels(false))
  }, [brand])

  const value = {
    category,
    brand,
    model,
    year,
    country,
    shipping,
    hasDiscount,
    priceRange,
    rating,
    material,
    weight,
    volume,
    energyRating,
    type,
    shape,
    specialFeatures,

    brandOptions,
    modelOptions,

    loadingBrands,
    loadingModels,

    setCategory,
    setBrand,
    setModel,
    setYear,
    setCountry,
    setShipping,
    setHasDiscount,
    setPriceRange,
    setRating,
    setMaterial,
    setWeight,
    setVolume,
    setEnergyRating,
    setType,
    setShape,
    setSpecialFeatures,
  }

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

export function useFilters() {
  const context = useContext(FiltersContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FiltersProvider")
  }
  return context
}
