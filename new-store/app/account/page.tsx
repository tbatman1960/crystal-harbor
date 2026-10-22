import Link from 'next/link';
import { account } from '@/lib/account';
import { check } from '@/lib/supabase';
import { money } from '@/lib/types';
export default async function Account() {
  const { client, user } = await account();
  const { data: orders, error } = await client
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  check(error);
  return (
    <>
      <h1 className="text-4xl">Your orders</h1>
      <p className="mt-3 text-ink/70">Good things, on their way.</p>
      <div className="mt-8 space-y-4">
        {orders?.length ? (
          orders.map((o) => (
            <Link
              className="panel flex flex-wrap items-center justify-between gap-4"
              key={o.id}
              href={`/account/orders/${o.id}`}
            >
              <div>
                <h2 className="text-xl">Order #{o.order_number}</h2>
                <p className="mt-1 text-sm">
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
          <p className="panel">
            No orders yet.{' '}
            <Link className="link" href="/shop">
              Find your next favorite
            </Link>
            .
          </p>
        )}
      </div>
    </>
  );
}
