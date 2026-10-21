import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/supabase';
import { origin, failure } from '@/lib/http';
const input = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/i), password: z.string().min(12).max(100) }).strict();
export async function POST(request: Request) {
  try {
    origin(request);
    const { token, password } = input.parse(await request.json());
    const client = db();
    const { error } = await client.auth.verifyOtp({ token_hash: token, type: 'invite' });
    if (error) return NextResponse.json({ error: 'This invitation is invalid or has expired. Request a new invitation.' }, { status: 400 });
    const { error: updateError } = await client.auth.updateUser({ password });
    if (updateError) {
      await client.auth.signOut();
      return NextResponse.json({ error: 'Password could not be saved. Use the password reset link on the sign-in page.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return failure(e); }
}
