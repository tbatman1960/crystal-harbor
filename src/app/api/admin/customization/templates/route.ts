import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// GET /api/admin/customization/templates?product_id=xxx
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('product_id')
    if (!productId) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('product_templates')
      .select('*')
      .eq('product_id', productId)
      .order('color_name')

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: data || [] })
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/customization/templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product_id,
      color_name,
      image_url,
      printable_area_x = 25,
      printable_area_y = 20,
      printable_area_width = 50,
      printable_area_height = 50,
      physical_width_inches = 12,
      physical_height_inches = 14,
    } = body

    if (!product_id || !color_name || !image_url) {
      return NextResponse.json(
        { error: 'product_id, color_name, and image_url are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('product_templates')
      .insert([{
        id: uuidv4(),
        product_id,
        color_name,
        image_url,
        printable_area_x,
        printable_area_y,
        printable_area_width,
        printable_area_height,
        physical_width_inches,
        physical_height_inches,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template: data }, { status: 201 })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/customization/templates
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Template id required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('product_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ template: data })
  } catch (error) {
    console.error('Templates PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/customization/templates?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Template id required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('product_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Templates DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
