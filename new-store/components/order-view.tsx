import { money } from '@/lib/types';
import type { Address } from '@/lib/types';
export type Order = {
  id: string;
  order_number: number;
  email: string;
  created_at: string;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  shipping_address: Address;
  billing_address: Address;
  shipping_method: string;
  tracking_number: string | null;
  order_items: {
    id: string;
    product_name_snapshot: string;
    product_sku_snapshot: string;
    unit_price_cents: number;
    quantity: number;
  }[];
};
export function OrderView({
  order: o,
  packing = false,
}: {
  order: Order;
  packing?: boolean;
}) {
  const a = o.shipping_address;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl">
          {packing ? 'Packing slip · ' : ''}Order #{o.order_number}
        </h1>
        <p className="mt-3 text-sm">
          {new Date(o.created_at).toLocaleDateString('en-US', {
            timeZone: 'UTC',
          })}{' '}
          · <span className="capitalize">{o.status}</span>
        </p>
        <p className="mt-2">{o.email}</p>
      </div>
      <section className="panel">
        <h2 className="mb-5 text-2xl">Your items</h2>
        {o.order_items.map((i) => (
          <div key={i.id} className="flex justify-between gap-4 border-b py-4">
            <div>
              <p>
                {i.product_name_snapshot} × {i.quantity}
              </p>
              <p className="text-xs text-ink/60">{i.product_sku_snapshot}</p>
            </div>
            {!packing && <p>{money(i.unit_price_cents * i.quantity)}</p>}
          </div>
        ))}
        {!packing && (
          <dl className="ml-auto mt-5 max-w-sm space-y-2">
            {[
              ['Subtotal', o.subtotal_cents],
              ['Shipping', o.shipping_cents],
              ['Tax', o.tax_cents],
              ['Total', o.total_cents],
            ].map(([label, value]) => (
              <div className="flex justify-between" key={label}>
                <dt>{label}</dt>
                <dd>{money(Number(value))}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <div className="panel">
        <h2 className="text-2xl">Ship to</h2>
        <address className="mt-4 not-italic">
          {a.name}
          <br />
          {a.line1}
          <br />
          {a.line2 && (
            <>
              {a.line2}
              <br />
            </>
          )}
          {a.city}, {a.state} {a.postal_code}
          <br />
          United States
        </address>
        <p className="mt-4 text-sm">{o.shipping_method}</p>
        {o.tracking_number && (
          <p className="mt-3">
            USPS tracking:{' '}
            <a
              className="link break-all"
              href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(o.tracking_number)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {o.tracking_number}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
