import { siteUrl } from '@/lib/site-url';
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  if (siteUrl().includes('deploy-preview-'))
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
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
