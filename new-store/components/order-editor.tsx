'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Notice, Submit } from './ui';
export function OrderEditor({
  id,
  status,
  tracking,
}: {
  id: string;
  status: string;
  tracking: string | null;
}) {
  const [value, setValue] = useState(status);
  const [number, setNumber] = useState(tracking || '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <form
      className="panel mt-8 space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError('');
        try {
          await api('/api/admin', {
            kind: 'order',
            value: { id, status: value, tracking_number: number || null },
          });
          setMessage(
            'Order updated. A shipping email is queued when tracking is entered or changed.',
          );
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setPending(false);
        }
      }}
    >
      <h2 className="text-2xl">Fulfill this order</h2>
      <label>
        Status
        <select value={value} onChange={(e) => setValue(e.target.value)}>
          {['new', 'processing', 'shipped', 'delivered', 'cancelled'].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
      </label>
      <label>
        USPS tracking number
        <input
          maxLength={100}
          pattern="[a-zA-Z0-9 -]*"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
      </label>
      <p className="text-xs text-ink/70">
        Changing status does not issue a refund or restock inventory. Handle
        refunds in Stripe and adjust inventory separately after confirming
        returned stock.
      </p>
      <Notice error={error} message={message} />
      <Submit pending={pending}>Update order</Submit>
    </form>
  );
}
