import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasStock, quantityLimit } from '../lib/availability';
test('on-demand blankets are available at zero stock while quantity limits remain', () => {
  const p = { track_inventory: false, inventory_count: 0 };
  assert.equal(hasStock(p, 5), true);
  assert.equal(quantityLimit(p, 5), 5);
});
test('tracked products and legacy products retain real stock limits', () => {
  assert.equal(hasStock({ inventory_count: 0 }), false);
  assert.equal(
    hasStock({ track_inventory: true, inventory_count: 2 }, 3),
    false,
  );
  assert.equal(
    quantityLimit({ track_inventory: true, inventory_count: 2 }, 5),
    2,
  );
});
