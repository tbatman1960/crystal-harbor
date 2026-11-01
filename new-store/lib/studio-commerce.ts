import 'server-only';
import { z } from 'zod';
import { service, check } from './supabase';
import { PersonalizationError } from './personalization/errors';
export const offerSchema = z.object({
  rewards_enabled: z.boolean(),
  reward_threshold_cents: z.number().int().min(100).max(1000000),
  reward_percent: z.number().int().min(1).max(50),
  reward_minimum_cents: z.number().int().min(100).max(1000000),
  reward_valid_days: z.number().int().min(1).max(365),
});
export async function couponDiscount(
  code: string | undefined,
  email: string | undefined,
  subtotal: number,
) {
  if (!code) return 0;
  const { data: c, error } = await service()
    .from('studio_coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle();
  check(error);
  if (
    !c ||
    !c.active ||
    c.redeemed_order_id ||
    new Date(c.expires_at).getTime() <= Date.now() ||
    !email ||
    c.email.toLowerCase() !== email.toLowerCase() ||
    subtotal < c.minimum_cents
  )
    throw new PersonalizationError(
      'This coupon is unavailable for this email or order amount.',
    );
  return Math.floor((subtotal * c.percent) / 100);
}
