import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET - Public endpoint for customers to fetch available templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const productType = searchParams.get('productType')

    let query = supabase
      .from('design_templates')
      .select(`
        id,
        name,
        category,
        description,
        thumbnail_url,
        layer_data,
        product_types,
        display_order
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (productType) {
      // Filter by product type - either empty array (all products) or contains the specific type
      query = query.or(`product_types.eq.{},product_types.cs.{${productType}}`)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Public templates fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Public templates API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET categories - fetch available template categories
export async function POST(request: NextRequest) {
  try {
    const { data: categories, error } = await supabase
      .from('template_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Categories fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}