'use client';
import { hasStock, quantityLimit } from '@/lib/availability';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './cart-provider';
import type { Product } from '@/lib/types';
import { money } from '@/lib/types';
import { BLANKET_ORDER_LIMIT } from '@/lib/pricing';
export function ProductDetail({
  product: p,
  sizes = [],
}: {
  product: Product;
  sizes?: Pick<
    Product,
    | 'id'
    | 'slug'
    | 'size_label'
    | 'price_cents'
    | 'inventory_count'
    | 'track_inventory'
  >[];
}) {
  const router = useRouter();
  const images = [...p.product_images].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const [selected, choose] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { add, ready } = useCart();
  return (
    <div className="collection-page grid gap-10 md:grid-cols-2 md:gap-16">
      <section aria-label="Product images">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-sage">
          <Image
            src={images[selected]?.url || '/placeholder.svg'}
            alt={`${p.name} — view ${selected + 1}`}
            fill
            priority
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="mt-4 flex gap-3">
          {images.map((image, i) => (
            <button
              className={`relative h-20 w-20 overflow-hidden rounded-lg ${i === selected ? 'ring-2 ring-ink ring-offset-2' : ''}`}
              key={image.url}
              onClick={() => choose(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === selected}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </section>
      <section className="md:py-8">
        <p className="eyebrow mb-5 text-clay">
          Ready for your next cozy moment
        </p>
        <h1 className="text-4xl md:text-5xl">{p.name}</h1>
        {sizes.length > 1 ? (
          <label className="mt-6 max-w-sm">
            Choose a size
            <select
              value={p.slug}
              onChange={(e) => router.push(`/products/${e.target.value}`)}
            >
              {sizes.map((size) => (
                <option key={size.id} value={size.slug}>
                  {size.size_label || 'Standard'} — {money(size.price_cents)}
                  {!hasStock(size) ? ' · Sold out' : ''}
                </option>
              ))}
            </select>
          </label>
        ) : p.size_label ? (
          <p className="mt-4 text-sm">Size: {p.size_label}</p>
        ) : null}
        <p className="mt-5 text-xl">{money(p.price_cents)}</p>
        <p className="mt-7 whitespace-pre-line text-ink/75">{p.description}</p>
        {p.shipping_group === 'blankets' && (
          <p className="notice mt-6">
            Shipping: {money(p.shipping_first_unit_cents || 0)} for the first
            blanket, plus {money(p.shipping_additional_unit_cents)} for each
            additional blanket. Mix designs and sizes, up to{' '}
            {BLANKET_ORDER_LIMIT} blankets per order.
          </p>
        )}
        {p.shipping_group === 'blankets' && (
          <Link
            href={`/customize?product=${p.slug}`}
            className="personalization-link"
          >
            ✦ Want a blanket starring you? Explore personalized designs →
          </Link>
        )}
        <div className="mt-8 flex items-end gap-4">
          <label className="w-24">
            Quantity
            <input
              type="number"
              min={1}
              max={Math.min(
                p.shipping_group === 'blankets' ? BLANKET_ORDER_LIMIT : 99,
                quantityLimit(p),
              )}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(
                    1,
                    Math.min(
                      quantityLimit(p),
                      p.shipping_group === 'blankets'
                        ? BLANKET_ORDER_LIMIT
                        : 99,
                      Number(e.target.value) || 1,
                    ),
                  ),
                )
              }
            />
          </label>
          <button
            className="btn party-button flex-1"
            disabled={!ready || !hasStock(p)}
            onClick={() => {
              add(p.id, quantity);
              setAdded(true);
            }}
          >
            {hasStock(p) ? 'Add to bag' : 'Sold out'}
          </button>
        </div>
        {added && (
          <p role="status" className="notice">
            Added to your bag.{' '}
            <Link className="link" href="/cart">
              View bag & checkout →
            </Link>
          </p>
        )}
        <div className="mt-8 border-t border-ink/15 pt-5 text-sm">
          <p>✓ Secure checkout with Stripe</p>
          <p className="mt-2">✓ Carefully packed and shipped with USPS</p>
          <p className="mt-4 text-xs text-ink/60">
            {p.shipping_first_unit_cents === null
              ? 'Shipping rate awaiting setup'
              : `Shipping: ${money(p.shipping_first_unit_cents)} for the first unit + ${money(p.shipping_additional_unit_cents)} for each additional unit`}
            <br />
            SKU: {p.sku}
            {p.weight_lbs !== null ? ` · Weight: ${p.weight_lbs} lb` : ''}
          </p>
        </div>
      </section>
    </div>
  );
}
