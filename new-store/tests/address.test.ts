import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addressSchema } from '../lib/validation';
import { US_STATES } from '../lib/us-states';
test('address accepts real states, DC, territories and military codes; rejects invented codes', () => {
  const a = {
    name: 'Customer Name',
    line1: '123 Main St',
    city: 'Indianapolis',
    state: 'IN',
    postal_code: '46201',
    country: 'US',
  };
  for (const [state] of US_STATES)
    assert.equal(addressSchema.safeParse({ ...a, state }).success, true);
  for (const state of ['ZZ', 'XY', 'Indiana', 'in'])
    assert.equal(addressSchema.safeParse({ ...a, state }).success, false);
  assert.equal(
    addressSchema.safeParse({ ...a, postal_code: '46201-1234' }).success,
    true,
  );
  assert.equal(
    addressSchema.safeParse({ ...a, postal_code: '123' }).success,
    false,
  );
});
