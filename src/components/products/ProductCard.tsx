import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/products'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const categorySlug = product.category?.slug || 'products'
  const productUrl = `/products/${categorySlug}/${product.slug}`

  return (
    <Link href={productUrl} className="card group overflow-hidden">
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden relative">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200">
          <div className="text-secondary-400 text-6xl">📷</div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          {product.category && (
            <span className="text-xs font-semibold text-accent-lime-600 uppercase tracking-wide">
              {product.category.name}
            </span>
          )}
        </div>
        
        <h3 className="font-display font-semibold text-lg text-primary-600 mb-2 group-hover:text-accent-coral-500 transition-colors duration-200">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-secondary-500">Starting at</span>
            <div className="font-semibold text-lg text-neutral-700">
              ${product.base_price.toFixed(2)}
            </div>
          </div>
          
          <div className="text-accent-coral-500 group-hover:text-accent-lime-500 transition-colors duration-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {product.material && (
          <div className="mt-2 text-xs text-secondary-500">
            Material: {product.material}
          </div>
        )}
      </div>
    </Link>
  )
}