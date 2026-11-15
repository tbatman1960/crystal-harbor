'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart, CartCount } from './cart-provider';
import { cartKey } from '@/lib/personalization/designs';
import { catalogImage } from '@/lib/personalization/catalog-reference';
import { money, type Product } from '@/lib/types';
export function CartDrawer({ products }: { products: Product[] }) {
  const { items, drawerOpen, setDrawerOpen, setItems, ready } = useCart(),
    ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (drawerOpen && !d.open) d.showModal();
    else if (!drawerOpen && d.open) d.close();
    if (!drawerOpen) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;
    };
  }, [drawerOpen]);
  const subtotal = items.reduce(
    (n, i) =>
      n +
      (products.find((p) => p.id === i.product_id)?.price_cents || 0) *
        i.quantity,
    0,
  );
  return (
    <>
      <button
        className="party-bag"
        type="button"
        onClick={() => setDrawerOpen(true)}
      >
        Bag (<CartCount />)
      </button>
      <dialog
        ref={ref}
        className="cart-drawer"
        aria-labelledby="bag-title"
        onClose={() => setDrawerOpen(false)}
        onCancel={() => setDrawerOpen(false)}
      >
        <div className="flex justify-between items-center border-b pb-4">
          <h2 id="bag-title" className="text-2xl">
            Your bag{' '}
            <span className="text-sm">
              (<CartCount />)
            </span>
          </h2>
          <button
            type="button"
            autoFocus
            className="link p-2"
            onClick={() => setDrawerOpen(false)}
          >
            Close
          </button>
        </div>
        {!ready ? (
          <p role="status">Loading your bag…</p>
        ) : !items.length ? (
          <p className="py-8">A little room for something personal.</p>
        ) : (
          <>
            <div className="divide-y">
              {items.map((i) => {
                const p = products.find((p) => p.id === i.product_id);
                return (
                  <article key={cartKey(i)} className="flex gap-3 py-5">
                    <img
                      className="h-28 w-20 object-cover rounded-lg"
                      src={
                        i.customization_id
                          ? `/api/customizations/${i.customization_id}?file=preview`
                          : p
                            ? catalogImage(p) || '/placeholder.svg'
                            : '/placeholder.svg'
                      }
                      alt={p?.name || 'Unavailable product'}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base">
                        {p?.name || 'Unavailable product'}
                      </h3>
                      <p className="text-sm">{p?.size_label}</p>
                      <p className="text-sm mt-1">
                        {money(p?.price_cents || 0)} × {i.quantity}
                      </p>
                      {i.customization_id && (
                        <span className="text-xs text-[var(--party-pink)]">
                          Your approved artwork
                        </span>
                      )}
                      <div className="flex gap-4 mt-2">
                        <label className="text-xs">
                          Quantity
                          <input
                            className="!w-20 !py-1"
                            type="number"
                            min={1}
                            max={5}
                            value={i.quantity}
                            onChange={(e) =>
                              setItems(
                                items.map((x) =>
                                  cartKey(x) === cartKey(i)
                                    ? {
                                        ...x,
                                        quantity: Math.max(
                                          1,
                                          Math.min(
                                            5,
                                            Number(e.target.value) || 1,
                                          ),
                                        ),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="link text-xs"
                          onClick={() =>
                            setItems(
                              items.filter((x) => cartKey(x) !== cartKey(i)),
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="border-t pt-5 mt-4">
              <p className="flex justify-between font-bold">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </p>
              <p className="text-xs mt-2 mb-4">
                Shipping and any discount calculated at checkout. Up to five
                blankets per order.
              </p>
              <Link
                href="/cart"
                className="btn w-full"
                onClick={() => setDrawerOpen(false)}
              >
                View bag & checkout →
              </Link>
            </div>
          </>
        )}
        <button
          className="link mt-5 w-full"
          onClick={() => setDrawerOpen(false)}
        >
          Continue shopping
        </button>
      </dialog>
    </>
  );
}
