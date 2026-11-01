import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin, service, check } from '@/lib/supabase';
import { offerSchema } from '@/lib/studio-commerce';
import { origin, failure } from '@/lib/http';
export async function GET() {
  try {
    await admin();
    const client = service();
    const { data: settings, error } = await client
      .from('studio_settings')
      .select('*')
      .eq('id', 1)
      .single();
    check(error);
    const { data: coupons, error: e } = await client
      .from('studio_coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    check(e);
    return NextResponse.json(
      { settings, coupons },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    origin(req);
    await admin();
    const v = offerSchema.parse(await req.json());
    check(
      (await service().from('studio_settings').update(v).eq('id', 1)).error,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    origin(req);
    await admin();
    const v = z
      .object({
        email: z.string().email().max(254),
        percent: z.number().int().min(1).max(50),
        minimum_cents: z.number().int().min(100).max(1000000),
        valid_days: z.number().int().min(1).max(365),
      })
      .parse(await req.json());
    const code = `COZY-${crypto.randomUUID().replaceAll('-', '').toUpperCase()}`;
    check(
      (
        await service()
          .from('studio_coupons')
          .insert({
            email: v.email.toLowerCase(),
            code,
            percent: v.percent,
            minimum_cents: v.minimum_cents,
            expires_at: new Date(
              Date.now() + v.valid_days * 86400000,
            ).toISOString(),
          })
      ).error,
    );
    return NextResponse.json({ code });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: Request) {
  try {
    origin(req);
    await admin();
    const v = z
      .object({ id: z.string().uuid(), active: z.boolean() })
      .parse(await req.json());
    check(
      (
        await service()
          .from('studio_coupons')
          .update({ active: v.active })
          .eq('id', v.id)
      ).error,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
