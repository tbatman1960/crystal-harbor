import Link from 'next/link'
import { getCategories, getProducts } from '@/lib/products'
import ProductCard from '@/components/products/ProductCard'

export const metadata = {
  title: 'Custom Products - Crystal Harbor Trading Company',
  description: 'Browse our selection of custom printed t-shirts, blankets, flags, and banners. Upload your design and create something unique.',
  keywords: 'custom printing, t-shirts, blankets, flags, banners, personalized products',
}

export const revalidate = 300 // Revalidate every 5 minutes

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ])

  return (
    <div className="section-padding bg-background-50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-primary-600 mb-4">
            Custom Products
          </h1>
          <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
            Choose from our wide selection of products and make them uniquely yours. 
            Upload your design, add custom text, or browse our design catalog.
          </p>
        </div>

        {/* Category Navigation */}
        {categories.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display font-semibold text-2xl text-primary-600 mb-6 text-center">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products/${category.slug}`}
                  className="card overflow-hidden text-center hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                >
                  {getCategoryImage(category.slug) ? (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={getCategoryImage(category.slug)!}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="text-3xl pt-6 mb-2 group-hover:scale-110 transition-transform duration-300">
                      {getCategoryIcon(category.slug)}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-lg text-primary-600 group-hover:text-accent-coral-500 transition-colors duration-300">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-secondary-600 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        <div className="mb-8">
          <h2 className="font-display font-semibold text-2xl text-primary-600 mb-6">
            All Products
          </h2>
          
          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
                No Products Available
              </h3>
              <p className="text-secondary-600">
                We're currently updating our product catalog. Please check back soon!
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-accent-lime-500 to-accent-coral-500 rounded-2xl p-8 text-center text-white">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-4">
            Don't See What You're Looking For?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Contact us about custom products or special requests. We're always happy to help!
          </p>
          <Link
            href="/contact"
            className="bg-white text-accent-coral-500 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-block"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

// Helper function to get category icons
function getCategoryIcon(slug: string): string {
  const iconMap: { [key: string]: string } = {
    't-shirts': '👕',
    'blankets': '🏠',
    'banners': '📋',
    'flags': '🏴',
  }
  
  return iconMap[slug] || '📦'
}

// Helper function to get category images
function getCategoryImage(slug: string): string | null {
  const imageMap: { [key: string]: string } = {
    't-shirts': '/images/products/category-tshirts.jpg',
    'blankets': '/images/products/category-blankets.jpg',
    'banners': '/images/products/category-banners.jpg',
    'flags': '/images/products/category-flags.jpg',
  }
  return imageMap[slug] || null
}