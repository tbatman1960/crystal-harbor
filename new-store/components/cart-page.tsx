'use client';
import { cartKey } from '@/lib/personalization/designs';
import { ArtworkDownload } from './artwork-download';
import { hasStock, quantityLimit } from '@/lib/availability';
import { useCart } from './cart-provider';
import type { Product, Address, Rate } from '@/lib/types';
import { money } from '@/lib/types';
import { BLANKET_ORDER_LIMIT } from '@/lib/pricing';
import {
  isRestrictedShippingAddress,
  SHIPPING_AREA_MESSAGE,
} from '@/lib/shipping-policy';
import { productTitle } from '@/lib/catalog-presentation';
import Link from 'next/link';
import { useState } from 'react';
import { api, Notice } from './ui';
import { AddressFields, emptyAddress } from './address-fields';
export function CartPage({
  products,
  defaultAddress,
  email,
}: {
  products: Product[];
  defaultAddress?: Address;
  email?: string;
}) {
  const { items, setItems, ready, error: cartError } = useCart();
  const [address, setAddress] = useState(defaultAddress || emptyAddress);
  const [billing, setBilling] = useState(emptyAddress);
  const [same, setSame] = useState(true);
  const [contact, setContact] = useState(email || '');
  const [quote, setQuote] = useState<{
    subtotal: number;
    tax: number;
    rates: Rate[];
  } | null>(null);
  const [method, setMethod] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [version, setVersion] = useState('');
  const subtotal = items.reduce(
    (n, i) =>
      n +
      (products.find((p) => p.id === i.product_id)?.price_cents || 0) *
        i.quantity,
    0,
  );
  const blanketCount = items.reduce(
    (n, i) =>
      n +
      (products.find((p) => p.id === i.product_id)?.shipping_group ===
      'blankets'
        ? i.quantity
        : 0),
    0,
  );
  const current = JSON.stringify({ items, address });
  const validQuote = version === current ? quote : null;
  const rate = validQuote?.rates.find((r) => r.id === method);
  async function getRates() {
    setError('');
    setPending(true);
    try {
      const q = await api('/api/quote', { items, address });
      setQuote(q);
      setVersion(current);
      setMethod(q.rates[0].id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function checkout() {
    setError('');
    setPending(true);
    try {
      const data = await api('/api/checkout', {
        items,
        address,
        billing: same ? address : billing,
        email: contact,
        shipping_method: method,
      });
      window.location.assign(data.url);
    } catch (e) {
      setError((e as Error).message);
      setVersion('');
      setPending(false);
    }
  }
  if (!ready)
    return (
      <p className="shell py-12" role="status">
        Loading your bag…
      </p>
    );
  if (!items.length)
    return (
      <div className="shell py-16">
        <h1>Your bag</h1>
        <p className="my-6">A little room for something meaningful.</p>
        <Link className="btn" href="/shop">
          Explore the collection
        </Link>
      </div>
    );
  return (
    <div className="shell py-12">
      <h1>Your bag</h1>
      <Notice error={cartError} />
      <p className="notice mt-4">{SHIPPING_AREA_MESSAGE}</p>
      {items.some((i) => !products.some((p) => p.id === i.product_id)) && (
        <div className="notice mt-4" role="alert">
          <p>
            Your bag contains an item that is no longer available, such as an
            old sample product.
          </p>
          <button
            type="button"
            className="link mt-2"
            onClick={() =>
              setItems(
                items.filter((i) =>
                  products.some((p) => p.id === i.product_id),
                ),
              )
            }
          >
            Remove unavailable items
          </button>
        </div>
      )}
      {blanketCount > 0 && (
        <p className="notice mt-4">
          Blankets share one shipping charge across designs and sizes: $7 for
          the first, plus $1 each additional. Maximum {BLANKET_ORDER_LIMIT}{' '}
          blankets per order.
        </p>
      )}
      {blanketCount > BLANKET_ORDER_LIMIT && (
        <Notice
          error={`Your bag contains ${blanketCount} blankets. Reduce it to ${BLANKET_ORDER_LIMIT} before checkout.`}
        />
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <section aria-label="Cart items" className="divide-y divide-ink/15">
            {items.map((i) => {
              const p = products.find((p) => p.id === i.product_id);
              return (
                <article key={cartKey(i)} className="flex gap-4 py-6">
                  <div className="flex-1">
                    <h2 className="text-xl">
                      {p ? (
                        <Link
                          href={
                            i.customization_id
                              ? '/customize'
                              : `/products/${p.slug}`
                          }
                        >
                          {i.customization_id
                            ? `${i.customization_label || 'Personalized blanket'} — ${p.size_label || 'Selected size'}`
                            : productTitle(p)}
                        </Link>
                      ) : (
                        'Product unavailable'
                      )}
                    </h2>
                    {i.customization_id && (
                      <div className="personalization-summary">
                        <strong>Personalized blanket</strong>
                        <p>
                          {i.customization_label || 'Your approved artwork'}
                        </p>
                        <ArtworkDownload id={i.customization_id} />
                        <p className="mt-1">
                          Quantity uses this same photo and design. To use
                          another face, create another personalized blanket.
                        </p>
                      </div>
                    )}
                    <p className="my-2 text-sm">
                      {p
                        ? money(p.price_cents)
                        : 'Remove this item to continue'}
                      {p && !hasStock(p, i.quantity) && ' · Insufficient stock'}
                    </p>
                    {p &&
                      p.shipping_group !== 'blankets' &&
                      p.shipping_first_unit_cents !== null && (
                        <p className="mb-2 text-xs text-ink/70">
                          Standard shipping for these units:{' '}
                          {money(
                            p.shipping_first_unit_cents +
                              (i.quantity - 1) *
                                p.shipping_additional_unit_cents,
                          )}
                          . Any order-level free shipping applies at checkout.
                        </p>
                      )}
                    <button
                      className="link text-sm"
                      onClick={() =>
                        setItems(items.filter((j) => cartKey(j) !== cartKey(i)))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <label className="w-20">
                    Quantity
                    <input
                      aria-label={`Quantity for ${p?.name || 'item'}`}
                      type="number"
                      min={1}
                      max={
                        p?.shipping_group === 'blankets'
                          ? BLANKET_ORDER_LIMIT
                          : 99
                      }
                      value={i.quantity}
                      onChange={(e) =>
                        setItems(
                          items.map((j) =>
                            cartKey(j) === cartKey(i)
                              ? {
                                  ...j,
                                  quantity: Math.max(
                                    1,
                                    Math.min(
                                      p?.shipping_group === 'blankets'
                                        ? BLANKET_ORDER_LIMIT
                                        : 99,
                                      parseInt(e.target.value) || 1,
                                    ),
                                  ),
                                }
                              : j,
                          ),
                        )
                      }
                    />
                  </label>
                  <p className="w-20 text-right">
                    {money((p?.price_cents || 0) * i.quantity)}
                  </p>
                </article>
              );
            })}
          </section>
          <p className="mt-5 text-sm text-ink/60">
            Items are reserved for 30 minutes once you continue to payment. If
            you cancel, the reservation expires automatically.
          </p>
          <Link className="link mt-4 inline-block text-sm" href="/shop">
            ← Continue shopping
          </Link>
        </div>
        <form
          className="panel space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (validQuote && rate) void checkout();
            else void getRates();
          }}
        >
          <h2 className="text-2xl">Make it yours</h2>
          <label>
            Contact email
            <input
              type="email"
              autoComplete="email"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </label>
          <fieldset>
            <legend className="mb-4 font-semibold">Shipping address</legend>
            <AddressFields
              value={address}
              onChange={setAddress}
              restrictShipping
            />
          </fieldset>
          <label className="flex items-center gap-3">
            <input
              className="h-5 w-5"
              type="checkbox"
              checked={same}
              onChange={(e) => setSame(e.target.checked)}
            />
            Billing address is the same as shipping
          </label>
          {!same && (
            <fieldset>
              <legend className="mb-4 font-semibold">Billing address</legend>
              <AddressFields
                value={billing}
                onChange={setBilling}
                prefix="billing"
              />
            </fieldset>
          )}
          {validQuote && (
            <fieldset className="space-y-3">
              <legend className="mb-3 font-semibold">Shipping options</legend>
              {validQuote.rates.map((r) => (
                <label
                  key={r.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <input
                    className="!mt-0 h-5 w-5"
                    type="radio"
                    name="rate"
                    value={r.id}
                    checked={method === r.id}
                    onChange={() => setMethod(r.id)}
                  />
                  <span className="flex-1">
                    {r.name}
                    {r.fallback && (
                      <span className="mt-1 block text-xs font-normal">
                        USPS rates are currently unavailable. Our standard
                        shipping rate applies.
                      </span>
                    )}
                  </span>
                  <span>{money(r.amount)}</span>
                </label>
              ))}
            </fieldset>
          )}
          <dl className="space-y-3 border-t pt-5 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{money(validQuote?.subtotal ?? subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Estimated shipping</dt>
              <dd>{rate ? money(rate.amount) : 'Enter address'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Estimated tax</dt>
              <dd>{validQuote ? money(validQuote.tax) : 'Enter address'}</dd>
            </div>
            <div className="flex justify-between border-t pt-4 text-lg font-semibold">
              <dt>{validQuote ? 'Total' : 'Subtotal'}</dt>
              <dd>
                {money(
                  (validQuote?.subtotal ?? subtotal) +
                    (rate?.amount || 0) +
                    (validQuote?.tax || 0),
                )}
              </dd>
            </div>
          </dl>
          <Notice error={error} />
          <button
            className="btn w-full"
            disabled={pending || isRestrictedShippingAddress(address)}
          >
            {pending
              ? 'Please wait…'
              : validQuote && rate
                ? 'Continue to secure payment →'
                : 'Calculate shipping & tax'}
          </button>
          <p className="text-xs text-ink/65">
            Final shipping and tax are verified before payment. You’ll complete
            payment securely on Stripe. By ordering you accept our{' '}
            <Link className="link" href="/policies">
              store policies
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
