import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activationDestination, createEditorInvitation, editorActivationUrl } from '../lib/editor-invitation';

const token = 'a'.repeat(64);
const base = 'https://deploy-preview-5--crystal-harbor.netlify.app';
type Admin = Parameters<typeof createEditorInvitation>[0];
// Test only the public result fields consumed from Supabase; no real credentials.
const success = { data: { properties: { hashed_token: token } }, error: null };

test('invitation goes straight to this deploy and keeps the credential out of the request URL', async () => {
  const calls: unknown[] = [];
  const admin = { generateLink: async (v: unknown) => { calls.push(v); return success; } } as unknown as Admin;
  const link = new URL(await createEditorInvitation(admin, 'editor@example.com', base));
  assert.equal(link.origin, base);
  assert.equal(link.pathname, '/auth/activate');
  assert.equal(link.search, '');
  assert.deepEqual(Object.fromEntries(new URLSearchParams(link.hash.slice(1))), { token, type: 'invite', next: '/studio' });
  assert.deepEqual(calls, [{ type: 'invite', email: 'editor@example.com' }]);
});

test('resending an existing account invitation generates a recovery credential', async () => {
  const calls: unknown[] = [];
  const admin = { generateLink: async (v: unknown) => {
    calls.push(v);
    return calls.length === 1 ? { data: null, error: { code: 'email_exists' } } : success;
  } } as unknown as Admin;
  const link = await createEditorInvitation(admin, 'editor@example.com', base);
  assert.match(link, /type=recovery/);
  assert.deepEqual(calls[1], { type: 'recovery', email: 'editor@example.com' });
});

test('service errors do not fall back to another action or expose provider messages', async () => {
  let calls = 0;
  const admin = { generateLink: async () => { calls++; return { data: null, error: { code: 'unexpected_failure', message: 'private detail' } }; } } as unknown as Admin;
  await assert.rejects(createEditorInvitation(admin, 'editor@example.com', base), /^Error: Invitation could not be created\.$/);
  assert.equal(calls, 1);
});

test('invalid tokens and insecure origins cannot produce a sendable setup link', () => {
  assert.throws(() => editorActivationUrl('http://localhost:3000', token, 'invite'));
  assert.throws(() => editorActivationUrl(base, 'not-a-token', 'invite'));
});

test('activation destinations cannot become open redirects and preserve legacy admin setup', () => {
  assert.equal(activationDestination('/studio'), '/studio');
  for (const next of [null, '/admin', 'https://evil.example', '//evil.example', '/studio/../admin'])
    assert.equal(activationDestination(next), '/admin');
});
