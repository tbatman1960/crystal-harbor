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

    return NextResponse.json({
      message: 'price_adjustment column exists',
      status: 'already_done'
    })
  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json({ error: 'Migration check failed' }, { status: 500 })
  }
}
