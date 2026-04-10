import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import type { DesignSpecification } from '@/modules/customization'

// GET /api/account/designs?customer_id=uuid - List customer's saved designs
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customer_id')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('saved_designs')
      .select('id, design_name, preview_image_url, product_id, created_at, updated_at')
      .eq('customer_id', customerId)
      .order('updated_at', { ascending: false })
      .limit(50) // Reasonable limit for saved designs

    if (error) {
      console.error('Error fetching saved designs:', error)
      return NextResponse.json({ error: 'Failed to load saved designs' }, { status: 500 })
    }

    return NextResponse.json({ designs: data || [] })
  } catch (err) {
    console.error('Account designs GET API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/account/designs - Save a new design
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id, product_id, design_name, design_data, preview_image_url } = body

    // Validation
    if (!customer_id || !product_id || !design_data) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, product_id, design_data' 
      }, { status: 400 })
    }

    // Validate design_data is a valid DesignSpecification
    if (!design_data.designId || !design_data.layers || !Array.isArray(design_data.layers)) {
      return NextResponse.json({ 
        error: 'Invalid design_data format' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('saved_designs')
      .insert([{
        customer_id,
        product_id,
        design_name: design_name || 'Untitled Design',
        design_data,
        preview_image_url: preview_image_url || null
      }])
      .select('id, design_name, preview_image_url, created_at')
      .single()

    if (error) {
      console.error('Error saving design:', error)
      return NextResponse.json({ error: 'Failed to save design' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      design: data,
      message: 'Design saved successfully'
    })
  } catch (err) {
    console.error('Account designs POST API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/account/designs?design_id=uuid&customer_id=uuid - Delete a saved design
export async function DELETE(request: NextRequest) {
  try {
    const designId = request.nextUrl.searchParams.get('design_id')
    const customerId = request.nextUrl.searchParams.get('customer_id')
    
    if (!designId || !customerId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: design_id and customer_id' 
      }, { status: 400 })
    }

    // Delete the design (RLS will ensure customer can only delete their own)
    const { error } = await supabase
      .from('saved_designs')
      .delete()
      .eq('id', designId)
      .eq('customer_id', customerId) // Extra safety check

    if (error) {
      console.error('Error deleting saved design:', error)
      return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Design deleted successfully'
    })
  } catch (err) {
    console.error('Account designs DELETE API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}