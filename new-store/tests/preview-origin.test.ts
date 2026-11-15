import { test } from 'node:test';
import assert from 'node:assert/strict';
import { origin, OriginError } from '../lib/http';
import { siteUrl } from '../lib/site-url';

test('preview accepts its configured page origin even when a runtime deploy alias differs', () => {
  const names = ['SITE_URL', 'CONTEXT', 'DEPLOY_PRIME_URL'] as const;
  const before = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  try {
    process.env.SITE_URL =
      'https://deploy-preview-5--crystal-harbor.netlify.app';
    process.env.CONTEXT = 'deploy-preview';
    process.env.DEPLOY_PRIME_URL = 'https://different-deploy-alias.netlify.app';
    assert.equal(siteUrl(), process.env.SITE_URL);
    assert.doesNotThrow(() =>
      origin(
        new Request(process.env.SITE_URL + '/api/illustrations', {
          headers: { Origin: process.env.SITE_URL! },
        }),
      ),
    );
    assert.throws(
      () =>
        origin(
          new Request(process.env.SITE_URL + '/api/illustrations', {
            headers: { Origin: 'https://unrelated.example' },
          }),
        ),
      OriginError,
    );
    assert.throws(
      () => origin(new Request(process.env.SITE_URL + '/api/illustrations')),
      OriginError,
    );
  } finally {
    for (const k of names) {
      if (before[k] === undefined) delete process.env[k];
      else process.env[k] = before[k];
    }
  }
});
