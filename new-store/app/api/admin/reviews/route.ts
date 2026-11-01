import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin, service, check } from '@/lib/supabase';
import { origin, failure } from '@/lib/http';
export async function GET() {
  try {
    await admin();
    const { data, error } = await service()
      .from('studio_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    check(error);
    return NextResponse.json(
      { reviews: data },
      { headers: { 'Cache-Control': 'private,no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: Request) {
  try {
    origin(req);
    await admin();
    const v = z
      .object({
        id: z.string().uuid(),
        status: z.enum(['pending', 'published', 'hidden']),
        admin_reply: z.string().trim().max(1000).nullable(),
      })
      .parse(await req.json());
    check(
      (
        await service()
          .from('studio_reviews')
          .update({ status: v.status, admin_reply: v.admin_reply })
          .eq('id', v.id)
      ).error,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
