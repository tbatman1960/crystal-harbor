import Link from 'next/link';
import {
  blanketSvg,
  defaultConfig,
  templates,
} from '@/lib/personalization/designs';
import { catalog } from '@/lib/data';
import { groupCatalog } from '@/lib/catalog-presentation';
import { ProductCard } from '@/components/product-card';
import { collectionTheme as theme } from '@/lib/collection-theme';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const products = process.env.NEXT_PUBLIC_SUPABASE_URL ? await catalog() : [];
  const designs = groupCatalog(products);
  return (
    <div className="collection-page">
      <section
        className="shell pt-6 pb-10 md:pt-10"
        aria-labelledby="personalized-heading"
      >
        <div className="custom-hero">
          <div className="self-center">
            <p className="collection-label">
              A LITTLE COZY. A WHOLE LOT OF YOU.
            </p>
            <h1 id="personalized-heading" className="mt-5">
              Their face.
              <br />
              Their name.
              <br />
              <span>Their favorite gift.</span>
            </h1>
            <p className="mt-6 max-w-md text-ink/75">
              Big smiles come wrapped in little moments. Make a blanket starring
              someone you love, or find a ready-to-love print from our cozy
              collection.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="btn party-button" href="/customize">
                Make it personal ↗
              </Link>
              <Link className="btn party-outline" href="/shop">
                Shop all blankets
              </Link>
            </div>
            <p className="mt-6 text-sm">
              ♡ Four sizes · From $13 · Preview before you buy
            </p>
          </div>
          <div
            className="custom-hero-art"
            aria-label="Examples of original personalized blanket artwork"
          >
            {(['disco', 'cosmic'] as const).map((template, i) => (
              <div
                key={template}
                role="img"
                aria-label={`${template} illustrated blanket example`}
                dangerouslySetInnerHTML={{
                  __html: blanketSvg({
                    ...defaultConfig,
                    template,
                    name: i ? 'MILO' : 'OLIVIA',
                  }),
                }}
              />
            ))}
          </div>
        </div>
      </section>
      <section
        className="shell pb-12"
        aria-labelledby="custom-collection-heading"
      >
        <div className="collection-section-heading">
          <div>
            <p className="collection-label">THE YOU COLLECTION</p>
            <h2 id="custom-collection-heading">
              Ordinary blanket? Not your style.
            </h2>
            <p className="mt-3 text-ink/75">
              Three original worlds, one unforgettable face. Yours.
            </p>
          </div>
          <Link className="collection-text-link" href="/customize">
            Create your blanket ↗
          </Link>
        </div>
        <div className="collection-grid">
          {templates.map((t) => (
            <Link className="custom-card" href="/customize" key={t.id}>
              <div
                className="custom-card-art"
                role="img"
                aria-label={`${t.name} template`}
                dangerouslySetInnerHTML={{
                  __html: blanketSvg({
                    ...defaultConfig,
                    template: t.id,
                    name: 'YOUR NAME',
                  }),
                }}
              />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-clay">
                  Your photo + your name
                </p>
                <h3 className="mt-2 text-xl">{t.name}</h3>
                <p className="mt-2 text-sm text-ink/70">{t.subtitle}</p>
                <p className="mt-4 font-semibold">
                  From $13 <span className="float-right">Customize ↗</span>
                </p>
              </div>
            </Link>
          ))}
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
