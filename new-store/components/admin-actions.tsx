'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Notice } from './ui';
export function DeleteButton({
  table,
  id,
}: {
  table: 'products' | 'categories';
  id: string;
}) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <div>
      <button
        className="link text-sm text-red-800"
        disabled={pending}
        onClick={async () => {
          if (
            !confirm(
              'Permanently delete this item? Categories with children must be emptied first.',
            )
          )
            return;
          setPending(true);
          try {
            await api('/api/admin', { kind: 'delete', value: { table, id } });
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setPending(false);
          }
        }}
      >
        Delete
      </button>
      <Notice error={error} />
    </div>
  );
}
export function PrintButton() {
  return (
    <button className="btn no-print mb-6" onClick={() => window.print()}>
      Print packing slip
    </button>
  );
}
export function RetryEmails() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <>
      <button
        className="btn secondary"
        onClick={async () => {
          try {
            await api('/api/admin', { kind: 'retry-email' });
            setMessage(
              'Pending email delivery attempted. Check the queue below after refreshing.',
            );
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Retry pending emails
      </button>
      <Notice message={message} error={error} />
    </>
  );
}
