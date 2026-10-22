import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
export function db() {
  const jar = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (
          values: { name: string; value: string; options: CookieOptions }[],
        ) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server component: middleware refreshes cookies. */
          }
        },
      },
    },
  );
}
export function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function admin() {
  const client = db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data } = await client
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!data?.is_admin) throw new Error('Forbidden');
  return client;
}
export function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
