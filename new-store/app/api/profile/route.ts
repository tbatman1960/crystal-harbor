import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, check } from '@/lib/supabase';
import { addressSchema } from '@/lib/validation';
import { origin, failure } from '@/lib/http';
export async function PUT(req: Request) {
  try {
    origin(req);
    const value = z
      .object({
        full_name: z.string().trim().min(1).max(100),
        default_shipping_address: addressSchema,
      })
      .parse(await req.json());
    const client = db();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    check(
      (await client.from('profiles').update(value).eq('id', user.id)).error,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
