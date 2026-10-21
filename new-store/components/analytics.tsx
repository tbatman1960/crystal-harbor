'use client';
import Script from 'next/script';
import { useEffect, useState } from 'react';
export function Analytics({ id }: { id: string | null }) {
  const [choice, setChoice] = useState<string | null>('loading');
  useEffect(() => {
    try {
      setChoice(localStorage.getItem('analytics-consent'));
    } catch {
      setChoice('denied');
    }
  }, []);
  if (!id || !/^G-[A-Z0-9]+$/.test(id)) return null;
  if (choice === 'accepted')
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
          strategy="afterInteractive"
        />
        <Script
          id="ga4-init"
          strategy="afterInteractive"
        >{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}</Script>
      </>
    );
  if (choice !== null) return null;
  function choose(value: string) {
    try {
      localStorage.setItem('analytics-consent', value);
    } catch {}
    setChoice(value);
  }
  return (
    <aside
      aria-label="Analytics preference"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-xl border bg-cream p-5 shadow-lg"
    >
      <p className="flex-1 text-sm">
        Allow anonymous visit statistics to help us improve the shop?
      </p>
      <button className="btn" onClick={() => choose('accepted')}>
        Allow
      </button>
      <button className="btn secondary" onClick={() => choose('denied')}>
        No thanks
      </button>
    </aside>
  );
}
