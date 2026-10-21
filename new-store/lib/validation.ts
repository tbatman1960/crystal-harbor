import { z } from 'zod';
export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  line1: z.string().trim().min(3).max(150),
  line2: z.string().trim().max(150).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().regex(/^[A-Z]{2}$/, 'Use a two-letter state code'),
  postal_code: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Enter a valid US ZIP code'),
  country: z.literal('US'),
});
export const cartSchema = z
  .array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .max(50)
  .refine(
    (a) => new Set(a.map((i) => i.product_id)).size === a.length,
    'Duplicate products',
  );
export const quoteSchema = z.object({
  items: cartSchema.refine((a) => a.length > 0, 'Your cart is empty'),
  address: addressSchema,
});
export const checkoutSchema = quoteSchema.extend({
  email: z.string().email().max(254),
  billing: addressSchema,
  shipping_method: z.string().min(1).max(100),
});
export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(150),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(10000),
  design_slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100)
    .nullable()
    .default(null),
  size_label: z.string().trim().min(1).max(80).nullable().default(null),
  price_cents: z.number().int().positive().max(10000000),
  shipping_group: z.literal('blankets').nullable().default(null),
  shipping_first_unit_cents: z.number().int().min(0).max(1000000),
  shipping_additional_unit_cents: z.number().int().min(0).max(1000000),
  sku: z.string().trim().min(1).max(100),
  weight_lbs: z.number().positive().max(1000).nullable().default(null),
  track_inventory: z.boolean().default(true),
  inventory_count: z.number().int().min(0).max(1000000),
  category_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
  images: z.array(z.string().url().startsWith('https://')).max(12),
});
export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  parent_id: z.string().uuid().nullable(),
  sort_order: z.number().int().min(0).max(10000),
});
export const settingsSchema = z.object({
  store_name: z.string().trim().min(1).max(100),
  store_email: z.string().email(),
  admin_alert_email: z.string().email(),
  origin_zip: z.string().regex(/^\d{5}$/),
  tax_rate_indiana: z.number().min(0).max(1),
  shipping_fallback_percent: z.number().min(0).max(1),
  shipping_fallback_minimum_cents: z.number().int().min(0),
  free_shipping_threshold_cents: z.number().int().min(0).nullable(),
  package_length: z.number().positive().max(100),
  package_width: z.number().positive().max(100),
  package_height: z.number().positive().max(100),
  ga4_id: z
    .string()
    .regex(/^G-[A-Z0-9]+$/)
    .nullable(),
});
