import { test } from 'node:test';
import assert from 'node:assert/strict';
import { smtpConfig } from '../lib/mail-config';
const env = {
  SMTP_HOST: 'smtp.example.com',
  SMTP_USER: 'store@example.com',
  SMTP_PASS: 'test-password',
};
test('SMTP defaults to required STARTTLS on 587 and implicit TLS on 465', () => {
  const normal = smtpConfig(env);
  assert.equal(normal.port, 587);
  assert.equal(normal.secure, false);
  assert.equal(normal.requireTLS, true);
  const secure = smtpConfig({ ...env, SMTP_PORT: '465' });
  assert.equal(secure.secure, true);
  assert.equal(secure.requireTLS, false);
});
test('SMTP validates required configuration without exposing passwords in errors', () => {
  for (const patch of [
    { SMTP_PASS: '' },
    { SMTP_HOST: '' },
    { SMTP_PORT: 'abc' },
    { SMTP_SECURE: 'maybe' },
  ])
    assert.throws(
      () => smtpConfig({ ...env, ...patch }),
      /^Error: SMTP configuration is incomplete or invalid\.$/,
    );
});
