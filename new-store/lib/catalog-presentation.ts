import type { Product } from './types';
export function productTitle(product: Pick<Product, 'name' | 'size_label'>) {
  return product.size_label
    ? `${product.name} — ${product.size_label}`
    : product.name;
}
/** Group optional design families; unrelated future products remain individual cards. */
export function groupCatalog(products: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.design_slug
      ? `design:${product.design_slug}`
      : `product:${product.id}`;
    groups.set(key, [...(groups.get(key) || []), product]);
  }
  return [...groups.values()].map((variants) => {
    const available = variants.filter((p) => p.inventory_count > 0);
    const choices = available.length ? available : variants;
    const product = [...choices].sort(
      (a, b) => a.price_cents - b.price_cents || a.slug.localeCompare(b.slug),
    )[0];
    return { product, sizeCount: variants.length };
  });
}
