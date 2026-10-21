import Link from 'next/link';
import { catalog } from '@/lib/data';
import { ProductCard } from '@/components/product-card';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const products = process.env.NEXT_PUBLIC_SUPABASE_URL ? await catalog() : [];
  return (
    <>
      <section className="shell py-8 md:py-12">
        <div className="relative grid overflow-hidden rounded-2xl bg-[#e8e5da] md:min-h-[520px] md:grid-cols-2">
          <div className="z-10 px-7 py-14 md:px-14 md:py-20">
            <p className="eyebrow text-clay">Grounded in the everyday</p>
            <h1 className="mt-6 max-w-lg">
              Small things.
              <br />
              <em>Deep meaning.</em>
            </h1>
            <p className="mt-6 max-w-sm text-ink/75">
              Jewelry, crystals, and collected treasures that bring a little
              intention to your everyday.
            </p>
            <Link className="btn mt-8" href="/shop">
              Find your next treasure <span className="ml-8">↗</span>
            </Link>
            <p className="mt-8 text-xs tracking-wide">
              NATURAL BEAUTY. NOTHING EXTRA.
            </p>
          </div>
          <div
            className="relative flex min-h-72 items-center justify-center bg-[#d6d8c8] p-10"
            aria-hidden="true"
          >
            <div className="absolute h-64 w-64 rounded-full bg-[#bec7ad]/70 md:h-96 md:w-96" />
            <div className="relative rotate-[-12deg] rounded-[42%_58%_42%_55%] bg-gradient-to-br from-[#bba1b8] via-[#e3d6db] to-[#826c8f] p-16 shadow-2xl md:p-24">
              <div className="h-20 w-16 rotate-12 border-l-4 border-white/50 bg-white/10 [clip-path:polygon(50%_0,100%_30%,75%_100%,10%_85%,0_30%)]" />
            </div>
            <span className="absolute bottom-7 right-7 text-xs tracking-widest">
              COLLECTED WITH CARE — 01
            </span>
          </div>
        </div>
      </section>
      <section className="shell py-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3 text-clay">The considered collection</p>
            <h2>Meet your everyday favorites</h2>
          </div>
          <Link href="/shop" className="link whitespace-nowrap text-sm">
            Shop all ↗
          </Link>
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="panel">
            <h3>A thoughtful collection is on its way.</h3>
            <p className="mt-2">
              Connect your Supabase store and run the seed script to bring your
              collection to life.
            </p>
            <Link href="/shop" className="link mt-4 inline-block">
              Explore the shop
            </Link>
          </div>
        )}
      </section>
      <section className="shell mt-16 grid gap-8 border-y border-ink/15 py-10 sm:grid-cols-3">
        {[
          [
            'Chosen with intention',
            'Beautiful materials. Pieces you will reach for again and again.',
          ],
          [
            'Packed with care',
            'Every order is prepared by hand, from our small shop to your home.',
          ],
          [
            'A personal touch',
            'A real person behind every parcel. Here whenever you need us.',
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
