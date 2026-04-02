import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET /api/migrate/add-price-adjustment — Add price_adjustment column to product_options
export async function GET() {
  try {
    // Check if column already exists by querying with it
    const { error: checkError } = await supabase
      .from('product_options')
      .select('price_adjustment')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({ message: 'Column price_adjustment already exists', status: 'already_done' })
    }

    // Column doesn't exist — provide SQL to run in Supabase SQL Editor
    const sql = `ALTER TABLE product_options ADD COLUMN price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0;`

    return NextResponse.json({
      message: 'Run this SQL in Supabase SQL Editor to add the price_adjustment column',
      sql,
      status: 'needs_migration'
    })
  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json({ error: 'Migration check failed' }, { status: 500 })
  }
}
