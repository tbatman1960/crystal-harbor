import Link from 'next/link';
import { admin, check } from '@/lib/supabase';
import { money } from '@/lib/types';
const statuses = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];
export default async function Orders({
  searchParams: s,
}: {
  searchParams: { status?: string; from?: string; to?: string; page?: string };
}) {
  const page = Math.max(1, Math.min(10000, parseInt(s.page || '1') || 1));
  const client = await admin();
  let q = client
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .range((page - 1) * 50, page * 50 - 1);
  if (s.status && statuses.includes(s.status)) q = q.eq('status', s.status);
  const date = (v: string | undefined) =>
    v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
  if (date(s.from)) q = q.gte('created_at', `${s.from}T00:00:00Z`);
  if (date(s.to)) q = q.lte('created_at', `${s.to}T23:59:59.999Z`);
  const { data, error } = await q;
  check(error);
  const query = new URLSearchParams();
  if (s.status) query.set('status', s.status);
  if (s.from) query.set('from', s.from);
  if (s.to) query.set('to', s.to);
  return (
    <>
      <h1 className="text-4xl">Orders</h1>
      <form className="my-8 grid items-end gap-4 sm:grid-cols-4">
        <label>
          Status
          <select name="status" defaultValue={s.status || ''}>
            <option value="">All</option>
            {statuses.map((st) => (
              <option key={st}>{st}</option>
            ))}
          </select>
        </label>
        <label>
          From (UTC)
          <input name="from" type="date" defaultValue={s.from} />
        </label>
        <label>
          Through (UTC)
          <input name="to" type="date" defaultValue={s.to} />
        </label>
        <button className="btn">Filter orders</button>
      </form>
      <div className="space-y-3">
        {data?.length ? (
          data.map((o) => (
            <Link
              href={`/admin/orders/${o.id}`}
              className="panel flex flex-wrap items-center justify-between gap-4"
              key={o.id}
            >
              <div>
                <h2 className="text-xl">
                  #{o.order_number} · {o.shipping_address.name}
                </h2>
                <p className="mt-1 break-all text-sm">{o.email}</p>
                <p className="mt-1 text-xs">
                  {new Date(o.created_at).toLocaleDateString('en-US', {
                    timeZone: 'UTC',
                  })}
                </p>
              </div>
              <span className="rounded-full bg-sage px-4 py-2 text-sm capitalize">
                {o.status}
              </span>
              <span>{money(o.total_cents)} →</span>
            </Link>
          ))
        ) : (
          <p className="panel">No orders in this view.</p>
        )}
      </div>
      <nav aria-label="Pagination" className="mt-6 flex gap-6">
        {page > 1 && (
          <Link className="link" href={`?${query}&page=${page - 1}`}>
            Previous
          </Link>
        )}
        {data?.length === 50 && (
          <Link className="link" href={`?${query}&page=${page + 1}`}>
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
