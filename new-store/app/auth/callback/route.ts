import { siteUrl } from '@/lib/site-url';
import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { z } from 'zod';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = z
    .string()
    .min(1)
    .max(4096)
    .safeParse(url.searchParams.get('code'));
  const code = parsed.success ? parsed.data : null;
  const next = url.searchParams.get('next');
  if (code) {
    const { error } = await db().auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(next === '/auth?mode=update' ? next : '/account', siteUrl()),
      );
  }
  return NextResponse.redirect(
    new URL('/auth?error=Link+expired.+Please+try+again.', siteUrl()),
  );
}
