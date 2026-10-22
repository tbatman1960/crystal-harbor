import type { MetadataRoute } from 'next';
import { catalog, categories } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  const [p, c] = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? await Promise.all([catalog(), categories()])
    : [[], []];
  return [
    ...['', '/shop', '/about', '/contact', '/policies'].map((path) => ({
      url: `${base}${path}`,
    })),
    ...p.map((p) => ({ url: `${base}/products/${p.slug}` })),
    ...c.map((c) => ({ url: `${base}/shop?category=${c.slug}` })),
  ];
}
