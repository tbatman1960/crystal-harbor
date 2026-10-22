import 'server-only';
import { sendTransactionalEmail } from './mail-transport';
import { service, check } from './supabase';
import { settings } from './data';
import { money } from './types';
export async function drainEmails() {
  const client = service();
  const s = await settings();
  const { data: jobs, error } = await client
    .from('email_jobs')
    .select('*')
    .is('sent_at', null)
    .order('created_at')
    .limit(40);
  check(error);
  for (const job of jobs || []) {
    try {
      const { data: o, error: e } = await client
        .from('orders')
        .select('*,order_items(*)')
        .eq('id', job.order_id)
        .single();
      check(e);
      const shipping = job.kind === 'shipping';
      const subject = shipping
        ? `Your order #${o.order_number} is on its way`
        : job.kind === 'admin'
          ? `New order #${o.order_number}`
          : `Thanks for your order #${o.order_number}`;
      const tracking = job.payload.tracking || o.tracking_number;
      const text = [
        `${s.store_name} — ${subject}`,
        ...o.order_items.map(
          (i: {
            product_name_snapshot: string;
            quantity: number;
            unit_price_cents: number;
          }) =>
            `${i.quantity} × ${i.product_name_snapshot} — ${money(i.unit_price_cents * i.quantity)}`,
        ),
        `Subtotal: ${money(o.subtotal_cents)}`,
        `Shipping (${o.shipping_method}): ${money(o.shipping_cents)}`,
        `Tax: ${money(o.tax_cents)}`,
        `Total: ${money(o.total_cents)}`,
        `Ship to: ${Object.values(o.shipping_address).filter(Boolean).join(', ')}`,
        shipping
          ? `USPS tracking: ${tracking}\nhttps://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tracking)}`
          : 'We will email you when your order ships.',
        `Questions? ${s.store_email}`,
      ].join('\n\n');
      await sendTransactionalEmail({
        to: job.kind === 'admin' ? s.admin_alert_email : o.email,
        replyTo: s.store_email,
        defaultFrom: `${s.store_name} <${s.store_email}>`,
        subject,
        text,
        dedupeKey: job.dedupe_key,
      });
      const { error } = await client
        .from('email_jobs')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', job.id);
      check(error);
    } catch (e) {
      console.error(
        'Email delivery pending',
        job.id,
        e instanceof Error ? e.message : 'Error',
      );
    }
  }
}
