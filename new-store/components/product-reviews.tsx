'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
type Review = {
  id: string;
  rating: number;
  display_name: string;
  title: string;
  body: string;
  admin_reply?: string;
  created_at: string;
};
export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    fetch(`/api/reviews?product=${productId}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error('Reviews are temporarily unavailable.');
        if (alive) setReviews(d.reviews);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [productId]);
  return (
    <section id="reviews" className="mt-14 border-t pt-8">
      <div className="flex justify-between flex-wrap gap-4">
        <h2>Customer reviews</h2>
        <Link href="/account/orders" className="link text-sm">
          Review a purchase
        </Link>
      </div>
      {!loaded ? (
        <p role="status" className="mt-4">
          Loading reviews…
        </p>
      ) : error ? (
        <p role="alert" className="notice">
          {error}
        </p>
      ) : reviews.length ? (
        <>
          <p className="my-4">
            {(
              reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
            ).toFixed(1)}{' '}
            / 5 · {reviews.length} verified-purchase review
            {reviews.length === 1 ? '' : 's'}
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {reviews.map((r) => (
              <article key={r.id} className="panel">
                <p
                  aria-label={`${r.rating} out of 5 stars`}
                  className="text-[var(--party-pink)]"
                >
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </p>
                <h3 className="mt-2 text-lg">{r.title}</h3>
                <p className="text-sm mt-3 whitespace-pre-line">{r.body}</p>
                <p className="text-xs mt-4">
                  {r.display_name} · Verified purchase ·{' '}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
                {r.admin_reply && (
                  <p className="notice">SnuggleBug: {r.admin_reply}</p>
                )}
              </article>
            ))}
          </div>
        </>
      ) : (
        <p className="notice">
          No reviews yet. Be the first to share your experience after your order
          ships.
        </p>
      )}
    </section>
  );
}
