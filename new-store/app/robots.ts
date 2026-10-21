import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/account', '/api', '/checkout', '/cart', '/auth'],
    },
    sitemap: `${process.env.SITE_URL || 'http://localhost:3000'}/sitemap.xml`,
  };
}
