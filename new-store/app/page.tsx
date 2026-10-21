import Link from 'next/link';
import Image from 'next/image';
import { catalog } from '@/lib/data';
import { groupCatalog } from '@/lib/catalog-presentation';
import { ProductCard } from '@/components/product-card';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const products = process.env.NEXT_PUBLIC_SUPABASE_URL ? await catalog() : [];
  const featured = groupCatalog(products).slice(0, 4);
  return (
    <>
      <section className="shell py-8 md:py-12">
        <div className="relative grid overflow-hidden rounded-2xl bg-[#efe5df] md:min-h-[550px] md:grid-cols-2">
          <div className="z-10 px-7 py-14 md:px-14 md:py-20">
            <p className="eyebrow text-clay">This season at SnuggleBug</p>
            <h1 className="mt-6 max-w-lg">
              Big hugs.
              <br />
              <em>Big imaginations.</em>
            </h1>
            <p className="mt-6 max-w-sm text-ink/75">
              Printed blankets with playful characters, in sizes made for little
              laps, sofa snuggles, and oversized movie nights.
            </p>
            <Link className="btn mt-8" href="/shop">
              Find your cozy favorite <span className="ml-8">↗</span>
            </Link>
            <p className="mt-8 text-xs tracking-wide">
              PICK YOUR PRINT. CHOOSE YOUR SIZE. GET COZY.
            </p>
          </div>
          <div className="relative min-h-[420px] bg-[#e1e5ef] md:min-h-full">
            <Image
              src="/blankets/space-pals.svg"
              alt="Illustration of a SnuggleBug blanket with smiling planets, rockets, and stars"
              fill
              priority
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover"
            />
            <span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-medium">
              Meet the blanket collection
            </span>
          </div>
        </div>
      </section>
      <section className="shell grid gap-4 py-4 sm:grid-cols-3">
        {[
          ['kids-lap-blankets', 'Little laps', '30 × 40 in'],
          ['everyday-throws', 'Everyday snuggles', '50 × 60 in'],
          ['oversized-comfort', 'Room to get cozy', '60 × 80 in'],
        ].map(([slug, title, size]) => (
          <Link
            key={slug}
            href={`/shop?category=${slug}`}
            className="flex items-center justify-between rounded-xl border border-ink/15 bg-white px-5 py-5"
          >
            <span>
              <span className="block font-serif text-xl">{title}</span>
              <span className="mt-1 block text-xs text-ink/65">{size}</span>
            </span>
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </section>
      <section className="shell py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3 text-clay">The cozy season collection</p>
            <h2>Find your favorite blanket buddy</h2>
          </div>
          <Link href="/shop" className="link whitespace-nowrap text-sm">
            Shop all ↗
          </Link>
        </div>
        {featured.length ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4">
            {featured.map(({ product, sizeCount }) => (
              <ProductCard
                key={product.id}
                product={product}
                sizeCount={sizeCount}
              />
            ))}
          </div>
        ) : (
          <div className="panel">
            <h3>Something cozy is on its way.</h3>
            <p className="mt-2">
              Check back soon for this season’s latest finds.
            </p>
            <Link className="link mt-4 inline-block" href="/shop">
              Explore the shop
            </Link>
          </div>
        )}
      </section>
      <section className="shell mt-10 grid gap-8 border-y border-ink/15 py-10 sm:grid-cols-3">
        {[
          [
            'A size for your snuggle',
            'Little lap blankets, everyday throws, and oversized favorites. Check each listing for its dimensions.',
          ],
          [
            'Ready when you are',
            'Choose from ready-made items in stock. Every order is packed with care.',
          ],
          [
            'New season, new favorites',
            'Our collection changes over time. There’s always room for another cozy discovery.',
          ],
        ].map(([title, text]) => (
          <div key={title}>
            <h3>{title}</h3>
            <p className="mt-3 text-sm text-ink/70">{text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
