import Link from 'next/link';
import { admin, check } from '@/lib/supabase';
import { money } from '@/lib/types';
export default async function Dashboard() {
  const client = await admin();
  const [metrics, low, recent] = await Promise.all([
    client.rpc('dashboard_metrics'),
    client
      .from('products')
      .select('id,name,inventory_count')
      .lte('inventory_count', 5)
      .order('inventory_count')
      .limit(30),
    client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);
  [metrics, low, recent].forEach((r) => check(r.error));
  return (
    <>
      <h1 className="text-4xl">A good day to make someone’s day.</h1>
      <p className="mt-4 text-ink/70">
        Your store at a glance. Reporting periods use UTC; revenue includes
        shipping and tax, excluding cancelled orders.
      </p>
      <div className="my-8 grid gap-4 sm:grid-cols-3">
        {['today', 'week', 'month'].map((period) => (
          <section className="panel" key={period}>
            <h2 className="eyebrow capitalize">
              {period === 'today' ? 'Today' : `This ${period}`}
            </h2>
            <p className="mt-4 text-3xl">
              {money(metrics.data?.[period]?.revenue || 0)}
            </p>
            <p className="mt-2 text-sm">
              {metrics.data?.[period]?.count || 0} orders
            </p>
          </section>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel">
          <h2 className="mb-5 text-2xl">Orders to know about</h2>
          {recent.data?.map((o) => (
            <Link
              href={`/admin/orders/${o.id}`}
              className="flex justify-between gap-4 border-b py-4"
              key={o.id}
            >
              <span>
                #{o.order_number} · {o.email}
                <span className="block text-xs capitalize">{o.status}</span>
              </span>
              <span>{money(o.total_cents)} →</span>
            </Link>
          ))}
        </section>
        <section className="panel">
          <h2 className="mb-5 text-2xl">Running a little low</h2>
          {low.data?.length ? (
            low.data.map((p) => (
              <Link
                href={`/admin/products/${p.id}`}
                key={p.id}
                className="flex justify-between border-b py-4"
              >
                <span>{p.name}</span>
                <span>{p.inventory_count} left →</span>
              </Link>
            ))
          ) : (
            <p>All stocked up.</p>
          )}
        </section>
      </div>
    </>
  );
}
