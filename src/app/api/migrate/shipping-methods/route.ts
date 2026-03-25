import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Creating shipping_methods table...')

    // Check if table already exists
    const { error: checkError } = await supabase
      .from('shipping_methods')
      .select('id')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({ 
        message: 'shipping_methods table already exists',
        success: true 
      })
    }

    // Create the table using raw SQL (if RPC available)
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS shipping_methods (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('flat_rate', 'weight_based', 'calculated')),
          flat_rate_cost DECIMAL(10,2),
          weight_tiers JSONB,
          carrier_code VARCHAR(50),
          service_code VARCHAR(50),
          min_order_for_free_shipping DECIMAL(10,2),
          estimated_days_min INTEGER DEFAULT 5,
          estimated_days_max INTEGER DEFAULT 7,
          active BOOLEAN DEFAULT true,
          display_order INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      INSERT INTO shipping_methods (name, description, method_type, flat_rate_cost, estimated_days_min, estimated_days_max) VALUES
      ('Standard Shipping', 'Regular ground shipping', 'flat_rate', 9.99, 5, 7),
      ('Express Shipping', 'Expedited 2-3 day delivery', 'flat_rate', 19.99, 2, 3),
      ('Free Shipping', 'Free shipping on orders over $75', 'flat_rate', 0.00, 7, 10)
      ON CONFLICT (id) DO NOTHING;
    `;

    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: createTableSQL 
      })

      if (error) {
        console.error('RPC exec_sql error:', error)
        throw error
      }
    } catch (rpcError) {
      console.log('RPC not available, table creation needs manual setup')
      return NextResponse.json({
        message: 'Table creation requires manual setup - RPC not available',
        sql: createTableSQL,
        success: false
      }, { status: 500 })
    }

    // Verify table was created
    const { error: verifyError } = await supabase
      .from('shipping_methods')
      .select('id')
      .limit(1)

    if (verifyError) {
      return NextResponse.json({
        message: 'Table creation may have failed - please run SQL manually',
        sql: createTableSQL,
        success: false
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'shipping_methods table created successfully',
      success: true
    })

  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({
      error: 'Migration failed - please run SQL manually in Supabase dashboard',
      sql: `
        -- Run this SQL in your Supabase dashboard:
        CREATE TABLE IF NOT EXISTS shipping_methods (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('flat_rate', 'weight_based', 'calculated')),
            flat_rate_cost DECIMAL(10,2),
            weight_tiers JSONB,
            carrier_code VARCHAR(50),
            service_code VARCHAR(50),
            min_order_for_free_shipping DECIMAL(10,2),
            estimated_days_min INTEGER DEFAULT 5,
            estimated_days_max INTEGER DEFAULT 7,
            active BOOLEAN DEFAULT true,
            display_order INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        INSERT INTO shipping_methods (name, description, method_type, flat_rate_cost, estimated_days_min, estimated_days_max) VALUES
        ('Standard Shipping', 'Regular ground shipping', 'flat_rate', 9.99, 5, 7),
        ('Express Shipping', 'Expedited 2-3 day delivery', 'flat_rate', 19.99, 2, 3),
        ('Free Shipping', 'Free shipping on orders over $75', 'flat_rate', 0.00, 7, 10);
      `,
      success: false
    }, { status: 500 })
  }
}