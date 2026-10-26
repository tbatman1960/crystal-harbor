import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  printSpecSchema,
  printGeometry,
  fitTransform,
} from '../lib/production/spec';
import {
  printSpecHash,
  printSignature,
  validPrintSignature,
} from '../lib/production/security';
import { makePrintFile } from '../lib/production/render';
test('all advertised sizes have correct print dimensions, bleed and memory bounds', () => {
  for (const [size, w, h] of [
    ['30x40', 4500, 6000],
    ['40x50', 6000, 7500],
    ['50x60', 7500, 9000],
    ['60x80', 9000, 12000],
  ] as const) {
    const spec = printSpecSchema.parse({ size, format: 'png' });
    assert.equal(printGeometry(spec).widthPixels, w);
    assert.equal(printGeometry(spec).heightPixels, h);
  }
  assert.equal(
    printGeometry(
      printSpecSchema.parse({
        size: '60x80',
        format: 'png',
        bleed_inches: 0.125,
      }),
    ).widthInches,
    60.25,
  );
  assert.equal(
    printSpecSchema.safeParse({ size: '60x80', format: 'png', ppi: 300 })
      .success,
    false,
  );
  assert.equal(
    printSpecSchema.safeParse({ size: '60x80', format: 'svg', ppi: 300 })
      .success,
    true,
  );
  assert.equal(printSpecSchema.safeParse({ size: '120x160' }).success, false);
  const contain = fitTransform(100, 100, 200, 100, 'contain');
  assert.deepEqual(contain, { scale: 1, x: 50, y: 0 });
});
test('print background signatures are scoped to the job, attempt and expiry', () => {
  const now = Date.now(),
    expires = now + 60000,
    id = '11111111-1111-4111-8111-111111111111',
    key = 'private',
    sig = printSignature(id, 1, expires, key);
  assert.equal(validPrintSignature(id, 1, expires, sig, key, now), true);
  assert.equal(validPrintSignature(id, 2, expires, sig, key, now), false);
  assert.equal(
    validPrintSignature(id, 1, expires, sig, key, expires + 1),
    false,
  );
  const a = printSpecSchema.parse({ size: '60x80' }),
    b = printSpecSchema.parse({ size: '30x40' });
  assert.notEqual(printSpecHash(a), printSpecHash(b));
});
test('scalable output contains actual vector paths and a physical 60 by 80 inch canvas', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vector-test-'));
  try {
    const source = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="30in" height="40in" viewBox="0 0 300 400"><rect width="300" height="400" fill="#f9cddd"/><circle cx="150" cy="180" r="70" fill="#733569"/><path d="M70 350L150 260L230 350Z" fill="#ffe583"/></svg>',
    );
    const result = await makePrintFile(
      source,
      printSpecSchema.parse({ size: '60x80', format: 'svg' }),
      dir,
    );
    const svg = await readFile(result.filePath, 'utf8');
    assert.ok(svg.includes('width="60in" height="80in"'));
    assert.ok(svg.includes('<path'));
    assert.ok(!/<image\b|data:image|href=/.test(svg));
    assert.ok(result.vector_paths! > 0);
    assert.equal((await sharp(result.proofPath).metadata()).height, 1400);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('raster production files contain the requested pixels and density', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'raster-test-'));
  try {
    const source = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="30in" height="40in" viewBox="0 0 300 400"><rect width="300" height="400" fill="#c3d7b4"/><circle cx="150" cy="180" r="60" fill="#bb5588"/></svg>',
    );
    const result = await makePrintFile(
      source,
      printSpecSchema.parse({ size: '30x40', ppi: 100, format: 'jpg' }),
      dir,
    );
    const metadata = await sharp(result.filePath).metadata();
    assert.equal(metadata.width, 3000);
    assert.equal(metadata.height, 4000);
    assert.equal(metadata.density, 100);
    assert.equal(result.source_sha256.length, 64);
    assert.equal(result.file_sha256.length, 64);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
