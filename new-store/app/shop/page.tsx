import Link from 'next/link';
import { catalog, categories } from '@/lib/data';
import { ProductCard } from '@/components/product-card';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'The collection' };
export default async function Shop({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const [products, cats] = configured
    ? await Promise.all([
        catalog(
          (searchParams.q || '').slice(0, 100),
          searchParams.category || '',
        ),
        categories(),
      ])
    : [[], []];
  return (
    <div className="shell py-12">
      <p className="eyebrow mb-4 text-clay">
        Find something that feels like you
      </p>
      <h1>The collection</h1>
      <div className="my-8 flex flex-col justify-between gap-5 md:flex-row">
        <nav
          aria-label="Categories"
          className="flex flex-wrap items-center gap-3"
        >
          <Link
            className={`rounded-full border px-4 py-2 text-sm ${!searchParams.category ? 'bg-ink text-white' : ''}`}
            href="/shop"
          >
            All treasures
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className={`rounded-full border px-4 py-2 text-sm ${searchParams.category === c.slug ? 'bg-ink text-white' : ''}`}
            >
              {c.parent_id ? '↳ ' : ''}
              {c.name}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2" action="/shop">
          <label className="sr-only" htmlFor="search">
            Search products
          </label>
          <input
            id="search"
            name="q"
            defaultValue={searchParams.q}
            placeholder="Find your treasure…"
            maxLength={100}
          />
          {searchParams.category && (
            <input
              type="hidden"
              name="category"
              value={searchParams.category}
            />
          )}
          <button className="btn">Search</button>
        </form>
      </div>
      <p className="mb-6 text-sm text-ink/65">
        {products.length} thoughtfully chosen pieces
      </p>
      {products.length ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="panel">
          No pieces found. Try another search or check back soon.
        </p>
      )}
    </div>
  );
}
