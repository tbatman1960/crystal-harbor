import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  if ((process.env.SITE_URL || '').includes('deploy-preview-'))
    return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/designs',
        '/account',
        '/api',
        '/checkout',
        '/cart',
        '/auth',
      ],
    },
    sitemap: `${process.env.SITE_URL || 'http://localhost:3000'}/sitemap.xml`,
  };
}
