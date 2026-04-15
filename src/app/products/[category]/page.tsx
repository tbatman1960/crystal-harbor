import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCategoryBySlug, getProductsByCategory } from '@/lib/products'

export const dynamic = 'force-dynamic'
import ProductCard from '@/components/products/ProductCard'
import { generateSEOMetadata } from '@/lib/seo'

interface CategoryPageProps {
  params: {
    category: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.category)
  
  if (!category) {
    return {
      title: 'Category Not Found - Crystal Harbor Trading Company',
    }
  }

  const seoData = generateSEOMetadata('category', category)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'

  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords,
    openGraph: {
      title: seoData.ogTitle || seoData.title,
      description: seoData.ogDescription || seoData.description,
      url: `${baseUrl}/products/${category.slug}`,
      siteName: 'Crystal Harbor Trading Company',
      images: [
        {
          url: seoData.ogImage || '/icons/icon-192x192.png',
          width: 192,
          height: 192,
          alt: `Custom ${category.name} - Crystal Harbor Trading Company`
        }
      ],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.ogTitle || seoData.title,
      description: seoData.ogDescription || seoData.description,
      images: [seoData.ogImage || '/icons/icon-192x192.png']
    },
    alternates: {
      canonical: seoData.canonicalUrl
    }
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.category)
  
  if (!category) {
    notFound()
  }

  const products = await getProductsByCategory(category.id)

  return (
    <div className="section-padding bg-background-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-primary-600 mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              {category.description}
            </p>
          )}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="font-display font-semibold text-2xl text-primary-600 mb-4">
              No Products Found
            </h3>
            <p className="text-secondary-600 mb-8">
              We're working on adding products to this category.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}