'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { CartItem } from '@/lib/types';
import { cartSchema } from '@/lib/validation';
import { api } from './ui';
import { cartKey } from '@/lib/personalization/designs';
type Context = {
  items: CartItem[];
  ready: boolean;
  error: string;
  setItems: (items: CartItem[]) => void;
  add: (
    id: string,
    qty: number,
    customization?: Pick<CartItem, 'customization_id' | 'customization_label'>,
  ) => void;
};
const CartContext = createContext<Context>({
  items: [],
  ready: false,
  error: '',
  setItems: () => {},
  add: () => {},
});
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setState] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const auth = useRef(false);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    let alive = true;
    (async () => {
      let local: CartItem[] = [];
      try {
        local = cartSchema.parse(
          JSON.parse(
            localStorage.getItem('snuggle-personalization-preview-cart') ||
              '[]',
          ),
        );
      } catch {}
      try {
        const r = await fetch('/api/cart');
        if (!r.ok) throw new Error('Cannot load saved cart');
        const d = await r.json();
        auth.current = d.authenticated;
        const merged = new Map<string, CartItem>(
          (d.items || []).map((i: CartItem) => [cartKey(i), i]),
        );
        local.forEach((i) => {
          const old = merged.get(cartKey(i));
          merged.set(cartKey(i), {
            ...i,
            quantity: Math.max(i.quantity, old?.quantity || 0),
          });
        });
        const all = [...merged.values()].slice(0, 50);
        try {
          localStorage.setItem(
            'snuggle-personalization-preview-cart',
            JSON.stringify(all),
          );
        } catch {}
        if (alive) {
          setState(all);
          if (d.authenticated) await api('/api/cart', all, 'PUT');
        }
      } catch (e) {
        if (alive) {
          setState(local);
          setError((e as Error).message);
        }
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  function setItems(next: CartItem[]) {
    setState(next);
    try {
      localStorage.setItem(
        'snuggle-personalization-preview-cart',
        JSON.stringify(next),
      );
    } catch {
      setError('Your browser could not save this cart.');
    }
    if (auth.current) {
      queue.current = queue.current.then(async () => {
        try {
          await api('/api/cart', next, 'PUT');
          setError('');
        } catch (e) {
          setError((e as Error).message);
        }
      });
    }
  }
  function add(
    id: string,
    quantity: number,
    customization: Pick<
      CartItem,
      'customization_id' | 'customization_label'
    > = {},
  ) {
    const key = cartKey({ product_id: id, ...customization });
    const existing = items.find((i) => cartKey(i) === key);
    setItems(
      existing
        ? items.map((i) =>
            cartKey(i) === key
              ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
              : i,
          )
        : [...items, { product_id: id, quantity, ...customization }].slice(
            0,
            50,
          ),
    );
  }
  return (
    <CartContext.Provider value={{ items, ready, error, setItems, add }}>
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
export function CartCount() {
  const { items } = useCart();
  return (
    <span aria-label={`${items.reduce((n, i) => n + i.quantity, 0)} items`}>
      {items.reduce((n, i) => n + i.quantity, 0)}
    </span>
  );
}
