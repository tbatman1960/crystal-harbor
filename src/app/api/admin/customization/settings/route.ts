import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// GET /api/admin/customization/settings?product_id=xxx
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('product_id')
    if (!productId) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('product_customization_settings')
      .select('*')
      .eq('product_id', productId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Return defaults if no row exists
    const settings = data || {
      product_id: productId,
      max_characters: 100,
      max_lines: 5,
      available_fonts: '["Arial","Times New Roman","Impact","Comic Sans MS","Courier New","Georgia","Trebuchet MS","Verdana"]',
      available_colors: '["#000000","#FFFFFF","#FF0000","#0000FF","#FFD700","#008000","#FF69B4","#800080"]',
      base_fee: 0,
      per_text_element_fee: 0,
      per_image_fee: 0,
      ai_generation_fee: 0,
      ai_upscaling_fee: 0,
      style_transfer_fee: 0,
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/customization/settings (upsert)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, ...fields } = body

    if (!product_id) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 })
    }

    // Ensure JSON strings for array fields
    if (Array.isArray(fields.available_fonts)) {
      fields.available_fonts = JSON.stringify(fields.available_fonts)
    }
    if (Array.isArray(fields.available_colors)) {
      fields.available_colors = JSON.stringify(fields.available_colors)
    }

    // Check if row exists
    const { data: existing } = await supabase
      .from('product_customization_settings')
      .select('id')
      .eq('product_id', product_id)
      .single()

    let data
    if (existing) {
      const { data: updated, error } = await supabase
        .from('product_customization_settings')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('product_id', product_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
      }
      data = updated
    } else {
      const { data: created, error } = await supabase
        .from('product_customization_settings')
        .insert([{ id: uuidv4(), product_id, ...fields }])
        .select()
        .single()

      if (error) {
        console.error('Error creating settings:', error)
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
      }
      data = created
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
