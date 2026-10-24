import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { service, check } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { drainEmails } from '@/lib/email';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const actual = Buffer.from(req.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET || ''}`);
  if (
    !process.env.CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return new NextResponse('Unauthorized', { status: 401 });
  try {
    const client = service();
    const { data, error } = await client
      .from('checkout_drafts')
      .select('id,stripe_session_id')
      .eq('state', 'reserved')
      .lt('created_at', new Date(Date.now() - 3600000).toISOString())
      .limit(100);
    check(error);
    for (const d of data || []) {
      const sessions = d.stripe_session_id
        ? [await stripe().checkout.sessions.retrieve(d.stripe_session_id)]
        : (
            await stripe().checkout.sessions.list({
              created: {
                lt: Math.floor(Date.now() / 1000),
                gte: Math.floor((Date.now() - 86400000) / 1000),
              },
              limit: 100,
            })
          ).data.filter((s) => s.metadata?.draft_id === d.id);
      if (!sessions.length) {
        /* Missing Stripe response can be ambiguous: keep reserved for operator reconciliation. */ continue;
      }
      for (const s of sessions) {
        if (s.status === 'expired') {
          check((await client.rpc('release_checkout', { p_id: d.id })).error);
        }
        if (s.payment_status === 'paid') {
          check(
            (
              await client.rpc('complete_personalized_checkout', {
                p_id: d.id,
                p_session: s.id,
                p_total: s.amount_total,
              })
            ).error,
          );
        }
      }
    }
    await drainEmails();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return new NextResponse('Retry scheduled job', { status: 500 });
  }
}
