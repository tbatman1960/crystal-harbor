import Link from 'next/link';
import { admin, check } from '@/lib/supabase';
import { money } from '@/lib/types';
import { DeleteButton } from '@/components/admin-actions';
export default async function Products({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = Math.max(
    1,
    Math.min(10000, parseInt(searchParams.page || '1') || 1),
  );
  const client = await admin();
  let query = client
    .from('products')
    .select('*')
    .order('name')
    .range((page - 1) * 50, page * 50 - 1);
  if (searchParams.q)
    query = query.ilike(
      'name',
      `%${searchParams.q.slice(0, 100).replace(/[%_\\]/g, '')}%`,
    );
  const { data, error } = await query;
  check(error);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-5">
        <h1 className="text-4xl">Products</h1>
        <Link className="btn" href="/admin/products/new">
          Add a product
        </Link>
      </div>
      <form className="my-6 flex max-w-lg gap-3">
        <label className="sr-only" htmlFor="product-search">
          Search products
        </label>
        <input
          id="product-search"
          name="q"
          placeholder="Search products"
          defaultValue={searchParams.q}
        />
        <button className="btn">Search</button>
      </form>
      <div className="mt-8 space-y-3">
        {data?.map((p) => (
          <article
            className="panel flex flex-wrap items-center justify-between gap-4"
            key={p.id}
          >
            <Link href={`/admin/products/${p.id}`} className="flex-1">
              <h2 className="text-xl">
                {p.name}
                {p.size_label ? ` — ${p.size_label}` : ''}
              </h2>
              <p className="mt-1 text-sm">
                {p.sku} · {money(p.price_cents)} ·{' '}
                {p.track_inventory === false
                  ? 'Inventory not tracked'
                  : `${p.inventory_count} available`}
                · {p.is_active ? 'Active' : 'Inactive'}
              </p>
            </Link>
            <Link className="link" href={`/admin/products/${p.id}`}>
              Edit
            </Link>
            <DeleteButton table="products" id={p.id} />
          </article>
        ))}
      </div>
      <nav className="mt-6 flex gap-6" aria-label="Pagination">
        {page > 1 && (
          <Link
            className="link"
            href={`?page=${page - 1}&q=${encodeURIComponent(searchParams.q || '')}`}
          >
            Previous
          </Link>
        )}
        {data?.length === 50 && (
          <Link
            className="link"
            href={`?page=${page + 1}&q=${encodeURIComponent(searchParams.q || '')}`}
          >
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
