import Link from 'next/link';
import Image from 'next/image';
import { catalog } from '@/lib/data';
import { groupCatalog } from '@/lib/catalog-presentation';
import { ProductCard } from '@/components/product-card';
import { collectionTheme as theme } from '@/lib/collection-theme';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const products = process.env.NEXT_PUBLIC_SUPABASE_URL ? await catalog() : [];
  const designs = groupCatalog(products);
  const hero =
    designs.find(({ product }) => product.design_slug === theme.heroDesign)
      ?.product || designs[0]?.product;
  const sidekick = designs.find(
    ({ product }) => product.design_slug === theme.sidekickDesign,
  )?.product;
  const image =
    hero?.product_images.find((i) => i.is_primary)?.url ||
    hero?.product_images[0]?.url;
  const sidekickImage =
    sidekick?.product_images.find((i) => i.is_primary)?.url ||
    sidekick?.product_images[0]?.url;
  return (
    <div className="collection-page">
      <section
        className="shell pb-8 pt-6 md:pb-12 md:pt-10"
        aria-labelledby="collection-heading"
      >
        <div className="sleepover-hero">
          <div className="hero-copy">
            <p className="collection-label">
              <span aria-hidden="true">✦</span> {theme.eyebrow}
            </p>
            <h1 id="collection-heading" className="sleepover-title">
              {theme.headline}
              <br />
              <span>{theme.headlineAccent}</span>
            </h1>
            <p className="hero-description">{theme.introduction}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="btn party-button" href="/shop">
                Find your cozy <span aria-hidden="true">↗</span>
              </Link>
              <Link className="btn party-outline" href="#pick-your-print">
                Meet the collection
              </Link>
            </div>
            <p className="hero-footnote">
              <span aria-hidden="true">♡</span> Four sizes. From $13. Printed
              just for your order.
            </p>
            <div className="hero-scribble" aria-hidden="true">
              a little comfort.
              <br />
              <span>a LOT of character.</span>
            </div>
          </div>
          <div className="hero-art">
            <span className="hero-star star-one" aria-hidden="true">
              ✦
            </span>
            <span className="hero-star star-two" aria-hidden="true">
              ✧
            </span>
            <div className="hero-photo-frame">
              {image ? (
                <Image
                  src={image}
                  alt={hero?.name || 'A colorful printed blanket'}
                  fill
                  priority
                  sizes="(max-width:767px) 88vw, 48vw"
                  className="object-cover"
                />
              ) : (
                <div className="hero-photo-empty">
                  <span aria-hidden="true">♡</span>
                  <p>Your next favorite is on its way.</p>
                </div>
              )}
            </div>
            <span className="cozy-sticker">
              Official plans:
              <br />
              <strong>stay cozy.</strong>
              <span aria-hidden="true"> ♡</span>
            </span>
            {sidekickImage && sidekick && (
              <Link
                className="sidekick-photo"
                href={`/products/${sidekick.slug}`}
                aria-label={`Explore ${sidekick.name}`}
              >
                <span className="relative block aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={sidekickImage}
                    alt={sidekick.name}
                    fill
                    sizes="(max-width:767px) 120px, 170px"
                    className="object-cover"
                  />
                </span>
                <span className="sidekick-caption">written in the stars ✦</span>
              </Link>
            )}
            <span className="hero-photo-caption">
              the couch called. it wants this one.
            </span>
          </div>
        </div>
      </section>
      <div className="collection-ribbon">
        <div className="shell flex flex-wrap items-center justify-center gap-x-7 gap-y-2 py-4">
          <span aria-hidden="true">✦</span>
          <p>{theme.banner}</p>
          <span aria-hidden="true">✦</span>
          <span className="hidden text-sm sm:inline">
            Movie-night energy, all day long.
          </span>
        </div>
      </div>
      <section
        id="pick-your-print"
        className="shell scroll-mt-6 py-14 md:py-20"
        aria-labelledby="prints-heading"
      >
        <div className="collection-section-heading">
          <div>
            <p className="collection-label">{theme.name}</p>
            <h2 id="prints-heading">Find your blanket personality.</h2>
            <p className="mt-3 max-w-xl text-ink/75">
              For the cartoon kid, the pink enthusiast, the horror-movie bestie.
              There’s a cozy kind of extra for everyone.
            </p>
          </div>
          <Link href="/shop" className="collection-text-link">
            Shop the whole collection <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="mood-tags" aria-label="Browse by mood">
          <Link href="/shop?q=90s">✦ Throwback favorites</Link>
          <Link href="/shop?q=pink">♡ Think pink</Link>
          <Link href="/shop?q=ghostface">✧ Spooky &amp; sweet</Link>
          <Link href="/shop?q=hello%20kitty">☆ Cosmic cuteness</Link>
        </div>
        {designs.length ? (
          <div className="collection-grid">
            {designs.map(({ product, sizeCount }, index) => (
              <ProductCard
                key={product.id}
                product={product}
                sizeCount={sizeCount}
                accent={index}
              />
            ))}
          </div>
        ) : (
          <div className="panel">
            <h3>Something cozy is on its way.</h3>
            <p className="mt-2">Check back soon for our next collection.</p>
            <Link href="/shop" className="link mt-4 inline-block">
              Explore the shop
            </Link>
          </div>
        )}
      </section>
      <section className="shell pb-14" aria-labelledby="size-heading">
        <div className="size-party">
          <div>
            <p className="collection-label">Little lap? Whole-couch mood?</p>
            <h2 id="size-heading">Your cozy. Your size.</h2>
            <p className="mt-3 max-w-md text-ink/75">
              Every design comes in all four sizes. Same personality, just the
              right amount of blanket.
            </p>
            <Link
              className="collection-text-link mt-5 inline-flex"
              href="/shop"
            >
              Pick your perfect fit <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <ul className="size-party-grid">
            {[
              ['30 × 40', 'The little snuggle', '$13'],
              ['40 × 50', 'The cozy companion', '$19'],
              ['50 × 60', 'The couch favorite', '$25'],
              ['60 × 80', 'The big cozy energy', '$32'],
            ].map(([size, label, price]) => (
              <li key={size}>
                <span className="size-label">{label}</span>
                <p>
                  {size}
                  <span className="text-sm"> in</span>
                </p>
                <span className="size-price">{price}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="shell pb-8" aria-label="The SnuggleBug way">
        <div className="cozy-promises">
          {[
            [
              '♡',
              'Printed for you',
              'Pick a design and size. We print your blanket after you order.',
            ],
            [
              '✦',
              'Mix your favorites',
              'Shipping is $7 for the first blanket, then $1 each extra. Up to five blankets per order.',
            ],
            [
              '✧',
              'A new mood each season',
              'Fresh collections, playful finds, and that same feel-good cozy.',
            ],
          ].map(([icon, title, text]) => (
            <div key={title}>
              <span className="promise-icon" aria-hidden="true">
                {icon}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
