import 'server-only';
import { PersonalizationError } from './errors';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { db, service, check } from '@/lib/supabase';
export const PHOTO_BUCKET = 'personalization-private';
export function sessionHash() {
  const token = cookies().get('snuggle-photo-session')?.value;
  return token && /^[a-f0-9]{64}$/.test(token)
    ? createHash('sha256')
        .update(`${process.env.SITE_URL}:${token}`)
        .digest('hex')
    : null;
}
export function ensurePhotoSession() {
  if (!sessionHash())
    cookies().set('snuggle-photo-session', randomBytes(32).toString('hex'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 180,
    });
  return sessionHash()!;
}
export async function ownedCustomization(
  id: string,
  productId?: string,
  allowExpired = false,
) {
  const client = service();
  const {
    data: { user },
  } = await db().auth.getUser();
  const { data, error } = await client
    .from('personalizations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  check(error);
  if (!data || data.deleting || (productId && data.product_id !== productId))
    throw new PersonalizationError(
      'Personalization not found. Please customize this size again.',
    );
  let allowed =
    data.session_hash === sessionHash() || (!!user && data.user_id === user.id);
  if (!allowed && user) {
    const { data: p } = await db()
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    allowed = !!p?.is_admin;
    if (!allowed) {
      const { data: linked, error: e } = await db()
        .from('order_items')
        .select('id')
        .eq('personalization_id', id)
        .limit(1);
      check(e);
      allowed = !!linked?.length;
    }
  }
  if (!allowed)
    throw new PersonalizationError(
      'Personalization not found. Use the browser or account that created it.',
    );
  // Ordered artwork remains available; abandoned uploads expire after 30 days.
  if (
    !allowExpired &&
    new Date(data.created_at).getTime() < Date.now() - 30 * 86400000
  ) {
    const { data: order, error: e } = await client
      .from('order_items')
      .select('id')
      .eq('personalization_id', id)
      .limit(1);
    check(e);
    if (!order?.length)
      throw new PersonalizationError(
        'This saved design has expired. Please create it again.',
      );
  }
  return data;
}
