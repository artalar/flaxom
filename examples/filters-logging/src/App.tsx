import { useState, useEffect } from "react"
import { FiltersProvider } from "@/contexts/FiltersContext"
import { Filters } from "@/components/Filters"
import { ProductCard } from "@/components/ProductCard"
import { generateProducts, type Product } from "@/lib/generators"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingBag } from "lucide-react"

const useNotifications = () => {
  const [state, setState] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setState((state) => (Math.random() > 0.5 ? state : Math.ceil(Math.random() * 10)))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  DEVTOOLS?.log("notifications", state)

  return state
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const productsPerPage = 9

  useEffect(() => {
    setLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      setProducts(generateProducts(productsPerPage * 3)) // Generate 3 pages worth of products
      setLoading(false)
    }, 500)
  }, [])

  const currentProducts = products.slice((page - 1) * productsPerPage, page * productsPerPage)

  const totalPages = Math.ceil(products.length / productsPerPage)

  const notifications = useNotifications()

  return (
    <FiltersProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-6 w-6" />
                <h1 className="text-xl font-bold">E-commerce Test</h1>
              </div>
              <div className="flex items-center justify-center w-9 h-9 border rounded-md">
                {notifications}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters sidebar */}
            <aside className="lg:w-1/4">
              <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
                <h2 className="text-lg font-semibold mb-6">Filters</h2>
                <Filters />
              </div>
            </aside>

            {/* Products grid */}
            <div className="lg:w-3/4">
              {loading ? (
                <div className="flex justify-center items-center h-96 bg-white rounded-lg shadow-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold">{products.length} Products Found</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {currentProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-center gap-2 mt-8 bg-white p-4 rounded-lg shadow-sm">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center px-4">
                      <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white shadow-sm mt-8">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-gray-600 text-sm">
              © 2024 E-commerce Test. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </FiltersProvider>
  )
}

export default App
