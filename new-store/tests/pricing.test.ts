import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tax, fallback } from '../lib/pricing';
import {
  addressSchema,
  cartSchema,
  checkoutSchema,
  productSchema,
} from '../lib/validation';
import type { Settings, Address } from '../lib/types';
const s = {
  tax_rate_indiana: 0.08,
  shipping_fallback_percent: 0.12,
  shipping_fallback_minimum_cents: 799,
} as Settings;
const a: Address = {
  name: 'Jane Smith',
  line1: '123 Main St',
  city: 'Indianapolis',
  state: 'IN',
  postal_code: '46201',
  country: 'US',
};
test('Indiana merchandise tax rounds once to cents and is configurable', () => {
  assert.equal(tax(1299, a, s), 104);
  assert.equal(tax(10000, a, { ...s, tax_rate_indiana: 0.07 }), 700);
  assert.equal(tax(10000, { ...a, state: 'CA' }, s), 0);
});
test('fallback applies minimum, then subtotal percentage', () => {
  assert.equal(fallback(1000, s).amount, 799);
  assert.equal(fallback(10000, s).amount, 1200);
  assert.equal(fallback(9999, s).amount, 1200);
});
test('reject duplicate cart rows, excessive quantities and invalid addresses', () => {
  const row = {
    product_id: '8ed12e3b-d16d-457a-b3a2-e2a694cc1d91',
    quantity: 1,
  };
  assert.equal(cartSchema.safeParse([row, row]).success, false);
  assert.equal(
    cartSchema.safeParse([{ ...row, quantity: 100 }]).success,
    false,
  );
  assert.equal(cartSchema.safeParse([{ ...row, quantity: -1 }]).success, false);
  assert.equal(
    addressSchema.safeParse({ ...a, state: 'Indiana' }).success,
    false,
  );
  assert.equal(addressSchema.safeParse({ ...a, country: 'CA' }).success, false);
});
test('checkout cannot accept an empty cart', () => {
  assert.equal(
    checkoutSchema.safeParse({
      items: [],
      address: a,
      billing: a,
      email: 'jane@example.com',
      shipping_method: 'fallback',
    }).success,
    false,
  );
});
test('reject unsafe image URLs and invalid prices', () => {
  const p = {
    name: 'Stone',
    slug: 'stone',
    description: '',
    price_cents: 1200,
    shipping_first_unit_cents: 500,
    shipping_additional_unit_cents: 100,
    sku: 'S1',
    weight_lbs: 0.2,
    inventory_count: 1,
    category_id: null,
    is_active: true,
    images: ['javascript:alert(1)'],
  };
  assert.equal(productSchema.safeParse(p).success, false);
  assert.equal(
    productSchema.safeParse({ ...p, images: [], price_cents: 0 }).success,
    false,
  );
});
