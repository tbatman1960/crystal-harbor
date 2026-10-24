import Link from 'next/link';
import { groupCatalog } from '@/lib/catalog-presentation';
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
    <div className="collection-page collection-shop shell py-10 md:py-14">
      <p className="eyebrow mb-4 text-clay">The retro sleepover collection</p>
      <h1 className="shop-party-title">
        Pick your cozy. <span>Make it you.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-ink/75">
        Big characters, bold prints, and four ways to get comfortable. Your next
        favorite blanket is right here.
      </p>
      <p className="mt-5">
        <Link href="/customize" className="personalization-link">
          ✦ Put your face in the picture — create a personalized blanket →
        </Link>
      </p>
      <div className="my-8 flex flex-col justify-between gap-5 md:flex-row">
        <nav
          aria-label="Categories"
          className="flex flex-wrap items-center gap-3"
        >
          <Link
            className={`rounded-full border px-4 py-2 text-sm ${!searchParams.category ? 'bg-ink text-white' : ''}`}
            href="/shop"
          >
            Shop all
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
            placeholder="Search designs or products…"
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
        {groupCatalog(products).length} designs &amp; products ·{' '}
        {products.length} available sizes &amp; options
      </p>
      {products.length ? (
        <div className="collection-grid">
          {groupCatalog(products).map(({ product, sizeCount }, index) => (
            <ProductCard
              key={product.id}
              product={product}
              sizeCount={sizeCount}
              accent={index}
            />
          ))}
        </div>
      ) : (
        <p className="panel">
          No items found. Try another search or check back soon.
        </p>
      )}
    </div>
  );
}
