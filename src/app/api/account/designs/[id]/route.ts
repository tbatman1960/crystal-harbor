import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET /api/account/designs/[id]?customer_id=uuid - Get full design data for loading
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const designId = params.id
    const customerId = request.nextUrl.searchParams.get('customer_id')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('saved_designs')
      .select('id, design_name, design_data, preview_image_url, product_id, created_at, updated_at')
      .eq('id', designId)
      .eq('customer_id', customerId) // Ensure customer owns this design
      .single()

    if (error) {
      console.error('Error fetching design:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Design not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to load design' }, { status: 500 })
    }

    return NextResponse.json({ design: data })
  } catch (err) {
    console.error('Get design API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/account/designs/[id] - Update an existing saved design
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const designId = params.id
    const body = await request.json()
    const { customer_id, design_name, design_data, preview_image_url } = body

    if (!customer_id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (design_name !== undefined) updateData.design_name = design_name
    if (design_data !== undefined) updateData.design_data = design_data
    if (preview_image_url !== undefined) updateData.preview_image_url = preview_image_url

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('saved_designs')
      .update(updateData)
      .eq('id', designId)
      .eq('customer_id', customer_id) // Ensure customer owns this design
      .select('id, design_name, preview_image_url, updated_at')
      .single()

    if (error) {
      console.error('Error updating design:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Design not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to update design' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      design: data,
      message: 'Design updated successfully'
    })
  } catch (err) {
    console.error('Update design API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}