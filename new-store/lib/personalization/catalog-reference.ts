import type { Product } from '../types';
export function catalogImage(product: Pick<Product, 'product_images'>) {
  return (
    [...product.product_images].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        a.sort_order - b.sort_order,
    )[0]?.url || ''
  );
}
export function safeCatalogReference(image: string, supabaseUrl: string) {
  const u = new URL(image),
    base = new URL(supabaseUrl);
  if (
    u.protocol !== 'https:' ||
    u.origin !== base.origin ||
    !u.pathname.startsWith('/storage/v1/object/public/products/') ||
    u.username ||
    u.password ||
    u.hash ||
    u.search
  )
    throw new Error('Invalid catalog reference');
  return u.toString();
}
