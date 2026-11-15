'use client';
import { useState } from 'react';
export function ReviewForm({
  itemId,
  token,
}: {
  itemId: string;
  token?: string;
}) {
  const [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="panel space-y-5 mt-6 max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        const f = new FormData(e.currentTarget);
        try {
          const r = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_item_id: itemId,
              token,
              rating: Number(f.get('rating')),
              display_name: f.get('display_name'),
              title: f.get('title'),
              body: f.get('body'),
            }),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setMessage(d.message);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {message ? (
        <p role="status">{message}</p>
      ) : (
        <>
          <label>
            Rating
            <select name="rating" defaultValue="5">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </label>
          <label>
            Public display name
            <input
              name="display_name"
              required
              maxLength={40}
              placeholder="First name or initials"
            />
          </label>
          <label>
            Review title
            <input name="title" required minLength={2} maxLength={100} />
          </label>
          <label>
            Your experience
            <textarea
              name="body"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
            />
          </label>
          <p className="text-xs">
            Please leave out addresses, contact details, and children’s
            identifying information. Reviews are checked before publication.
          </p>
          {error && <p role="alert">{error}</p>}
          <button className="btn" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit review'}
          </button>
        </>
      )}
    </form>
  );
}
