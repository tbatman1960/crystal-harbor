import type { Product } from './types';
type Stock = Pick<Product, 'track_inventory' | 'inventory_count'>;
export function hasStock(product: Stock, quantity = 1) {
  return (
    product.track_inventory === false || product.inventory_count >= quantity
  );
}
export function quantityLimit(product: Stock, limit = 99) {
  return product.track_inventory === false
    ? limit
    : Math.min(limit, product.inventory_count);
}
