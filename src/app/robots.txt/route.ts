import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crystalharbor.com'
  
  const robots = `User-agent: *
Allow: /

# Disallow admin and API endpoints
Disallow: /admin
Disallow: /api

# Disallow authentication pages
Disallow: /auth

# Disallow debug/test pages
Disallow: /debug-cart
Disallow: /test-pricing

# Allow important pages
Allow: /products
Allow: /cart
Allow: /about
Allow: /contact
Allow: /returns
Allow: /refunds
Allow: /terms
Allow: /privacy

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional - helps reduce server load)
Crawl-delay: 1`

  return new NextResponse(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}