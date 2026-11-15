import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generationSettings,
  generationSignature,
  validGenerationSignature,
  illustrationPrompt,
  illustratedBlanketSvg,
  redrawPortrait,
  IllustrationProviderError,
} from '../lib/personalization/illustration';
import { defaultConfig } from '../lib/personalization/designs';
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
test('generation is off until both explicit activation and a server key exist', () => {
  assert.equal(generationSettings({ OPENAI_API_KEY: 'private' }).ready, false);
  assert.equal(
    generationSettings({ AI_ILLUSTRATION_ENABLED: 'true' }).ready,
    false,
  );
  assert.equal(
    generationSettings({
      AI_ILLUSTRATION_ENABLED: 'true',
      OPENAI_API_KEY: 'private',
    }).ready,
    true,
  );
  assert.equal(
    generationSettings({ AI_ILLUSTRATION_DAILY_LIMIT: '99999' }).dailyLimit,
    100,
  );
});
test('background requests must be signed, current and bounded', () => {
  const now = Date.now(),
    expiry = now + 60000,
    id = '11111111-1111-4111-8111-111111111111',
    secret = 'private';
  const signature = generationSignature(id, expiry, secret);
  assert.equal(
    validGenerationSignature(id, expiry, signature, secret, now),
    true,
  );
  assert.equal(
    validGenerationSignature(id, expiry, signature, 'wrong', now),
    false,
  );
  assert.equal(
    validGenerationSignature(id, expiry, signature, secret, expiry + 1),
    false,
  );
  assert.equal(
    validGenerationSignature(
      id,
      now + 3600000,
      generationSignature(id, now + 3600000, secret),
      secret,
      now,
    ),
    false,
  );
  assert.equal(validGenerationSignature(id, expiry, 'bad', secret, now), false);
});
test('editing uses portrait and original art together and asks for a fully redrawn face', async () => {
  let called = false;
  const fetcher: typeof fetch = async (url, init) => {
    called = true;
    assert.equal(url, 'https://api.openai.com/v1/images/edits');
    const body = init!.body as FormData;
    assert.equal(body.getAll('image[]').length, 2);
    assert.equal(body.get('n'), '1');
    assert.match(String(body.get('prompt')), /Completely REDRAW/);
    assert.match(String(body.get('prompt')), /no pasted photograph/i);
    return Response.json({ data: [{ b64_json: png.toString('base64') }] });
  };
  assert.deepEqual(
    await redrawPortrait(
      Buffer.from('jpeg'),
      png,
      defaultConfig,
      'private',
      'test-model',
      fetcher,
    ),
    png,
  );
  assert.ok(called);
  assert.match(
    illustrationPrompt({ ...defaultConfig, template: 'cosmic' }),
    /astronaut/,
  );
});
test('provider failures are sanitized and never retry billable calls automatically', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls++;
    return Response.json(
      {
        error: {
          code: 'model_not_found',
          message: 'sensitive provider account details',
        },
      },
      { status: 404 },
    );
  };
  await assert.rejects(
    redrawPortrait(
      Buffer.from('jpeg'),
      png,
      defaultConfig,
      'private',
      'test-model',
      fetcher,
    ),
    (e: unknown) =>
      e instanceof IllustrationProviderError &&
      e.code === 'provider_setup' &&
      !e.message.includes('sensitive'),
  );
  assert.equal(calls, 1);
  const failed: typeof fetch = async () => {
    throw new Error('private network detail');
  };
  await assert.rejects(
    redrawPortrait(
      Buffer.from('jpeg'),
      png,
      defaultConfig,
      'private',
      'test-model',
      failed,
    ),
    /generation_timeout/,
  );
});
test('approved illustration embeds the complete generated scene with deterministic name and print size', () => {
  const svg = illustratedBlanketSvg(
    { ...defaultConfig, name: "Jane's" },
    png,
    [60, 80],
  );
  assert.match(svg, /width="60in" height="80in"/);
  assert.match(svg, /JANE&apos;S/);
  assert.ok(!svg.includes('clipPath'));
  assert.ok(!svg.includes('portrait.jpg'));
  assert.ok(svg.includes('data:image/png;base64,'));
  assert.throws(() =>
    illustratedBlanketSvg(defaultConfig, Buffer.from('<script>'), [30, 40]),
  );
});
test('public background endpoint rejects unsigned work before accessing data or the provider', async () => {
  const { default: handler } =
    await import('../netlify/functions/generate-illustration-background');
  const response = await handler(
    new Request('https://example.com/function', {
      method: 'POST',
      body: JSON.stringify({
        id: '11111111-1111-4111-8111-111111111111',
        expires: Date.now() + 60000,
        signature: 'forged',
      }),
    }),
  );
  assert.equal(response.status, 401);
});
