import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const results: string[] = []

  try {
    // Step 1: Create shipping_size_classes table
    // Check if it exists first
    const { error: sizeClassCheck } = await supabase
      .from('shipping_size_classes')
      .select('id')
      .limit(1)

    if (sizeClassCheck) {
      // Table doesn't exist — provide SQL
      results.push('shipping_size_classes: TABLE DOES NOT EXIST — run SQL below')
    } else {
      results.push('shipping_size_classes: already exists')
    }

    // Step 2: Create shipping_rate_tiers table
    const { error: tierCheck } = await supabase
      .from('shipping_rate_tiers')
      .select('id')
      .limit(1)

    if (tierCheck) {
      results.push('shipping_rate_tiers: TABLE DOES NOT EXIST — run SQL below')
    } else {
      results.push('shipping_rate_tiers: already exists')
    }

    // Step 3: Check if products has size_class column
    const { data: testProduct } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single()

    const hasShippingCols = testProduct && 'size_class' in testProduct
    if (hasShippingCols) {
      results.push('products.size_class: column exists')
    } else {
      results.push('products.size_class: COLUMN MISSING — run SQL below')
    }

    const sql = `
-- ============================================
-- SHIPPING V2 MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create shipping_size_classes table
CREATE TABLE IF NOT EXISTS shipping_size_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (no policies = service role only)
ALTER TABLE shipping_size_classes ENABLE ROW LEVEL SECURITY;

-- Seed default size classes
INSERT INTO shipping_size_classes (id, name, label, description, display_order) VALUES
  ('${uuidv4()}', 'small', 'Small', 'T-shirts, garden flags — poly mailer shipping', 1),
  ('${uuidv4()}', 'medium', 'Medium', 'House flags — medium box shipping', 2),
  ('${uuidv4()}', 'large', 'Large', 'Blankets, banners — large box shipping', 3)
ON CONFLICT (name) DO NOTHING;

-- 2. Create shipping_rate_tiers table (quantity brackets × size classes = price)
CREATE TABLE IF NOT EXISTS shipping_rate_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  size_class_name VARCHAR(50) NOT NULL,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER,  -- NULL means unlimited (e.g., 25+)
  rate DECIMAL(10,2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shipping_rate_tiers ENABLE ROW LEVEL SECURITY;

-- Seed default rate tiers (3 brackets × 3 size classes = 9 rows)
INSERT INTO shipping_rate_tiers (id, size_class_name, min_quantity, max_quantity, rate, display_order) VALUES
  -- Small (t-shirts, garden flags)
  ('${uuidv4()}', 'small', 1, 5, 7.99, 1),
  ('${uuidv4()}', 'small', 6, 24, 10.99, 2),
  ('${uuidv4()}', 'small', 25, NULL, 15.99, 3),
  -- Medium (house flags)
  ('${uuidv4()}', 'medium', 1, 5, 9.99, 1),
  ('${uuidv4()}', 'medium', 6, 24, 14.99, 2),
  ('${uuidv4()}', 'medium', 25, NULL, 21.99, 3),
  -- Large (blankets, banners)
  ('${uuidv4()}', 'large', 1, 5, 12.99, 1),
  ('${uuidv4()}', 'large', 6, 24, 19.99, 2),
  ('${uuidv4()}', 'large', 25, NULL, 29.99, 3);

-- 3. Add shipping columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_class VARCHAR(50) DEFAULT 'small';
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(20) DEFAULT 'flat_rate';

-- 4. Set default size classes based on existing categories
UPDATE products SET size_class = 'large' 
WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('blankets', 'banners'));

UPDATE products SET size_class = 'small' 
WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('t-shirts'));

UPDATE products SET size_class = 'medium' 
WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('flags'));

-- 5. Clean up old shipping data
DELETE FROM shipping_methods;

-- 6. Add a single default config row to site_settings for shipping
INSERT INTO site_settings (key, value, category, updated_at) VALUES
  ('default_shipping_method', 'flat_rate', 'shipping', NOW()),
  ('ship_from_zip', '46143', 'shipping', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
`

    return NextResponse.json({
      status: 'migration_check_complete',
      results,
      sql,
      instructions: 'Copy the SQL above and run it in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor). Then call this endpoint again to verify.'
    })

  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
