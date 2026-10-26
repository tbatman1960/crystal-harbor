import { hasStock } from '@/lib/availability';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { money } from '@/lib/types';
export function ProductCard({
  product: p,
  sizeCount = 1,
  accent = 0,
  personalize = false,
}: {
  product: Product;
  sizeCount?: number;
  accent?: number;
  personalize?: boolean;
}) {
  const image = [...p.product_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  )[0];
  return (
    <article className={`party-product party-product-${accent % 4}`}>
      <Link
        href={
          personalize ? `/customize?product=${p.slug}` : `/products/${p.slug}`
        }
        className="group block h-full"
      >
        <div className="party-product-image relative aspect-[4/5] overflow-hidden">
          <Image
            src={image?.url || '/placeholder.svg'}
            alt={p.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
          />
          {!hasStock(p) && (
            <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs">
              Sold out
            </span>
          )}
        </div>
        <div className="party-product-info">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="party-product-name">{p.name}</h3>
            <p className="party-product-price">
              {sizeCount > 1 ? 'From ' : ''}
              {money(p.price_cents)}
            </p>
          </div>
          <p className="mt-2 flex items-center justify-between gap-2 text-xs text-ink/75">
            {personalize
              ? 'Personalize this design'
              : sizeCount > 1
                ? `${sizeCount} sizes available`
                : p.size_label || 'Find your favorite'}
            <span className="product-arrow" aria-hidden="true">
              ↗
            </span>
          </p>
        </div>
      </Link>
    </article>
  );
}
