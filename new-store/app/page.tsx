import { service, check } from '@/lib/supabase';
import { money } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { catalog } from '@/lib/data';
import { catalogImage } from '@/lib/personalization/catalog-reference';
import { groupCatalog } from '@/lib/catalog-presentation';
import { ProductCard } from '@/components/product-card';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const products = process.env.NEXT_PUBLIC_SUPABASE_URL ? await catalog() : [],
    designs = groupCatalog(products);
  const { data: offers, error } = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? await service().from('studio_settings').select('*').eq('id', 1).single()
    : { data: null, error: null };
  check(error);
  return (
    <div>
      <section className="studio-hero shell">
        <div className="studio-hero-copy">
          <span className="studio-label">
            LITTLE GIFTS. BIG MAIN-CHARACTER ENERGY.
          </span>
          <h1>
            Their face.
            <br />
            Their world.
            <br />
            <em>One happy blanket.</em>
          </h1>
          <p>Your favorite photo, made into their new favorite thing.</p>
          <Link className="btn" href="#blankets">
            Find your blanket <span aria-hidden="true">↗</span>
          </Link>
          <div className="studio-hero-facts">
            <span>From $13</span>
            <span>4 cozy sizes</span>
            <span>Preview before you buy</span>
          </div>
        </div>
        <div className="studio-hero-gallery">
          {designs.slice(0, 2).map(({ product: p }, i) => (
            <Link
              href={`/products/${p.slug}`}
              key={p.id}
              className={`hero-blanket hero-blanket-${i}`}
            >
              <Image
                src={catalogImage(p) || '/placeholder.svg'}
                width={600}
                height={750}
                alt={p.name}
                priority
              />
              <span>
                {i ? 'Big personality.' : 'Your next cozy obsession.'} ↗
              </span>
            </Link>
          ))}
          <span className="hero-sticker" aria-hidden="true">
            MADE
            <br />
            FOR YOU
            <br />✦
          </span>
        </div>
      </section>
      <div className="studio-trust-strip">
        <span>✓ Personalized with your photo</span>
        <span>♡ Approve your preview</span>
        <span>✦ $7 shipping + $1 each extra</span>
      </div>
      <section id="blankets" className="shell py-14">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <p className="studio-label">PICK THEIR PERSONALITY</p>
            <h2 className="mt-2">A little cozy. A lot of them.</h2>
          </div>
          <Link href="/shop" className="link text-sm">
            Shop all →
          </Link>
        </div>
        <div className="collection-grid">
          {designs.map(({ product, sizeCount }, i) => (
            <ProductCard
              key={product.id}
              product={product}
              sizeCount={sizeCount}
              accent={i}
            />
          ))}
        </div>
      </section>
      {offers?.rewards_enabled && (
        <aside className="shell mb-8">
          <div className="studio-reward-banner">
            <strong>A little thank-you for next time.</strong>
            <p>
              Spend {money(offers.reward_threshold_cents)} on blankets and earn{' '}
              {offers.reward_percent}% off a future order of{' '}
              {money(offers.reward_minimum_cents)} or more.
            </p>
            <small>
              Qualifying subtotal after discounts, before shipping and tax.
              Coupon sent after payment, valid {offers.reward_valid_days} days,
              single use with the same email.
            </small>
          </div>
        </aside>
      )}
      <section className="studio-steps shell">
        <div>
          <p className="studio-label">FROM PHOTO TO FAVORITE</p>
          <h2>
            Three little steps.
            <br />
            One big smile.
          </h2>
        </div>
        {[
          ['01', 'Pick a blanket', 'Choose a design and size.', '▧'],
          [
            '02',
            'Make it theirs',
            'Upload a photo. Compare your previews.',
            '☺',
          ],
          [
            '03',
            'Love it? Order it.',
            'Approve your favorite before checkout.',
            '♡',
          ],
        ].map(([n, h, p, icon]) => (
          <article key={n}>
            <span className="step-graphic" aria-hidden="true">
              {icon}
            </span>
            <small>{n}</small>
            <h3>{h}</h3>
            <p>{p}</p>
          </article>
        ))}
      </section>
      <section className="shell py-14">
        <div className="studio-size-banner">
          <div>
            <p className="studio-label">LITTLE LAPS TO BIG LOUNGING</p>
            <h2>Find their perfect fit.</h2>
            <p className="mt-3">Four sizes. Every design. All personality.</p>
            <Link className="btn mt-5" href="/shop">
              Choose your size →
            </Link>
          </div>
          <div
            className="size-silhouettes"
            aria-label="Sizes 30 by 40, 40 by 50, 50 by 60, and 60 by 80 inches"
          >
            {[
              [30, 40, 13],
              [40, 50, 19],
              [50, 60, 25],
              [60, 80, 32],
            ].map(([w, h, price]) => (
              <div key={w}>
                <div
                  style={{ width: `${w * 1.4}px`, height: `${h * 1.4}px` }}
                />
                <strong>
                  {w} × {h}
                </strong>
                <span>${price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
