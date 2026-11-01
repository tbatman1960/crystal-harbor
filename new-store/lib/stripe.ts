import { siteUrl } from '@/lib/site-url';
import 'server-only';
import Stripe from 'stripe';
import { assertPaymentMode } from './payment-mode';
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured.');
  assertPaymentMode(key, siteUrl(), process.env.CONTEXT);
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}
