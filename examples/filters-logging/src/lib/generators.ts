import { faker } from "@faker-js/faker"

// Types
export interface Product {
  id: string
  name: string
  price: number
  category: string
  brand: string
  model: string
  year: number
  country: string
  rating: number
  discount: number
  shipping: boolean
  material: string
  weight: number
  volume: number
  energyRating: string
  type: string
  shape: string
  specialFeatures: string[]
  image: string
}

export interface FilterOption {
  value: string
  label: string
  disabled?: boolean
}

const techBrands = {
  Electronics: [
    { value: "apple", label: "Apple" },
    { value: "samsung", label: "Samsung" },
    { value: "sony", label: "Sony" },
    { value: "lg", label: "LG" },
    { value: "dell", label: "Dell" },
    { value: "lenovo", label: "Lenovo" },
    { value: "asus", label: "ASUS" },
    { value: "hp", label: "HP" },
  ],
  Software: [
    { value: "microsoft", label: "Microsoft" },
    { value: "adobe", label: "Adobe" },
    { value: "autodesk", label: "Autodesk" },
    { value: "oracle", label: "Oracle" },
    { value: "vmware", label: "VMware" },
    { value: "salesforce", label: "Salesforce" },
    { value: "sap", label: "SAP" },
    { value: "intuit", label: "Intuit" },
  ],
}

const techModels = {
  apple: ["iPhone 15 Pro", "MacBook Pro M3", "iPad Pro", "iMac", "Mac Studio"],
  samsung: ["Galaxy S24 Ultra", "Galaxy Book3", "Galaxy Tab S9", "Odyssey Neo G9"],
  sony: ["PlayStation 5", "WH-1000XM5", "Alpha A7 IV", "Bravia XR A95L"],
  lg: ["OLED G3", "Gram Pro", "UltraGear", "StanbyME"],
  dell: ["XPS 15", "Alienware m18", "UltraSharp U4924DW", "Precision 7680"],
  lenovo: ["ThinkPad X1", "Legion Pro 7i", "Yoga 9i", "ThinkStation P920"],
  asus: ["ROG Zephyrus G14", "ProArt PA348CGV", "ZenBook Pro", "ROG Swift"],
  hp: ["Spectre x360", "Omen 16", "ZBook Fury", 'Envy 34" AiO'],
  microsoft: ["Windows 11", "Office 365", "Visual Studio", "Azure", "SQL Server"],
  adobe: ["Photoshop", "Premiere Pro", "After Effects", "Creative Cloud", "Lightroom"],
  autodesk: ["AutoCAD", "Maya", "3ds Max", "Fusion 360", "Revit"],
  oracle: ["Database", "Cloud Infrastructure", "NetSuite", "JD Edwards"],
  vmware: ["vSphere", "Workstation Pro", "Horizon", "NSX"],
  salesforce: ["Sales Cloud", "Service Cloud", "Marketing Cloud", "Commerce Cloud"],
  sap: ["S/4HANA", "Business One", "SuccessFactors", "Ariba"],
  intuit: ["QuickBooks", "TurboTax", "Mint", "ProConnect"],
}

const countries = [
  "United States",
  "Japan",
  "South Korea",
  "China",
  "Taiwan",
  "Germany",
  "Netherlands",
  "Ireland",
]

// Generator functions
export function generateProducts(count: number = 10): Product[] {
  return Array.from({ length: count }, () => {
    const category = faker.helpers.arrayElement(["Electronics", "Software"])
    const brand = faker.helpers.arrayElement(techBrands[category]).value
    const model = faker.helpers.arrayElement(techModels[brand])

    return {
      id: faker.string.uuid(),
      name: `${brand} ${model}`,
      price: parseFloat(faker.commerce.price({ min: 99, max: 2999 })),
      category,
      brand,
      model,
      year: faker.number.int({ min: 2020, max: 2024 }),
      country: faker.helpers.arrayElement(countries),
      rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
      discount: faker.helpers.arrayElement([0, 0, 0, 10, 15, 20, 25, 30]),
      shipping: faker.helpers.arrayElement([true, true, true, false]),
      material: faker.commerce.productMaterial(),
      weight: faker.number.float({ min: 0.1, max: 10, precision: 0.1 }),
      volume: faker.number.float({ min: 0.1, max: 5, precision: 0.1 }),
      energyRating: faker.helpers.arrayElement(["A+++", "A++", "A+", "A", "B"]),
      type: faker.helpers.arrayElement(["Consumer", "Professional", "Enterprise"]),
      shape: faker.helpers.arrayElement(["Compact", "Standard", "Premium"]),
      specialFeatures: faker.helpers.arrayElements(
        ["Wireless", "Smart Features", "AI-Powered", "Cloud-Connected", "Energy Efficient"],
        { min: 1, max: 3 },
      ),
      image: faker.image.urlLoremFlickr({ category: "technology" }),
    }
  })
}

export async function fetchBrandsByCategory(category: string): Promise<FilterOption[]> {
  console.log("fetchBrandsByCategory", category)
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log("fetchBrandsByCategory end", category)
  return techBrands[category] || []
}

let requests = 0
export async function fetchModelsByBrand(brand: string): Promise<FilterOption[]> {
  console.log("fetchModelsByBrand", brand)
  await new Promise((resolve) => setTimeout(resolve, 2000 - 1000 * requests++))
  requests--
  console.log("fetchModelsByBrand end", brand)
  return (
    techModels[brand]?.map((model) => ({
      value: model.toLowerCase(),
      label: model,
    })) || []
  )
}

export async function fetchCountries(): Promise<FilterOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return countries.map((country) => ({
    value: country.toLowerCase(),
    label: country,
  }))
}

export const defaultFilters = {
  categories: ["Electronics", "Software"] as const,
  years: Array.from({ length: 5 }, (_, i) => 2024 - i),
  countries,
}
