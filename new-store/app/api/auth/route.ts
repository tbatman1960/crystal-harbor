import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, check } from '@/lib/supabase';
import { origin, failure } from '@/lib/http';
const schema = z.object({
  mode: z.enum(['login', 'register', 'reset', 'update', 'logout']),
  email: z.string().email().optional(),
  password: z.string().min(8, 'Use at least 8 characters').max(100).optional(),
});
export async function POST(req: Request) {
  try {
    origin(req);
    const v = schema.parse(await req.json());
    const client = db();
    let error = null;
    if (v.mode === 'logout') ({ error } = await client.auth.signOut());
    else if (v.mode === 'update') {
      if (!v.password) throw new Error('Password required');
      ({ error } = await client.auth.updateUser({ password: v.password }));
    } else {
      if (!v.email) throw new Error('Email required');
      if (v.mode === 'reset')
        ({ error } = await client.auth.resetPasswordForEmail(v.email, {
          redirectTo: `${process.env.SITE_URL}/auth/callback?next=/auth?mode=update`,
        }));
      else {
        if (!v.password) throw new Error('Password required');
        if (v.mode === 'login')
          ({ error } = await client.auth.signInWithPassword({
            email: v.email,
            password: v.password,
          }));
        else
          ({ error } = await client.auth.signUp({
            email: v.email,
            password: v.password,
            options: {
              emailRedirectTo: `${process.env.SITE_URL}/auth/callback`,
            },
          }));
      }
    }
    if (error)
      throw new Error(
        'Authentication failed. Check your details or try again.',
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
