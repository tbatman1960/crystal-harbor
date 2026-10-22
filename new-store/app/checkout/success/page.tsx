import Link from 'next/link';
import { service, check } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { Confirmation } from '@/components/confirmation';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
export default async function Success({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const id = z
    .string()
    .regex(/^cs_[a-zA-Z0-9_]+$/)
    .safeParse(searchParams.session_id);
  if (!id.success)
    return (
      <div className="shell py-16">
        <h1>Checkout</h1>
        <p className="mt-5">No checkout session was provided.</p>
      </div>
    );
  const session = await stripe().checkout.sessions.retrieve(id.data);
  const { data: o, error } = await service()
    .from('orders')
    .select('order_number')
    .eq('stripe_session_id', id.data)
    .maybeSingle();
  check(error);
  const paid = !!o;
  return (
    <div className="shell max-w-3xl py-20 text-center">
      <Confirmation paid={paid} sessionId={id.data} />
      <p className="eyebrow text-clay">A little goodness is headed your way</p>
      <h1 className="mt-6">
        {paid
          ? 'Thank you for your order.'
          : session.payment_status === 'paid'
            ? 'Confirming your order…'
            : 'Payment is being processed.'}
      </h1>
      <p className="my-8">
        {paid
          ? `Your order number is #${o.order_number}. We’ll email your receipt and send another note when your order ships.`
          : 'We’re waiting for secure confirmation from Stripe. This page updates automatically. Your order will also arrive by email.'}
      </p>
      <Link className="btn" href="/shop">
        Back to the collection
      </Link>
    </div>
  );
}
