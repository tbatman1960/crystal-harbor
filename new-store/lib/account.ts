import 'server-only';
import { redirect } from 'next/navigation';
import { db, check } from './supabase';
export async function account() {
  const client = db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect('/auth');
  const { data: profile, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  check(error);
  return { client, user, profile };
}
