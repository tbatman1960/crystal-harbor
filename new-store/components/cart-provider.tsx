'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { CartItem } from '@/lib/types';
import { cartSchema } from '@/lib/validation';
import { api } from './ui';
type Context = {
  items: CartItem[];
  ready: boolean;
  error: string;
  setItems: (items: CartItem[]) => void;
  add: (id: string, qty: number) => void;
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
          JSON.parse(localStorage.getItem('earth-cart') || '[]'),
        );
      } catch {}
      try {
        const r = await fetch('/api/cart');
        if (!r.ok) throw new Error('Cannot load saved cart');
        const d = await r.json();
        auth.current = d.authenticated;
        const merged = new Map<string, number>(
          (d.items || []).map((i: CartItem) => [i.product_id, i.quantity]),
        );
        local.forEach((i) =>
          merged.set(
            i.product_id,
            Math.max(i.quantity, merged.get(i.product_id) || 0),
          ),
        );
        const all = [...merged]
          .slice(0, 50)
          .map(([product_id, quantity]) => ({ product_id, quantity }));
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
      localStorage.setItem('earth-cart', JSON.stringify(next));
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
  function add(id: string, quantity: number) {
    const existing = items.find((i) => i.product_id === id);
    setItems(
      existing
        ? items.map((i) =>
            i.product_id === id
              ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
              : i,
          )
        : [...items, { product_id: id, quantity }].slice(0, 50),
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
