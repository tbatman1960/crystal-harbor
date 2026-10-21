import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkoutSchema } from '@/lib/validation';
import { quote } from '@/lib/checkout';
import { origin, failure } from '@/lib/http';
import { db, service, check } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
export async function POST(req: Request) {
  let draft: string | undefined;
  let stripeAttempted = false;
  try {
    origin(req);
    const v = checkoutSchema.parse(await req.json());
    const q = await quote(v.items, v.address);
    const rate = q.rates.find((r) => r.id === v.shipping_method);
    if (!rate)
      throw new Error('Shipping rate unavailable. Refresh shipping rates.');
    const client = service();
    const {
      data: { user },
    } = await db().auth.getUser();
    const id = crypto.randomUUID();
    const { error } = await client.rpc('reserve_checkout', {
      p_id: id,
      p_user: user?.id || null,
      p_email: v.email,
      p_shipping: v.address,
      p_billing: v.billing,
      p_items: q.lines,
      p_subtotal: q.subtotal,
      p_shipping_cents: rate.amount,
      p_tax: q.tax,
      p_method: rate.name,
    });
    check(error);
    draft = id;
    const st = stripe();
    let customer: string | undefined;
    if (user) {
      const { data: profile } = await client
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();
      customer = profile?.stripe_customer_id || undefined;
      if (!customer) {
        const c = await st.customers.create(
          { email: user.email, metadata: { supabase_id: user.id } },
          { idempotencyKey: `customer-${user.id}` },
        );
        customer = c.id;
        const { error } = await client
          .from('profiles')
          .update({ stripe_customer_id: customer })
          .eq('id', user.id);
        check(error);
      }
    }
    stripeAttempted = true;
    const session = await st.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer,
        customer_email: customer ? undefined : v.email,
        client_reference_id: id,
        metadata: { draft_id: id },
        expires_at: Math.floor(Date.now() / 1000) + 1800,
        billing_address_collection: 'required',
        line_items: [
          ...q.lines.map((i) => ({
            price_data: {
              currency: 'usd',
              product_data: { name: i.name, metadata: { sku: i.sku } },
              unit_amount: i.unit_price_cents,
            },
            quantity: i.quantity,
          })),
          {
            price_data: {
              currency: 'usd',
              product_data: { name: `Shipping — ${rate.name}` },
              unit_amount: rate.amount,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: 'usd',
              product_data: { name: 'Sales tax' },
              unit_amount: q.tax,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_URL}/cart?cancelled=1`,
      },
      { idempotencyKey: id },
    );
    const { error: saveError } = await client
      .from('checkout_drafts')
      .update({ stripe_session_id: session.id })
      .eq('id', id);
    check(saveError);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    if (
      draft &&
      (!stripeAttempted ||
        e instanceof Stripe.errors.StripeInvalidRequestError ||
        e instanceof Stripe.errors.StripeAuthenticationError ||
        e instanceof Stripe.errors.StripePermissionError ||
        e instanceof Stripe.errors.StripeRateLimitError)
    )
      await service().rpc('release_checkout', { p_id: draft });
    return failure(e);
  }
}
