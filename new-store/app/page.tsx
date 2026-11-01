import { service, check } from '@/lib/supabase';
import { money } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { catalog } from '@/lib/data';
import { catalogImage } from '@/lib/personalization/catalog-reference';
import { groupCatalog } from '@/lib/catalog-presentation';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const products = process.env.NEXT_PUBLIC_SUPABASE_URL ? await catalog() : [],
    designs = groupCatalog(products);
  const { data: offers, error } = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? await service().from('studio_settings').select('*').eq('id', 1).single()
    : { data: null, error: null };
  check(error);
  return (
    <div className="gallery-landing">
      <h1 className="sr-only">Personalized photo blankets</h1>
      <section
        id="blankets"
        className="landing-gallery"
        aria-label="Choose your blanket design"
      >
        {designs.map(({ product: p }, i) => (
          <article className="landing-product" key={p.id}>
            <Link href={`/products/${p.slug}`}>
              <div className="landing-photo">
                <Image
                  src={catalogImage(p) || '/placeholder.svg'}
                  alt={p.name}
                  fill
                  priority={i < 3}
                  sizes="(max-width:767px) 48vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="landing-product-caption">
                <h2>{p.name.replace(/^Personalized /, '')}</h2>
                <span>From {money(p.price_cents)}</span>
              </div>
            </Link>
          </article>
        ))}
      </section>
      {!designs.length && (
        <p className="notice">Our blanket collection is coming soon.</p>
      )}
      <div className="landing-shopping-links">
        <span>
          Personalize any design · Four sizes · Preview before you buy
        </span>
        <Link href="/shop" className="link">
          View all blankets →
        </Link>
      </div>
      <section className="landing-details" aria-label="Shopping details">
        <details>
          <summary>How personalization works</summary>
          <p>
            Choose a blanket and size, upload your photo, then review your
            personalized preview. Approve your favorite to add it to your bag.
          </p>
          <Link href="/shop" className="link">
            Choose a blanket →
          </Link>
        </details>
        <details>
          <summary>Blanket sizes & prices</summary>
          <div className="landing-size-guide">
            {[
              [30, 40, 13],
              [40, 50, 19],
              [50, 60, 25],
              [60, 80, 32],
            ].map(([w, h, price]) => (
              <div key={w}>
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <rect
                    x={(100 - w) / 2}
                    y={90 - h}
                    width={w}
                    height={h}
                    rx="3"
                    fill="#e8bfd2"
                    stroke="#b45c84"
                  />
                </svg>
                <strong>
                  {w} × {h} in
                </strong>
                <span>${price}</span>
              </div>
            ))}
          </div>
        </details>
        <details>
          <summary>Shipping & delivery</summary>
          <p>
            $7 for the first blanket, plus $1 for each additional blanket. Mix
            designs and sizes, up to five blankets per order. Delivery is
            available outside Indiana.
          </p>
        </details>
        {offers?.rewards_enabled && (
          <details>
            <summary>Earn a discount on your next order</summary>
            <p>
              Spend {money(offers.reward_threshold_cents)} on merchandise and
              earn {offers.reward_percent}% off a future order of{' '}
              {money(offers.reward_minimum_cents)} or more. Qualifying subtotal
              is after discounts and before shipping and tax. Your single-use
              coupon is emailed after payment, is valid for{' '}
              {offers.reward_valid_days} days, and requires the same email
              address.
            </p>
          </details>
        )}
      </section>
    </div>
  );
}
