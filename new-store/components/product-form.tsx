'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, Category } from '@/lib/types';
import { api, Notice, Submit } from './ui';
import { money } from '@/lib/types';
const blank = {
  name: '',
  slug: '',
  description: '',
  design_slug: null as string | null,
  size_label: null as string | null,
  price_cents: 100,
  sku: '',
  weight_lbs: 0.1,
  inventory_count: 1,
  shipping_group: null as 'blankets' | null,
  shipping_first_unit_cents: null as number | null,
  shipping_additional_unit_cents: 0,
  category_id: null as string | null,
  is_active: true,
};
export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const [value, setValue] = useState(
    product
      ? {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          design_slug: product.design_slug,
          size_label: product.size_label,
          price_cents: product.price_cents,
          sku: product.sku,
          weight_lbs: Number(product.weight_lbs),
          inventory_count: product.inventory_count,
          shipping_group: product.shipping_group ?? null,
          shipping_first_unit_cents: product.shipping_first_unit_cents,
          shipping_additional_unit_cents:
            product.shipping_additional_unit_cents,
          category_id: product.category_id,
          is_active: product.is_active,
        }
      : blank,
  );
  const [images, setImages] = useState<string[]>(
    product
      ? [...product.product_images]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => i.url)
      : [],
  );
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  return (
    <form
      className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError('');
        try {
          await api('/api/admin', {
            kind: 'product',
            value: { ...value, images },
          });
          router.push('/admin/products');
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setPending(false);
        }
      }}
    >
      <section className="panel space-y-5">
        <label>
          Product name
          <input
            required
            value={value.name}
            maxLength={150}
            onChange={(e) =>
              setValue({
                ...value,
                name: e.target.value,
                ...(!product
                  ? {
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    }
                  : {}),
              })
            }
          />
        </label>
        <label>
          Slug
          <input
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={value.slug}
            onChange={(e) => setValue({ ...value, slug: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            rows={7}
            maxLength={10000}
            value={value.description}
            onChange={(e) =>
              setValue({ ...value, description: e.target.value })
            }
          />
        </label>
        <div className="field-grid">
          {[
            ['price_cents', 'Price (cents)'],
            ['weight_lbs', 'Weight (lbs)'],
            ['inventory_count', 'Available inventory'],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                required
                min={
                  key === 'inventory_count'
                    ? 0
                    : key === 'weight_lbs'
                      ? 0.001
                      : 1
                }
                step={key === 'weight_lbs' ? 0.001 : 1}
                value={value[key as 'price_cents']}
                onChange={(e) =>
                  setValue({ ...value, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <label>
            SKU
            <input
              required
              maxLength={100}
              value={value.sku}
              onChange={(e) => setValue({ ...value, sku: e.target.value })}
            />
          </label>
        </div>
        <p className="text-xs text-ink/70">
          Available inventory excludes units already reserved at checkout.
          Adjust for physical stock changes only.
        </p>
        <fieldset className="space-y-4 rounded-xl border border-ink/20 p-4">
          <legend className="px-2 font-semibold">
            Sizes &amp; design families (optional)
          </legend>
          <p className="text-sm text-ink/70">
            Create a separate product/SKU for each size so its price, stock, and
            shipping stay independent. Use the same design group on matching
            sizes to show a size selector. Leave both fields blank for other
            items.
          </p>
          <div className="field-grid">
            <label>
              Design group slug
              <input
                placeholder="space-pals-blanket"
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={100}
                value={value.design_slug || ''}
                onChange={(e) =>
                  setValue({ ...value, design_slug: e.target.value || null })
                }
              />
            </label>
            <label>
              Size label
              <input
                placeholder="Throw · 50 × 60 in"
                maxLength={80}
                value={value.size_label || ''}
                onChange={(e) =>
                  setValue({ ...value, size_label: e.target.value || null })
                }
              />
            </label>
          </div>
        </fieldset>
        <fieldset className="space-y-4 rounded-xl border border-ink/20 p-4">
          <legend className="px-2 font-semibold">
            Shipping for this product
          </legend>
          <label>
            Shipping calculation
            <select
              value={value.shipping_group || ''}
              onChange={(e) =>
                setValue({
                  ...value,
                  shipping_group:
                    e.target.value === 'blankets' ? 'blankets' : null,
                })
              }
            >
              <option value="">Per product</option>
              <option value="blankets">
                Combined blankets (maximum 5 per order)
              </option>
            </select>
          </label>
          <p className="text-sm text-ink/70">
            {value.shipping_group === 'blankets'
              ? 'Blanket designs and sizes share one first-unit charge, then one additional-unit charge for each remaining blanket. Keep both rates the same on every blanket size. Maximum five blankets per order.'
              : 'Each distinct product has its own first-unit charge; additional units use its additional-unit charge.'}
          </p>
          <div className="field-grid">
            <label>
              First unit shipping ($)
              <input
                type="number"
                required
                min="0"
                max="10000"
                step="0.01"
                value={
                  value.shipping_first_unit_cents === null
                    ? ''
                    : value.shipping_first_unit_cents / 100
                }
                onChange={(e) =>
                  setValue({
                    ...value,
                    shipping_first_unit_cents:
                      e.target.value === ''
                        ? null
                        : Math.round(Number(e.target.value) * 100),
                  })
                }
              />
            </label>
            <label>
              Each additional unit ($)
              <input
                type="number"
                required
                min="0"
                max="10000"
                step="0.01"
                value={value.shipping_additional_unit_cents / 100}
                onChange={(e) =>
                  setValue({
                    ...value,
                    shipping_additional_unit_cents: Math.round(
                      Number(e.target.value) * 100,
                    ),
                  })
                }
              />
            </label>
          </div>
          <p className="text-xs text-ink/70">
            Use $0 for additional units to keep one fixed charge regardless of
            quantity. Set both to $0 for free shipping for this product.
          </p>
          {value.shipping_first_unit_cents !== null && (
            <p className="notice" role="status">
              Shipping example: 1 unit ={' '}
              {money(value.shipping_first_unit_cents)}; 3 units ={' '}
              {money(
                value.shipping_first_unit_cents +
                  2 * value.shipping_additional_unit_cents,
              )}
              .
            </p>
          )}
        </fieldset>
        <label>
          Category
          <select
            value={value.category_id || ''}
            onChange={(e) =>
              setValue({ ...value, category_id: e.target.value || null })
            }
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parent_id ? '↳ ' : ''}
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex gap-3">
          <input
            className="h-5 w-5"
            type="checkbox"
            checked={value.is_active}
            onChange={(e) =>
              setValue({ ...value, is_active: e.target.checked })
            }
          />
          Active in storefront
        </label>
        <Notice error={error} />
        <Submit pending={pending || uploading}>Save product</Submit>
      </section>
      <section className="panel self-start">
        <h2 className="text-2xl">Product images</h2>
        <p className="my-3 text-sm">
          First image is primary. JPEG, PNG or WebP, up to 5 MB. Uploads persist
          immediately; save the product to attach them.
        </p>
        <label>
          Upload image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading || images.length >= 12}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setError('');
              try {
                const fd = new FormData();
                fd.set('file', file);
                const res = await fetch('/api/upload', {
                  method: 'POST',
                  body: fd,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setImages((i) => [...i, data.url].slice(0, 12));
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setUploading(false);
                e.target.value = '';
              }
            }}
          />
        </label>
        {uploading && <p role="status">Uploading…</p>}
        <label className="mt-5">
          Or HTTPS image URL
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <button
          className="link my-3 text-sm"
          type="button"
          onClick={() => {
            if (url.startsWith('https://') && images.length < 12) {
              setImages([...images, url]);
              setUrl('');
            }
          }}
        >
          Add image URL
        </button>
        <ol className="space-y-4">
          {images.map((image, i) => (
            <li
              key={`${image}-${i}`}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`Product image ${i + 1}`}
                className="h-16 w-16 rounded object-cover"
              />
              <span className="text-xs">
                {i === 0 ? 'Primary' : `Image ${i + 1}`}
              </span>
              <button
                type="button"
                className="link text-xs"
                disabled={i === 0}
                onClick={() => {
                  const next = [...images];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  setImages(next);
                }}
              >
                Move up
              </button>
              <button
                type="button"
                className="link text-xs"
                onClick={() => setImages(images.filter((_, n) => n !== i))}
              >
                Remove
              </button>
            </li>
          ))}
        </ol>
      </section>
    </form>
  );
}
