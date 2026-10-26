import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { renderArtwork } from '../lib/personalization/artwork';
import {
  catalogImage,
  safeCatalogReference,
} from '../lib/personalization/catalog-reference';
import {
  customizationConfig,
  customizationLabel,
  defaultConfig,
} from '../lib/personalization/designs';
import {
  illustratedBlanketSvg,
  illustrationPrompt,
  redrawPortrait,
  IllustrationProviderError,
} from '../lib/personalization/illustration';
test('catalog personalization uses the actual print and the selected face scope', () => {
  const c = customizationConfig.parse({
    ...defaultConfig,
    template: 'catalog',
    reference_name: 'Actual blanket',
    face_mode: 'main',
  });
  assert.equal(customizationLabel(c), 'Actual blanket');
  assert.match(illustrationPrompt(c), /actual store product/);
  assert.match(illustrationPrompt(c), /main or most prominent printed/);
  assert.match(
    illustrationPrompt({ ...c, face_mode: 'all' }),
    /prominent faces printed/,
  );
  assert.match(illustrationPrompt(c), /not a product\/lifestyle photograph/);
  assert.doesNotMatch(illustrationPrompt(c), /A joyful pop-music dance stage/);
});
test('catalog references are selected canonically and cannot fetch arbitrary hosts', () => {
  const root = 'https://store.supabase.co';
  const url = root + '/storage/v1/object/public/products/actual.png';
  assert.equal(safeCatalogReference(url, root), url);
  for (const u of [
    'http://127.0.0.1/private',
    'https://evil.example/image.png',
    root + '/auth/v1/admin/users',
    url + '?redirect=evil',
  ])
    assert.throws(() => safeCatalogReference(u, root));
  assert.equal(
    catalogImage({
      product_images: [
        { url: 'second', sort_order: 0, is_primary: false },
        { url: 'primary', sort_order: 2, is_primary: true },
      ],
    }),
    'primary',
  );
});
test('complete approved artwork rasterizes as a standard PNG or JPEG, preserving SVG download', async () => {
  const input = await sharp({
    create: { width: 1024, height: 1536, channels: 3, background: '#bf4888' },
  })
    .png()
    .toBuffer();
  const svg = Buffer.from(
    illustratedBlanketSvg(
      {
        ...defaultConfig,
        template: 'catalog',
        reference_name: 'Actual blanket',
        name: 'Test',
      },
      input,
      [60, 80],
    ),
  );
  const png = await renderArtwork(svg);
  assert.equal(png.mime, 'image/png');
  const m = await sharp(png.bytes).metadata();
  assert.equal(m.height, 1536);
  assert.equal(m.width, 1152);
  const jpg = await renderArtwork(svg, 'jpg');
  assert.equal((await sharp(jpg.bytes).metadata()).format, 'jpeg');
  const original = await renderArtwork(svg, 'svg');
  assert.deepEqual(original.bytes, svg);
  const pixel = await sharp(png.bytes).resize(1, 1).raw().toBuffer();
  assert.ok(pixel[3] === undefined || pixel[3] > 0);
});
test('insufficient API credits have a billing message distinct from busy servers', async () => {
  const fetcher: typeof fetch = async () =>
    Response.json({ error: { code: 'insufficient_quota' } }, { status: 429 });
  await assert.rejects(
    redrawPortrait(
      Buffer.from('test'),
      Buffer.from('test'),
      defaultConfig,
      'private',
      'test-model',
      fetcher,
    ),
    (e: unknown) =>
      e instanceof IllustrationProviderError && e.code === 'provider_billing',
  );
});
