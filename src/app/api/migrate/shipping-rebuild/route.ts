import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting shipping system migration...');

    // Complete SQL for manual execution if RPC fails
    const allSQL = `
      -- Step 1: Add packing columns to products table
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS packing_units DECIMAL(10,2) NOT NULL DEFAULT 1.0,
      ADD COLUMN IF NOT EXISTS packed_weight_lbs DECIMAL(10,2) NOT NULL DEFAULT 0.5;

      -- Step 2: Create shipping_packages table
      CREATE TABLE IF NOT EXISTS shipping_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        capacity_units DECIMAL(10,2) NOT NULL,
        max_weight_lbs DECIMAL(10,2) NOT NULL,
        length_inches DECIMAL(10,2) NOT NULL,
        width_inches DECIMAL(10,2) NOT NULL,
        height_inches DECIMAL(10,2) NOT NULL,
        empty_weight_lbs DECIMAL(10,2) NOT NULL DEFAULT 0,
        fallback_rate DECIMAL(10,2) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- Step 3: Add shipping_details column to orders table
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS shipping_details JSONB;

      -- Step 4: Update existing products with initial packing values
      UPDATE products 
      SET packing_units = CASE
        WHEN name = 'Custom T-Shirt' THEN 1.0
        WHEN name = 'Custom Fleece Blanket' THEN 4.0
        WHEN name = 'Custom Vinyl Banner' THEN 5.0
        WHEN name = 'Custom Polyester Flag' THEN 1.0
        ELSE 1.0
      END,
      packed_weight_lbs = CASE
        WHEN name = 'Custom T-Shirt' THEN 0.5
        WHEN name = 'Custom Fleece Blanket' THEN 3.0
        WHEN name = 'Custom Vinyl Banner' THEN 2.0
        WHEN name = 'Custom Polyester Flag' THEN 0.5
        ELSE 0.5
      END;

      -- Step 5: Insert default package types
      INSERT INTO shipping_packages (name, capacity_units, max_weight_lbs, length_inches, width_inches, height_inches, empty_weight_lbs, fallback_rate, sort_order)
      VALUES 
        ('Poly Mailer', 2, 3, 12, 10, 2, 0.1, 7.99, 1),
        ('Small Box', 8, 10, 14, 12, 6, 0.5, 12.99, 2),
        ('Medium Box', 20, 25, 18, 16, 10, 0.8, 19.99, 3),
        ('Large Box', 40, 50, 24, 20, 14, 1.2, 29.99, 4),
        ('Extra Large Box', 80, 80, 30, 24, 18, 2.0, 44.99, 5)
      ON CONFLICT (name) DO NOTHING;

      -- Step 6: Add site settings for shipping fallback
      INSERT INTO site_settings (key, value)
      VALUES 
        ('shipping_fallback_min_per_package', '4.99'),
        ('shipping_fallback_markup_pct', '0'),
        ('shipping_origin_zip', '46143')
      ON CONFLICT (key) DO NOTHING;

      -- Enable RLS on new table (consistent with existing pattern)
      ALTER TABLE shipping_packages ENABLE ROW LEVEL SECURITY;
    `;

    // Try to execute via RPC (may not be available)
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: allSQL 
      });

      if (error) {
        console.error('RPC exec_sql error:', error);
        throw error;
      }
    } catch (rpcError) {
      console.log('RPC not available, returning SQL for manual execution');
      return NextResponse.json({
        success: false,
        message: 'Database migration requires manual setup - RPC not available',
        sql: allSQL,
        instructions: 'Please run the above SQL in Supabase SQL Editor'
      }, { status: 500 });
    }

    // Verify migration success
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('packing_units, packed_weight_lbs')
      .limit(1);

    const { data: packages, error: packagesError } = await supabase
      .from('shipping_packages')
      .select('*')
      .limit(1);

    if (productsError || packagesError) {
      throw new Error('Migration verification failed');
    }

    console.log('Shipping system migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Shipping system migration completed successfully',
      changes: [
        'Added packing_units and packed_weight_lbs columns to products',
        'Created shipping_packages table with 5 default package types',
        'Added shipping_details JSONB column to orders',
        'Updated existing products with initial packing data',
        'Added shipping fallback site settings'
      ]
    });

  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}