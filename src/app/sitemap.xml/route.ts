import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crystalharbor.com'
    
    // Static pages
    const staticPages = [
      { url: baseUrl, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: '1.0' },
      { url: `${baseUrl}/products`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: '0.8' },
      { url: `${baseUrl}/cart`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.5' },
      { url: `${baseUrl}/checkout`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.5' },
      { url: `${baseUrl}/about`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.6' },
      { url: `${baseUrl}/contact`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.6' },
      { url: `${baseUrl}/returns`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.4' },
      { url: `${baseUrl}/refunds`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.4' },
      { url: `${baseUrl}/terms`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.3' },
      { url: `${baseUrl}/privacy`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.3' },
    ]

    // Get all categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('active', true)
      .order('display_order')

    const categoryPages = categories?.map(category => ({
      url: `${baseUrl}/products/${category.slug}`,
      lastmod: category.updated_at,
      changefreq: 'weekly',
      priority: '0.8'
    })) || []

    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select(`
        slug, 
        updated_at,
        category:categories(slug)
      `)
      .eq('active', true)

    const productPages = products?.map(product => {
      // Handle the category relationship safely
      const category = product.category as any
      const categorySlug = category?.slug || 'uncategorized'
      
      return {
        url: `${baseUrl}/products/${categorySlug}/${product.slug}`,
        lastmod: product.updated_at,
        changefreq: 'weekly',
        priority: '0.9'
      }
    }) || []

    // Combine all pages
    const allPages = [...staticPages, ...categoryPages, ...productPages]

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}