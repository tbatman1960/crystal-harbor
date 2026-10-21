export type Address = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: 'US';
};
export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  design_slug: string | null;
  size_label: string | null;
  price_cents: number;
  shipping_group?: 'blankets' | null;
  shipping_first_unit_cents: number | null;
  shipping_additional_unit_cents: number;
  sku: string;
  weight_lbs: number;
  inventory_count: number;
  is_active: boolean;
  product_images: {
    id?: string;
    url: string;
    sort_order: number;
    is_primary: boolean;
  }[];
};
export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
};
export type CartItem = { product_id: string; quantity: number };
export type Settings = {
  id: number;
  store_name: string;
  store_email: string;
  admin_alert_email: string;
  origin_zip: string;
  tax_rate_indiana: number;
  shipping_fallback_percent: number;
  shipping_fallback_minimum_cents: number;
  free_shipping_threshold_cents: number | null;
  package_length: number;
  package_width: number;
  package_height: number;
  ga4_id: string | null;
};
export type Rate = {
  id: string;
  name: string;
  amount: number;
  fallback?: boolean;
};
export const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  );
