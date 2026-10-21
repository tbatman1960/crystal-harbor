import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productShipping, type ProductShippingLine } from '../lib/pricing';
import { productSchema } from '../lib/validation';
const line: ProductShippingLine = {
  product_id: 'bracelet',
  quantity: 1,
  shipping_first_unit_cents: 500,
  shipping_additional_unit_cents: 100,
};
test('first-unit charge is applied once, with an increment for each extra unit', () => {
  assert.equal(productShipping([line]).amount, 500);
  assert.equal(productShipping([{ ...line, quantity: 3 }]).amount, 700);
  assert.equal(productShipping([{ ...line, quantity: 99 }]).amount, 10300);
});
test('different products each pay their own first-unit charge', () => {
  assert.equal(
    productShipping([
      { ...line, quantity: 3 },
      {
        ...line,
        product_id: 'dish',
        quantity: 2,
        shipping_first_unit_cents: 799,
        shipping_additional_unit_cents: 200,
      },
    ]).amount,
    1699,
  );
});
test('zero additional charge keeps the price fixed; two zero rates mean free shipping', () => {
  assert.equal(
    productShipping([
      { ...line, quantity: 10, shipping_additional_unit_cents: 0 },
    ]).amount,
    500,
  );
  assert.equal(
    productShipping([
      {
        ...line,
        quantity: 10,
        shipping_first_unit_cents: 0,
        shipping_additional_unit_cents: 0,
      },
    ]).amount,
    0,
  );
});
test('duplicate product rows cannot charge the first-unit rate twice', () => {
  assert.equal(productShipping([line, { ...line, quantity: 2 }]).amount, 700);
  assert.throws(
    () => productShipping([line, { ...line, shipping_first_unit_cents: 100 }]),
    /rates changed/,
  );
});
test('missing rates fail closed and invalid counts or charges are rejected', () => {
  assert.throws(
    () => productShipping([{ ...line, shipping_first_unit_cents: null }]),
    /unavailable/,
  );
  for (const quantity of [0, -1, 1.5, NaN])
    assert.throws(
      () => productShipping([{ ...line, quantity }]),
      /unavailable/,
    );
  for (const cost of [-1, 1.5, Infinity])
    assert.throws(
      () =>
        productShipping([{ ...line, shipping_additional_unit_cents: cost }]),
      /unavailable/,
    );
});
test('admin shipping input requires valid nonnegative integer cents', () => {
  const p = {
    name: 'Bracelet',
    slug: 'bracelet',
    description: '',
    price_cents: 2000,
    sku: 'B1',
    weight_lbs: 0.1,
    inventory_count: 5,
    category_id: null,
    is_active: true,
    images: [],
    shipping_first_unit_cents: 500,
    shipping_additional_unit_cents: 0,
  };
  assert.equal(productSchema.safeParse(p).success, true);
  assert.equal(
    productSchema.safeParse({ ...p, shipping_first_unit_cents: null }).success,
    false,
  );
  assert.equal(
    productSchema.safeParse({ ...p, shipping_additional_unit_cents: -100 })
      .success,
    false,
  );
  assert.equal(
    productSchema.safeParse({ ...p, shipping_additional_unit_cents: 12.5 })
      .success,
    false,
  );
});
