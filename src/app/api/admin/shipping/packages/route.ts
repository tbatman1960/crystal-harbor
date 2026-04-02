import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// GET /api/admin/shipping/packages - Get all package types
export async function GET() {
  try {
    const { data: packages, error } = await supabase
      .from('shipping_packages')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching packages:', error)
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
    }

    return NextResponse.json({ packages: packages || [] })
  } catch (error) {
    console.error('Error in packages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/shipping/packages - Create new package type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      capacity_units,
      max_weight_lbs,
      length_inches,
      width_inches,
      height_inches,
      empty_weight_lbs = 0,
      fallback_rate,
      active = true,
      sort_order = 0
    } = body

    // Validate required fields
    if (!name || !capacity_units || !max_weight_lbs || !length_inches || !width_inches || !height_inches || !fallback_rate) {
      return NextResponse.json(
        { error: 'All package dimensions, capacity, weight, and fallback rate are required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('shipping_packages')
      .select('id')
      .eq('name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Package type with this name already exists' },
        { status: 400 }
      )
    }

    // Create package
    const { data: packageData, error: packageError } = await supabase
      .from('shipping_packages')
      .insert([{
        id: uuidv4(),
        name,
        capacity_units: parseFloat(capacity_units),
        max_weight_lbs: parseFloat(max_weight_lbs),
        length_inches: parseFloat(length_inches),
        width_inches: parseFloat(width_inches),
        height_inches: parseFloat(height_inches),
        empty_weight_lbs: parseFloat(empty_weight_lbs),
        fallback_rate: parseFloat(fallback_rate),
        active,
        sort_order: parseInt(sort_order) || 0
      }])
      .select()
      .single()

    if (packageError) {
      console.error('Error creating package:', packageError)
      return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
    }

    return NextResponse.json({ package: packageData }, { status: 201 })

  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}