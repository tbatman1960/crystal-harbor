import { NextResponse } from 'next/server'

// POST /api/migrate/customization-tables
// Returns the SQL to create customization tables — run in Supabase SQL Editor
export async function POST() {
  const sql = `
-- Product customization columns on products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_allow_text BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_allow_image_upload BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_allow_catalog_designs BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_allow_ai_generation BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_allow_style_transfer BOOLEAN NOT NULL DEFAULT false;

-- Template images (one per product color)
CREATE TABLE IF NOT EXISTS product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  printable_area_x NUMERIC NOT NULL DEFAULT 25,
  printable_area_y NUMERIC NOT NULL DEFAULT 20,
  printable_area_width NUMERIC NOT NULL DEFAULT 50,
  printable_area_height NUMERIC NOT NULL DEFAULT 50,
  physical_width_inches NUMERIC NOT NULL DEFAULT 12,
  physical_height_inches NUMERIC NOT NULL DEFAULT 14,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customization settings (one row per product)
CREATE TABLE IF NOT EXISTS product_customization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  max_characters INT NOT NULL DEFAULT 100,
  max_lines INT NOT NULL DEFAULT 5,
  available_fonts TEXT NOT NULL DEFAULT '["Arial","Times New Roman","Impact","Comic Sans MS","Courier New","Georgia","Trebuchet MS","Verdana"]',
  available_colors TEXT NOT NULL DEFAULT '["#000000","#FFFFFF","#FF0000","#0000FF","#FFD700","#008000","#FF69B4","#800080"]',
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_text_element_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_image_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  ai_generation_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  ai_upscaling_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  style_transfer_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (consistent with site pattern — no policies, service role bypasses)
ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customization_settings ENABLE ROW LEVEL SECURITY;

-- Storage bucket for template images and customer uploads
-- Run this separately if it doesn't exist:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('customization', 'customization', true) ON CONFLICT DO NOTHING;
`

  return NextResponse.json({ sql, instructions: 'Run this SQL in the Supabase SQL Editor' })
}
