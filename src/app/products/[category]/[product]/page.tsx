import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getProductBySlug, getCategoryBySlug } from '@/lib/products'
import ProductDetailClient from '@/components/products/ProductDetailClient'
import { generateSEOMetadata, generateProductStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo'

interface ProductPageProps {
  params: {
    category: string
    product: string
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.product)
  
  if (!product) {
    return {
      title: 'Product Not Found - Crystal Harbor Trading Company',
    }
  }

  const seoData = generateSEOMetadata('product', product)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crystalharbor.com'

  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords,
    openGraph: {
      title: seoData.ogTitle || seoData.title,
      description: seoData.ogDescription || seoData.description,
      url: `${baseUrl}/products/${product.category?.slug}/${product.slug}`,
      siteName: 'Crystal Harbor Trading Company',
      images: [
        {
          url: product.image_url || '/icons/icon-192x192.png',
          width: 800,
          height: 600,
          alt: `${product.name} - Custom Printed ${product.category?.name}`
        }
      ],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.ogTitle || seoData.title,
      description: seoData.ogDescription || seoData.description,
      images: [product.image_url || '/icons/icon-192x192.png']
    },
    alternates: {
      canonical: seoData.canonicalUrl
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Verify category exists and matches product
  const category = await getCategoryBySlug(params.category)
  
  if (!category) {
    notFound()
  }

  // Get product with all options and pricing
  const product = await getProductBySlug(params.product)
  
  if (!product || product.category_id !== category.id) {
    notFound()
  }

  // Generate structured data
  const productData = generateProductStructuredData(product)
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: category.name, url: `/products/${category.slug}` },
    { name: product.name, url: `/products/${category.slug}/${product.slug}` }
  ]
  const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs)

  return (
    <>
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
      />
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <ProductDetailClient product={product} category={category} />
    </>
  )
}