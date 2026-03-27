import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Add weight and dimension columns to products table
    // Using individual RPC calls since Supabase REST doesn't support DDL
    const columns = [
      { name: 'weight_lbs', type: 'decimal' },
      { name: 'length_inches', type: 'decimal' },
      { name: 'width_inches', type: 'decimal' },
      { name: 'height_inches', type: 'decimal' },
    ]

    const results: string[] = []

    for (const col of columns) {
      // Try to add each column - will fail silently if already exists
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`
      })

      if (error) {
        // If rpc doesn't exist, provide the SQL for manual execution
        results.push(`Column ${col.name}: needs manual SQL - ALTER TABLE products ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`)
      } else {
        results.push(`Column ${col.name}: added successfully`)
      }
    }

    return NextResponse.json({ 
      message: 'Migration attempted',
      results,
      manual_sql: `
-- Run this in Supabase SQL Editor if the automatic migration didn't work:
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lbs decimal;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_inches decimal;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_inches decimal;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_inches decimal;
      `.trim()
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration failed', details: String(error) }, { status: 500 })
  }
}

// Also support GET to just return the SQL
export async function GET() {
  return NextResponse.json({
    message: 'Run this SQL in Supabase SQL Editor to add product dimension columns:',
    sql: [
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_lbs decimal;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS length_inches decimal;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS width_inches decimal;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS height_inches decimal;',
    ],
    update_defaults: `
-- Set default weights and dimensions for existing products:
UPDATE products SET weight_lbs = 0.5, length_inches = 10, width_inches = 8, height_inches = 1 WHERE slug = 'custom-t-shirt';
UPDATE products SET weight_lbs = 3.0, length_inches = 14, width_inches = 12, height_inches = 4 WHERE slug = 'custom-fleece-blanket';
UPDATE products SET weight_lbs = 1.0, length_inches = 24, width_inches = 4, height_inches = 4 WHERE slug = 'custom-vinyl-banner';
UPDATE products SET weight_lbs = 0.5, length_inches = 14, width_inches = 10, height_inches = 1 WHERE slug = 'custom-polyester-flag';
    `.trim()
  })
}
