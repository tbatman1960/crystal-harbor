import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET /api/admin/shipping/size-classes
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shipping_size_classes')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching size classes:', error)
      return NextResponse.json({ error: 'Failed to fetch size classes' }, { status: 500 })
    }

    return NextResponse.json({ size_classes: data || [] })
  } catch (error) {
    console.error('Error in size classes API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/shipping/size-classes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, label, description, display_order } = body

    if (!name || !label) {
      return NextResponse.json({ error: 'Name and label are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('shipping_size_classes')
      .insert([{ name, label, description: description || null, display_order: display_order || 0 }])
      .select()
      .single()

    if (error) {
      console.error('Error creating size class:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ size_class: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating size class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/shipping/size-classes?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Get the size class name first for cleaning up rate tiers
    const { data: sc } = await supabase
      .from('shipping_size_classes')
      .select('name')
      .eq('id', id)
      .single()

    if (sc) {
      // Delete associated rate tiers
      await supabase
        .from('shipping_rate_tiers')
        .delete()
        .eq('size_class_name', sc.name)
    }

    const { error } = await supabase
      .from('shipping_size_classes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting size class:', error)
      return NextResponse.json({ error: 'Failed to delete size class' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting size class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
