'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './cart-provider';
export function Confirmation({
  paid,
  sessionId,
}: {
  paid: boolean;
  sessionId: string;
}) {
  const { ready, setItems } = useCart();
  const router = useRouter();
  useEffect(() => {
    if (!paid) {
      const t = setTimeout(() => router.refresh(), 4000);
      return () => clearTimeout(t);
    }
    if (ready && !sessionStorage.getItem(`confirmed-${sessionId}`)) {
      setItems([]);
      sessionStorage.setItem(`confirmed-${sessionId}`, 'yes');
    }
  }, [paid, ready, router, setItems, sessionId]);
  return null;
}
