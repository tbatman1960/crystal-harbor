import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// GET /api/admin/design-catalog — list all designs
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || ''
    const category = request.nextUrl.searchParams.get('category') || ''
    const includeInactive = request.nextUrl.searchParams.get('include_inactive') === 'true'

    let query = supabase
      .from('design_catalog')
      .select('*')
      .order('category')
      .order('name')

    if (!includeInactive) {
      query = query.eq('active', true)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,tags.cs.{${search}}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching designs:', error)
      return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 })
    }

    // Get unique categories
    const { data: allDesigns } = await supabase
      .from('design_catalog')
      .select('category')

    const categories = Array.from(new Set((allDesigns || []).map((d: any) => d.category).filter(Boolean))).sort()

    return NextResponse.json({ designs: data || [], categories })
  } catch (error) {
    console.error('Design catalog GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/design-catalog — create design
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, image_url, category, tags = [], active = true } = body

    if (!name || !image_url || !category) {
      return NextResponse.json({ error: 'name, image_url, and category are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('design_catalog')
      .insert([{
        id: uuidv4(),
        name,
        description: description || null,
        image_url,
        category,
        tags: Array.isArray(tags) ? tags : [],
        active,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating design:', error)
      return NextResponse.json({ error: 'Failed to create design' }, { status: 500 })
    }

    return NextResponse.json({ design: data }, { status: 201 })
  } catch (error) {
    console.error('Design catalog POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/design-catalog — update design
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Design id required' }, { status: 400 })
    }

    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = []
    }

    const { data, error } = await supabase
      .from('design_catalog')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating design:', error)
      return NextResponse.json({ error: 'Failed to update design' }, { status: 500 })
    }

    return NextResponse.json({ design: data })
  } catch (error) {
    console.error('Design catalog PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/design-catalog?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Design id required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('design_catalog')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting design:', error)
      return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Design catalog DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
