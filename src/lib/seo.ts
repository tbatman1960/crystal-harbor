// SEO utilities for DearPast

export interface SEOData {
  title: string
  description: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  canonicalUrl?: string
}

// Default SEO configuration
export const defaultSEO: SEOData = {
  title: 'DearPast Trading Co. — Custom Printed T-Shirts, Blankets, Banners & Flags',
  description: 'Upload your design, choose your product, and we\'ll handle the rest. Quality custom printing with no minimums. Volume pricing available.',
  keywords: 'custom printing, t-shirts, banners, flags, blankets, personalized products, volume pricing',
  ogImage: '/images/crystal-harbor-og-image.jpg'
}

// Generate structured data for organization
export const generateOrganizationStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DearPast',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'}/icons/icon-192x192.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-CRYSTAL',
      contactType: 'Customer Service',
      availableLanguage: ['English']
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US'
    },
    sameAs: [
      // Add social media URLs when available
    ]
  }
}

// Generate structured data for products
export const generateProductStructuredData = (product: {
  id: string
  name: string
  description: string | null
  base_price: number
  category?: { name: string }
  image_url?: string | null
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Custom printed ${product.name} starting at $${product.base_price.toFixed(2)}. Upload your design and create something unique.`,
    category: product.category?.name || 'Custom Printed Products',
    image: product.image_url ? `${baseUrl}${product.image_url}` : `${baseUrl}/icons/icon-192x192.png`,
    offers: {
      '@type': 'Offer',
      price: product.base_price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'DearPast'
      }
    },
    brand: {
      '@type': 'Brand',
      name: 'DearPast'
    }
  }
}

// Generate breadcrumb structured data
export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{ name: string; url: string }>) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`
    }))
  }
}

// Generate SEO meta tags for different page types
export const generateSEOMetadata = (pageType: string, data?: any): SEOData => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crystal-harbor.netlify.app'
  
  switch (pageType) {
    case 'homepage':
      return {
        title: 'DearPast Trading Co. — Custom Printed T-Shirts, Blankets, Banners & Flags',
        description: 'Upload your design, choose your product, and we\'ll handle the rest. Quality custom printing with no minimums. Volume pricing available.',
        keywords: 'custom printing, t-shirts, banners, flags, blankets, personalized products, volume pricing, no minimum orders',
        ogTitle: 'DearPast Trading Co. — Custom Printed Products',
        ogDescription: 'Quality custom printing with no minimums. Upload your design and create something unique.',
        ogImage: '/images/crystal-harbor-og-image.jpg',
        canonicalUrl: baseUrl
      }
      
    case 'product':
      return {
        title: `${data.name} — Custom Printed ${data.category?.name} | DearPast`,
        description: data.description || `Custom printed ${data.name} starting at $${data.base_price.toFixed(2)}. Upload your design and create something unique. Volume pricing available.`,
        keywords: `custom printing, ${data.name.toLowerCase()}, ${data.category?.name.toLowerCase() || 'custom products'}, personalized products, volume pricing`,
        ogTitle: `${data.name} — Custom Printed ${data.category?.name}`,
        ogDescription: data.description || `Custom printed ${data.name} starting at $${data.base_price.toFixed(2)}`,
        ogImage: data.image_url || '/images/crystal-harbor-og-image.jpg',
        canonicalUrl: `${baseUrl}/products/${data.category?.slug}/${data.slug}`
      }
      
    case 'category':
      return {
        title: `Custom ${data.name} — Volume Pricing Available | DearPast`,
        description: `Browse our selection of custom printed ${data.name.toLowerCase()}. Upload your design, choose from multiple sizes and colors. Volume pricing available with no minimums.`,
        keywords: `custom ${data.name.toLowerCase()}, personalized ${data.name.toLowerCase()}, custom printing, volume pricing, no minimum orders`,
        ogTitle: `Custom ${data.name} — DearPast Trading Co.`,
        ogDescription: `Custom printed ${data.name.toLowerCase()} with volume pricing. Upload your design and create something unique.`,
        ogImage: '/images/crystal-harbor-og-image.jpg',
        canonicalUrl: `${baseUrl}/products/${data.slug}`
      }
      
    case 'cart':
      return {
        title: 'Shopping Cart | DearPast',
        description: 'Review your custom printed products and proceed to checkout. Volume pricing automatically applied.',
        canonicalUrl: `${baseUrl}/cart`
      }
      
    case 'checkout':
      return {
        title: 'Checkout | DearPast',
        description: 'Complete your order for custom printed products. Secure payment processing.',
        canonicalUrl: `${baseUrl}/checkout`
      }
      
    case 'account':
      return {
        title: 'My Account | DearPast',
        description: 'Manage your account and view order history.',
        canonicalUrl: `${baseUrl}/account`
      }
      
    default:
      return defaultSEO
  }
}