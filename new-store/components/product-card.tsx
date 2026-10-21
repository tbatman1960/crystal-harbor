import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { money } from '@/lib/types';
export function ProductCard({ product: p }: { product: Product }) {
  const image = [...p.product_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  )[0];
  return (
    <article>
      <Link href={`/products/${p.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sage">
          <Image
            src={image?.url || '/placeholder.svg'}
            alt={p.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          {p.inventory_count === 0 && (
            <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs">
              Sold out
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <h3 className="text-lg">{p.name}</h3>
          <p className="text-sm">{money(p.price_cents)}</p>
        </div>
        <p className="mt-1 text-xs text-ink/65">
          A small treasure, thoughtfully chosen
        </p>
      </Link>
    </article>
  );
}
