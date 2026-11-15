'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArtworkDownload } from './artwork-download';
import { useCart } from './cart-provider';
export function SavedDesigns() {
  const [items, setItems] = useState<
      {
        id: string;
        config: { name: string; template: string; reference_name?: string };
        created_at: string;
        ordered: boolean;
      }[]
    >([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState('');
  const { items: cart, setItems: setCart } = useCart();
  useEffect(() => {
    fetch('/api/customizations')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Cannot load designs');
        setItems(d.items);
      })
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
  }, []);
  async function remove(id: string) {
    setBusy(id);
    setError('');
    try {
      const r = await fetch(`/api/customizations/${id}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not delete design');
      setItems(items.filter((i) => i.id !== id));
      setCart(cart.filter((i) => i.customization_id !== id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  return (
    <section>
      <h1>My saved designs</h1>
      <p className="mt-4 text-ink/70">
        Private to this browser session or your signed-in account. Unordered
        designs are available for 30 days.
      </p>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {!ready ? (
        <p className="mt-6" role="status">
          Loading your designs…
        </p>
      ) : items.length ? (
        <div className="mt-6 space-y-4">
          {items.map((i) => (
            <article className="panel" key={i.id}>
              <h2 className="text-xl">
                {i.config.name || 'Your personalized blanket'}
              </h2>
              <p className="text-sm mt-2">
                {i.config.reference_name || i.config.template} ·{' '}
                {new Date(i.created_at).toLocaleDateString()} ·{' '}
                {i.ordered ? 'Ordered' : 'Saved'}
              </p>
              <img
                className="mt-4 max-h-72 w-auto rounded-xl"
                src={`/api/customizations/${i.id}?file=preview`}
                alt={`${i.config.reference_name || 'Personalized blanket'} approved artwork`}
                loading="lazy"
              />
              <ArtworkDownload id={i.id} />
              {!i.ordered && (
                <button
                  type="button"
                  disabled={busy === i.id}
                  onClick={() => void remove(i.id)}
                  className="photo-delete block mt-3"
                >
                  {busy === i.id ? 'Deleting…' : 'Delete this design and photo'}
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="notice mt-6">
          You haven’t saved a design in this browser or account yet.
        </p>
      )}
      <Link className="btn mt-6" href="/customize">
        Create a blanket →
      </Link>
    </section>
  );
}
