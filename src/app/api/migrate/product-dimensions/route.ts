import { NextResponse } from 'next/server'

// This migration endpoint just returns the SQL to run manually in Supabase SQL Editor.
// Supabase REST API doesn't support DDL (CREATE TABLE, ALTER TABLE, etc.)

export async function GET() {
  return NextResponse.json({
    message: 'Run this SQL in Supabase SQL Editor:',
    sql: `
-- Add weight and dimension columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lbs decimal;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_inches decimal;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_inches decimal;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_inches decimal;

-- Add shipping_method column to orders (stores the selected method name)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'Standard Shipping';

-- Set default weights and dimensions for existing products
UPDATE products SET weight_lbs = 0.5, length_inches = 10, width_inches = 8, height_inches = 1 WHERE slug = 'custom-t-shirt';
UPDATE products SET weight_lbs = 3.0, length_inches = 14, width_inches = 12, height_inches = 4 WHERE slug = 'custom-fleece-blanket';
UPDATE products SET weight_lbs = 1.0, length_inches = 24, width_inches = 4, height_inches = 4 WHERE slug = 'custom-vinyl-banner';
UPDATE products SET weight_lbs = 0.5, length_inches = 14, width_inches = 10, height_inches = 1 WHERE slug = 'custom-polyester-flag';

-- Create product_shipping_methods junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  shipping_method_id uuid REFERENCES shipping_methods(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, shipping_method_id)
);

-- Enable RLS on new table (matching existing pattern: enabled, no policies)
ALTER TABLE product_shipping_methods ENABLE ROW LEVEL SECURITY;

-- Add ship_from_zip to site_settings if not present
INSERT INTO site_settings (key, value, category, updated_at)
VALUES ('ship_from_zip', '46143', 'shipping', now())
ON CONFLICT (key) DO NOTHING;
    `.trim()
  })
}
