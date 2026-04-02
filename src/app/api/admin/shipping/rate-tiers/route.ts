import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET /api/admin/shipping/rate-tiers
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shipping_rate_tiers')
      .select('*')
      .order('size_class_name, display_order', { ascending: true })

    if (error) {
      console.error('Error fetching rate tiers:', error)
      return NextResponse.json({ error: 'Failed to fetch rate tiers' }, { status: 500 })
    }

    return NextResponse.json({ rate_tiers: data || [] })
  } catch (error) {
    console.error('Error in rate tiers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/shipping/rate-tiers — replace all tiers for a size class
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { size_class_name, tiers } = body

    if (!size_class_name || !Array.isArray(tiers)) {
      return NextResponse.json({ error: 'size_class_name and tiers array are required' }, { status: 400 })
    }

    // Validate tiers
    for (const tier of tiers) {
      if (tier.min_quantity < 1) {
        return NextResponse.json({ error: 'Min quantity must be at least 1' }, { status: 400 })
      }
      if (tier.rate < 0) {
        return NextResponse.json({ error: 'Rate cannot be negative' }, { status: 400 })
      }
    }

    // Delete existing tiers for this size class
    const { error: delError } = await supabase
      .from('shipping_rate_tiers')
      .delete()
      .eq('size_class_name', size_class_name)

    if (delError) {
      console.error('Error deleting old tiers:', delError)
      return NextResponse.json({ error: 'Failed to update tiers' }, { status: 500 })
    }

    // Insert new tiers
    if (tiers.length > 0) {
      const { error: insError } = await supabase
        .from('shipping_rate_tiers')
        .insert(tiers.map((t: any, i: number) => ({
          size_class_name: size_class_name,
          min_quantity: parseInt(t.min_quantity),
          max_quantity: t.max_quantity != null ? parseInt(t.max_quantity) : null,
          rate: parseFloat(t.rate),
          display_order: t.display_order || i + 1
        })))

      if (insError) {
        console.error('Error inserting tiers:', insError)
        return NextResponse.json({ error: 'Failed to save tiers' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating rate tiers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
