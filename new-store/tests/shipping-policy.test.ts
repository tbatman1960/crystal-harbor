import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertShippingDestination,
  isRestrictedShippingAddress,
  ShippingDestinationError,
} from '../lib/shipping-policy';
import { addressSchema, checkoutSchema } from '../lib/validation';
test('Indiana shipping is rejected independently of inventory or postal-provider availability', () => {
  for (const postal_code of ['46201', '47906', '46001', '47130-1234']) {
    assert.equal(
      isRestrictedShippingAddress({ state: 'IN', postal_code }),
      true,
    );
    assert.throws(
      () => assertShippingDestination({ state: 'IN', postal_code }),
      ShippingDestinationError,
    );
  }
  assert.throws(
    () => assertShippingDestination({ state: 'IN', postal_code: '90210' }),
    ShippingDestinationError,
  );
});
test('changing the state cannot hide an Indiana shipping ZIP', () => {
  for (const postal_code of ['46001', '46999', '47001', '47997', '46201-1234'])
    assert.throws(
      () => assertShippingDestination({ state: 'OH', postal_code }),
      ShippingDestinationError,
    );
});
test('out-of-state addresses remain eligible, including nearby ZIP regions', () => {
  for (const [state, postal_code] of [
    ['OH', '45014'],
    ['OH', '45801'],
    ['IL', '60601'],
    ['KY', '40202'],
    ['CA', '90210'],
  ])
    assert.doesNotThrow(() =>
      assertShippingDestination({ state, postal_code }),
    );
});
test('Indiana billing is allowed when delivery is outside Indiana', () => {
  const billing = {
    name: 'Customer Name',
    line1: '123 Main St',
    city: 'Indianapolis',
    state: 'IN',
    postal_code: '46201',
    country: 'US',
  };
  const address = {
    ...billing,
    city: 'Chicago',
    state: 'IL',
    postal_code: '60601',
  };
  assert.equal(addressSchema.safeParse(billing).success, true);
  assert.equal(
    checkoutSchema.safeParse({
      items: [
        { product_id: '11111111-1111-4111-8111-111111111111', quantity: 1 },
      ],
      address,
      billing,
      email: 'customer@example.com',
      shipping_method: 'product_flat_rate',
    }).success,
    true,
  );
  assert.doesNotThrow(() => assertShippingDestination(address));
});
