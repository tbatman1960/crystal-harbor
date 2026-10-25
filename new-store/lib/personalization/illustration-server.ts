import 'server-only';
import { PersonalizationError } from './errors';
import { db, service, check } from '@/lib/supabase';
import { sessionHash } from './server';
export async function ownedIllustration(id: string) {
  const {
    data: { user },
  } = await db().auth.getUser();
  const { data, error } = await service()
    .from('illustration_jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  check(error);
  if (
    !data ||
    !(data.session_hash === sessionHash() || (user && data.user_id === user.id))
  )
    throw new PersonalizationError(
      'Illustration not found. Use the browser or account that created it.',
    );
  if (new Date(data.created_at).getTime() < Date.now() - 7 * 86400000)
    throw new PersonalizationError(
      'This illustration has expired. Please generate a new one.',
    );
  return data;
}
