import type { SupabaseClient } from '@supabase/supabase-js';

export type ActivationType = 'invite' | 'recovery';
export const activationTokenPattern = /^[a-f0-9]{56,64}$/i;

export function activationDestination(value: string | null | undefined) {
  return value === '/studio' ? '/studio' : '/admin';
}

/** Keep the one-time credential in the fragment, out of HTTP logs and referrers.
 * The activation POST verifies it with Supabase before creating a session.
 */
export function editorActivationUrl(base: string, token: string, type: ActivationType) {
  const url = new URL('/auth/activate', base);
  if (url.protocol !== 'https:' || !activationTokenPattern.test(token))
    throw new Error('Invitation link configuration is invalid.');
  url.hash = new URLSearchParams({ token, type, next: '/studio' }).toString();
  return url.toString();
}

/** Generate, but do not send, a Supabase credential. Send our own direct link so
 * Auth's default Site URL or redirect allowlist cannot send invitees to localhost.
 * Existing accounts receive a recovery credential rather than a duplicate account.
 */
export async function createEditorInvitation(
  admin: Pick<SupabaseClient['auth']['admin'], 'generateLink'>,
  email: string,
  base: string,
) {
  let type: ActivationType = 'invite';
  let result = await admin.generateLink({ type, email });
  if (result.error && ['email_exists', 'user_already_exists'].includes(result.error.code || '')) {
    type = 'recovery';
    result = await admin.generateLink({ type, email });
  }
  if (result.error || !result.data.properties?.hashed_token)
    throw new Error('Invitation could not be created.');
  return editorActivationUrl(base, result.data.properties.hashed_token, type);
}
