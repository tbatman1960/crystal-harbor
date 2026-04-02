import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

interface RouteParams {
  params: { id: string }
}

// PUT /api/admin/shipping/packages/[id] - Update package type
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
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

    // Check if package exists
    const { data: existing } = await supabase
      .from('shipping_packages')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Check for duplicate name (excluding current package)
    const { data: duplicate } = await supabase
      .from('shipping_packages')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single()

    if (duplicate) {
      return NextResponse.json(
        { error: 'Package type with this name already exists' },
        { status: 400 }
      )
    }

    // Update package
    const { data: packageData, error: updateError } = await supabase
      .from('shipping_packages')
      .update({
        name,
        capacity_units: parseFloat(capacity_units),
        max_weight_lbs: parseFloat(max_weight_lbs),
        length_inches: parseFloat(length_inches),
        width_inches: parseFloat(width_inches),
        height_inches: parseFloat(height_inches),
        empty_weight_lbs: parseFloat(empty_weight_lbs),
        fallback_rate: parseFloat(fallback_rate),
        active,
        sort_order: parseInt(sort_order) || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating package:', updateError)
      return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
    }

    return NextResponse.json({ package: packageData })

  } catch (error) {
    console.error('Error updating package:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/shipping/packages/[id] - Delete package type
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    // Check if package exists
    const { data: existing } = await supabase
      .from('shipping_packages')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // TODO: Check if package is being used in any orders or calculations
    // For now, we'll allow deletion but this could be enhanced

    // Delete package
    const { error: deleteError } = await supabase
      .from('shipping_packages')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting package:', deleteError)
      return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Package "${existing.name}" deleted successfully` 
    })

  } catch (error) {
    console.error('Error deleting package:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}