import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { service, check } from '@/lib/supabase';
import { drainEmails } from '@/lib/email';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  let event;
  try {
    event = stripe().webhooks.constructEvent(
      await req.text(),
      req.headers.get('stripe-signature') || '',
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new NextResponse('Invalid signature', { status: 400 });
  }
  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      if (
        s.payment_status !== 'paid' ||
        s.currency !== 'usd' ||
        !s.metadata?.draft_id
      )
        throw new Error('Invalid paid session');
      const { error } = await service().rpc('complete_personalized_checkout', {
        p_id: s.metadata.draft_id,
        p_session: s.id,
        p_total: s.amount_total,
      });
      check(error);
    } else if (event.type === 'checkout.session.expired') {
      const id = event.data.object.metadata?.draft_id;
      if (id) {
        const { error } = await service().rpc('release_checkout', { p_id: id });
        check(error);
      }
    }
    await drainEmails();
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook processing failed', e);
    return new NextResponse('Retry webhook', { status: 500 });
  }
}
