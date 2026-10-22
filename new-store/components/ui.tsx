'use client';
import { useState } from 'react';
export async function api(path: string, body: unknown, method = 'POST') {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
export function Submit({
  children,
  pending = false,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <button className="btn" disabled={pending} type="submit">
      {pending ? 'Please wait…' : children}
    </button>
  );
}
export function Notice({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return (
    <>
      {error && (
        <p className="notice border-red-300 text-red-800" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </>
  );
}
export function Logout() {
  const [error, setError] = useState('');
  return (
    <>
      <button
        className="link"
        onClick={async () => {
          try {
            await api('/api/auth', { mode: 'logout' });
            window.location.href = '/';
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Sign out
      </button>
      <Notice error={error} />
    </>
  );
}
