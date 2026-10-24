'use client';
import { useState } from 'react';
export function ArtworkCleanup() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  return (
    <div>
      <button
        type="button"
        className="btn secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage('');
          try {
            const r = await fetch('/api/admin/personalizations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'cleanup' }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'Cleanup failed');
            setMessage(
              `Removed ${d.removed} expired, unordered designs. Refresh to update this list.`,
            );
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? 'Removing expired uploads…'
          : 'Remove expired unordered uploads'}
      </button>
      {message && (
        <p role="status" className="notice mt-3">
          {message}
        </p>
      )}
    </div>
  );
}
