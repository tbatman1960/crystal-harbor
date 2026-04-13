import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { DesignLayer } from '@/modules/customization/types'

export const runtime = 'nodejs'

interface TemplateCreateData {
  name: string
  category: string
  description?: string
  thumbnailUrl?: string
  layerData: DesignLayer[]
  productTypes?: string[]
  displayOrder?: number
}

interface TemplateUpdateData extends Partial<TemplateCreateData> {
  isActive?: boolean
}

// GET - List all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') === 'true'
    const productType = searchParams.get('productType')

    let query = supabaseAdmin
      .from('design_templates')
      .select(`
        *,
        template_categories!inner(name, slug, icon_name)
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (productType) {
      // Filter by product type - either empty array (all products) or contains the specific type
      query = query.or(`product_types.eq.{},product_types.cs.{${productType}}`)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Templates fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const body: TemplateCreateData = await request.json()
    
    const { name, category, description, thumbnailUrl, layerData, productTypes = [], displayOrder = 0 } = body

    if (!name || !category || !layerData || layerData.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, category, and layerData are required' 
      }, { status: 400 })
    }

    // Validate layerData structure
    if (!Array.isArray(layerData) || layerData.some(layer => !layer.id || !layer.type)) {
      return NextResponse.json({ 
        error: 'Invalid layerData: must be array of valid design layers' 
      }, { status: 400 })
    }

    const { data: template, error } = await supabaseAdmin
      .from('design_templates')
      .insert({
        name,
        category,
        description,
        thumbnail_url: thumbnailUrl,
        layer_data: layerData,
        product_types: productTypes,
        display_order: displayOrder,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Template creation error:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Template creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const body: TemplateUpdateData = await request.json()
    const updateData: Record<string, any> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.category !== undefined) updateData.category = body.category
    if (body.description !== undefined) updateData.description = body.description
    if (body.thumbnailUrl !== undefined) updateData.thumbnail_url = body.thumbnailUrl
    if (body.layerData !== undefined) updateData.layer_data = body.layerData
    if (body.productTypes !== undefined) updateData.product_types = body.productTypes
    if (body.displayOrder !== undefined) updateData.display_order = body.displayOrder
    if (body.isActive !== undefined) updateData.is_active = body.isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 })
    }

    const { data: template, error } = await supabaseAdmin
      .from('design_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Template update error:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Template update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('design_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('Template deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}