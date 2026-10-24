import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blanketSvg,
  defaultConfig,
  customizationConfig,
  cartKey,
  printDimensions,
} from '../lib/personalization/designs';
import { cartSchema } from '../lib/validation';
test('names and photo inputs cannot inject SVG markup', () => {
  assert.throws(() =>
    blanketSvg({ ...defaultConfig, name: '<script>alert(1)</script>' }),
  );
  assert.throws(() =>
    blanketSvg(defaultConfig, 'https://example.com/private-photo'),
  );
  const svg = blanketSvg({ ...defaultConfig, name: "Jane's" });
  assert.ok(svg.includes('JANE&apos;S'));
  assert.ok(!svg.includes('<script'));
  assert.equal(
    customizationConfig.safeParse({ ...defaultConfig, zoom: 50 }).success,
    false,
  );
});
test('different approved photos of the same size remain separate cart lines', () => {
  const product_id = '11111111-1111-4111-8111-111111111111';
  const a = {
    product_id,
    quantity: 1,
    customization_id: '22222222-2222-4222-8222-222222222222',
  };
  const b = { ...a, customization_id: '33333333-3333-4333-8333-333333333333' };
  assert.equal(
    cartSchema.safeParse([a, b, { product_id, quantity: 1 }]).success,
    true,
  );
  assert.notEqual(cartKey(a), cartKey(b));
  assert.equal(cartSchema.safeParse([a, a]).success, false);
});
test('artwork has the ordered physical dimensions and only supported sizes are accepted', () => {
  assert.deepEqual(printDimensions('Oversized 60 × 80 in'), [60, 80]);
  assert.throws(() => printDimensions('12 × 90'));
  assert.ok(
    blanketSvg(defaultConfig, undefined, [60, 80]).includes(
      'width="60in" height="80in"',
    ),
  );
});
