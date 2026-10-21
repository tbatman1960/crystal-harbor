import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertPaymentMode } from '../lib/payment-mode';
test('preview hosts and deployment contexts reject inherited live keys', () => {
  assert.throws(
    () =>
      assertPaymentMode(
        'sk_live_example',
        'https://deploy-preview-1--crystal-harbor.netlify.app',
      ),
    /test-mode/,
  );
  for (const context of ['deploy-preview', 'branch-deploy'])
    assert.throws(
      () =>
        assertPaymentMode(
          'sk_live_example',
          'https://shop.example.com',
          context,
        ),
      /test-mode/,
    );
});
test('test keys work in preview and production live keys remain supported', () => {
  assert.doesNotThrow(() =>
    assertPaymentMode(
      'sk_test_example',
      'https://deploy-preview-1--crystal-harbor.netlify.app',
      'deploy-preview',
    ),
  );
  assert.doesNotThrow(() =>
    assertPaymentMode(
      'sk_live_example',
      'https://shop.example.com',
      'production',
    ),
  );
});
