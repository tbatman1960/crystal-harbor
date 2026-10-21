import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupCatalog, productTitle } from '../lib/catalog-presentation';
import { sampleProducts } from '../lib/sample-catalog';
import { productSchema } from '../lib/validation';
import type { Product } from '../lib/types';
const p = {
  id: 'small',
  name: 'Space Pals Blanket',
  slug: 'space-small',
  design_slug: 'space-pals',
  size_label: '30 × 40 in',
  price_cents: 2499,
  inventory_count: 4,
} as Product;
test('design sizes share a card but retain independent SKUs and prices', () => {
  const groups = groupCatalog([
    p,
    {
      ...p,
      id: 'large',
      slug: 'space-large',
      size_label: '60 × 80 in',
      price_cents: 4999,
    },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].sizeCount, 2);
  assert.equal(groups[0].product.id, 'small');
});
test('group card chooses an available size when the cheapest size is sold out', () => {
  const groups = groupCatalog([
    { ...p, inventory_count: 0 },
    { ...p, id: 'large', slug: 'space-large', price_cents: 4999 },
  ]);
  assert.equal(groups[0].product.id, 'large');
});
test('future products without design groups remain independent', () => {
  assert.equal(
    groupCatalog([
      { ...p, design_slug: null },
      { ...p, id: 'other', design_slug: null },
    ]).length,
    2,
  );
});
test('size is included in payment and historical order names', () => {
  assert.equal(productTitle(p), 'Space Pals Blanket — 30 × 40 in');
  assert.equal(productTitle({ ...p, size_label: null }), 'Space Pals Blanket');
});
test('seasonal samples have four designs with three unique size-specific SKUs each', () => {
  assert.equal(sampleProducts.length, 12);
  assert.equal(new Set(sampleProducts.map((p) => p.sku)).size, 12);
  assert.equal(new Set(sampleProducts.map((p) => p.slug)).size, 12);
  for (const group of new Set(sampleProducts.map((p) => p.design_slug)))
    assert.equal(
      sampleProducts.filter((p) => p.design_slug === group).length,
      3,
    );
  for (const sample of sampleProducts) {
    const { images, category_slug, ...product } = sample;
    assert.equal(
      productSchema.safeParse({
        ...product,
        category_id: null,
        images: images.map((p) => 'https://example.com' + p),
      }).success,
      true,
    );
  }
});
