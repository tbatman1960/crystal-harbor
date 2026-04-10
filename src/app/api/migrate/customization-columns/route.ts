import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// POST /api/migrate/customization-columns
// Adds customization fields to the products table
export async function POST() {
  const columns = [
    'is_customizable',
    'customization_allow_text',
    'customization_allow_image_upload',
    'customization_allow_catalog_designs',
    'customization_allow_ai_generation',
    'customization_allow_style_transfer',
  ]

  try {
    // Check which columns already exist
    const { data: sample } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single()

    const existingCols = sample ? Object.keys(sample) : []
    const missing = columns.filter(col => !existingCols.includes(col))

    if (missing.length === 0) {
      return NextResponse.json({ message: 'All customization columns already exist', added: [] })
    }

    // Try adding columns by inserting/updating with default values
    // Supabase REST API doesn't support DDL, so provide SQL for manual execution
    const sql = missing.map(col =>
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS ${col} BOOLEAN NOT NULL DEFAULT false;`
    ).join('\n')

    return NextResponse.json({
      message: 'Run this SQL in the Supabase SQL Editor (https://supabase.com/dashboard/project/bdcqyconjwevyzjlubce/sql/new)',
      missing,
      sql,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Migration check failed' }, { status: 500 })
  }
}

// GET - check status
export async function GET() {
  try {
    const { data } = await supabase
      .from('products')
      .select('is_customizable')
      .limit(1)

    return NextResponse.json({ migrated: true })
  } catch {
    return NextResponse.json({ migrated: false })
  }
}
