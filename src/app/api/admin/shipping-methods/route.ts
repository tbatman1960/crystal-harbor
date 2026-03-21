import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// GET /api/admin/shipping-methods - Get all shipping methods
export async function GET() {
  try {
    const { data: methods, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching shipping methods:', error)
      return NextResponse.json({ error: 'Failed to fetch shipping methods' }, { status: 500 })
    }

    return NextResponse.json({ shipping_methods: methods || [] })

  } catch (error) {
    console.error('Error in shipping methods API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/shipping-methods - Create new shipping method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      method_type,
      flat_rate_cost,
      weight_tiers,
      carrier_code,
      service_code,
      min_order_for_free_shipping,
      estimated_days_min,
      estimated_days_max,
      active = true,
      display_order = 1
    } = body

    // Validate required fields
    if (!name || !method_type) {
      return NextResponse.json(
        { error: 'Name and method type are required' },
        { status: 400 }
      )
    }

    const { data: method, error } = await supabase
      .from('shipping_methods')
      .insert([{
        id: uuidv4(),
        name,
        description: description || null,
        method_type,
        flat_rate_cost: method_type === 'flat_rate' ? (flat_rate_cost ? parseFloat(flat_rate_cost) : null) : null,
        weight_tiers: method_type === 'weight_based' ? weight_tiers : null,
        carrier_code: method_type === 'calculated' ? carrier_code : null,
        service_code: method_type === 'calculated' ? service_code : null,
        min_order_for_free_shipping: min_order_for_free_shipping ? parseFloat(min_order_for_free_shipping) : null,
        estimated_days_min: parseInt(estimated_days_min) || 5,
        estimated_days_max: parseInt(estimated_days_max) || 7,
        active,
        display_order: parseInt(display_order) || 1
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating shipping method:', error)
      return NextResponse.json({ error: 'Failed to create shipping method' }, { status: 500 })
    }

    return NextResponse.json({ shipping_method: method }, { status: 201 })

  } catch (error) {
    console.error('Error creating shipping method:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}