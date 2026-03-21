import Head from 'next/head'
import { SEOData } from '@/lib/seo'

interface SEOHeadProps {
  seoData: SEOData
  structuredData?: object[]
}

export default function SEOHead({ seoData, structuredData = [] }: SEOHeadProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crystalharbor.com'
  
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      {seoData.keywords && <meta name="keywords" content={seoData.keywords} />}
      
      {/* Canonical URL */}
      {seoData.canonicalUrl && <link rel="canonical" href={seoData.canonicalUrl} />}
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={seoData.ogTitle || seoData.title} />
      <meta property="og:description" content={seoData.ogDescription || seoData.description} />
      <meta property="og:image" content={seoData.ogImage ? `${baseUrl}${seoData.ogImage}` : `${baseUrl}/icons/icon-192x192.png`} />
      <meta property="og:url" content={seoData.canonicalUrl || baseUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Crystal Harbor Trading Company" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoData.ogTitle || seoData.title} />
      <meta name="twitter:description" content={seoData.ogDescription || seoData.description} />
      <meta name="twitter:image" content={seoData.ogImage ? `${baseUrl}${seoData.ogImage}` : `${baseUrl}/icons/icon-192x192.png`} />
      
      {/* Structured Data */}
      {structuredData.map((data, index) => (
        <script 
          key={index}
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} 
        />
      ))}
    </Head>
  )
}