import 'server-only';
import { hasStock } from './availability';
import { checkPostalState } from './postal';
import { productTitle } from './catalog-presentation';
import { db, check } from './supabase';
import { settings } from './data';
import { tax, productShipping } from './pricing';
import type { CartItem, Address, Product } from './types';
export async function quote(items: CartItem[], address: Address) {
  await checkPostalState(address);
  const { data, error } = await db()
    .from('products')
    .select('*,product_images(*)')
    .in(
      'id',
      items.map((i) => i.product_id),
    )
    .eq('is_active', true);
  check(error);
  const products = (data || []) as Product[];
  const lines = items.map((item) => {
    const p = products.find((p) => p.id === item.product_id);
    if (!p)
      throw new Error(
        'An item in your cart is no longer available. Remove unavailable items and add your blanket again from the shop.',
      );
    if (!hasStock(p, item.quantity))
      throw new Error('A product has insufficient stock. Update your cart.');
    return {
      product_id: p.id,
      name: productTitle(p),
      sku: p.sku,
      unit_price_cents: p.price_cents,
      quantity: item.quantity,
      shipping_group: p.shipping_group,
      shipping_first_unit_cents: p.shipping_first_unit_cents,
      shipping_additional_unit_cents: p.shipping_additional_unit_cents,
      weight_lbs: Number(p.weight_lbs),
    };
  });
  const subtotal = lines.reduce(
    (n, i) => n + i.unit_price_cents * i.quantity,
    0,
  );
  const s = await settings();
  // Validate the combined blanket limit even when free shipping applies.
  const fixedRate = productShipping(lines);
  return {
    lines,
    subtotal,
    tax: tax(subtotal, address, s),
    rates:
      s.free_shipping_threshold_cents !== null &&
      subtotal >= s.free_shipping_threshold_cents
        ? [{ id: 'free', name: 'Free standard shipping', amount: 0 }]
        : [fixedRate],
    settings: s,
  };
}
