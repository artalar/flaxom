import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Star } from "lucide-react"
import { Product } from "@/lib/generators"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  // console.log('Rendering ProductCard:', product.id);

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          {product.discount > 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              -{product.discount}% OFF
            </Badge>
          )}
        </div>
        <div className="p-4">
          <CardTitle className="line-clamp-2 h-14">{product.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
              {product.discount > 0 && (
                <span className="text-sm text-gray-400 line-through ml-2">
                  ${(product.price * (1 + product.discount / 100)).toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center text-yellow-400">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1 text-sm">{product.rating}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{product.brand}</Badge>
            <Badge variant="secondary">{product.category}</Badge>
            <Badge variant="outline">{product.style}</Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Size: {product.size}</p>
            <p>Color: {product.color}</p>
            <p>Model: {product.model}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1">
          {product.specialFeatures.map((feature) => (
            <Badge variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
        <Button className="w-full" size="sm">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}
