import type { Address, Settings } from './types';
export function tax(subtotal: number, address: Address, s: Settings) {
  return address.state === 'IN'
    ? Math.round(subtotal * Number(s.tax_rate_indiana))
    : 0;
}
export function fallback(subtotal: number, s: Settings) {
  return {
    id: 'fallback',
    name: 'Standard shipping',
    amount: Math.max(
      s.shipping_fallback_minimum_cents,
      Math.round(subtotal * Number(s.shipping_fallback_percent)),
    ),
    fallback: true,
  };
}

export type ProductShippingLine = {
  product_id: string;
  quantity: number;
  shipping_first_unit_cents: number | null;
  shipping_additional_unit_cents: number;
};

/** Each distinct product pays its first-unit charge once, then its additional-unit charge. */
export function productShipping(lines: ProductShippingLine[]) {
  const grouped = new Map<string, ProductShippingLine>();
  for (const line of lines) {
    const first = line.shipping_first_unit_cents;
    const additional = line.shipping_additional_unit_cents;
    if (
      first === null ||
      !Number.isSafeInteger(first) ||
      first < 0 ||
      !Number.isSafeInteger(additional) ||
      additional < 0 ||
      !Number.isSafeInteger(line.quantity) ||
      line.quantity < 1
    ) {
      throw new Error(
        'Shipping is unavailable for a product in your cart. Please contact the store.',
      );
    }
    const existing = grouped.get(line.product_id);
    if (
      existing &&
      (existing.shipping_first_unit_cents !== first ||
        existing.shipping_additional_unit_cents !== additional)
    ) {
      throw new Error('Shipping rates changed. Please refresh your cart.');
    }
    grouped.set(line.product_id, {
      ...line,
      quantity: (existing?.quantity || 0) + line.quantity,
    });
  }
  const amount = [...grouped.values()].reduce(
    (total, line) =>
      total +
      line.shipping_first_unit_cents! +
      (line.quantity - 1) * line.shipping_additional_unit_cents,
    0,
  );
  if (!Number.isSafeInteger(amount))
    throw new Error('Shipping total is too large.');
  return { id: 'product_flat_rate', name: 'Standard shipping', amount };
}
