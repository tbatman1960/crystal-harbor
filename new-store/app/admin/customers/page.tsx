import Link from 'next/link';
import { admin, check } from '@/lib/supabase';
import { money } from '@/lib/types';
type Customer = {
  id: string;
  email: string;
  full_name: string | null;
  order_count: number;
  lifetime_value: number;
};
export default async function Customers({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(
    1,
    Math.min(10000, parseInt(searchParams.page || '1') || 1),
  );
  const client = await admin();
  const { data, error } = await client.rpc('customer_metrics', {
    p_offset: (page - 1) * 50,
  });
  check(error);
  return (
    <>
      <h1 className="text-4xl">Customers</h1>
      <p className="mt-4 text-sm">
        Registered customers. Lifetime value includes shipping and tax and
        excludes cancelled orders.
      </p>
      <div className="mt-8 space-y-4">
        {(data as Customer[])?.map((c) => (
          <article
            className="panel flex flex-wrap justify-between gap-4"
            key={c.id}
          >
            <div>
              <h2 className="text-xl">{c.full_name || 'Customer'}</h2>
              <p className="mt-2 break-all text-sm">{c.email}</p>
            </div>
            <div className="text-right">
              <p>{c.order_count} orders</p>
              <p className="mt-2 text-sm">
                Lifetime value: {money(c.lifetime_value)}
              </p>
            </div>
          </article>
        ))}
      </div>
      <nav aria-label="Pagination" className="mt-6 flex gap-6">
        {page > 1 && (
          <Link className="link" href={`?page=${page - 1}`}>
            Previous
          </Link>
        )}
        {data?.length === 50 && (
          <Link className="link" href={`?page=${page + 1}`}>
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
