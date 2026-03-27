import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// GET /api/admin/products - Get all products with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const active = searchParams.get('active')

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        product_options!inner(*)
      `, { count: 'exact' })

    // Apply filters
    if (category) {
      query = query.eq('category_id', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (active !== null) {
      query = query.eq('active', active === 'true')
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    query = query.order('created_at', { ascending: false })

    const { data: products, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      category_id,
      base_price,
      material,
      active = true,
      weight_lbs,
      length_inches,
      width_inches,
      height_inches,
      sizes = [],
      colors = [],
      shipping_methods = []
    } = body

    // Validate required fields
    if (!name || !category_id || !base_price) {
      return NextResponse.json(
        { error: 'Name, category, and base price are required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([{
        id: uuidv4(),
        name,
        slug,
        description: description || null,
        category_id,
        base_price: parseFloat(base_price),
        material: material || null,
        active,
        weight_lbs: weight_lbs != null ? parseFloat(weight_lbs) : null,
        length_inches: length_inches != null ? parseFloat(length_inches) : null,
        width_inches: width_inches != null ? parseFloat(width_inches) : null,
        height_inches: height_inches != null ? parseFloat(height_inches) : null,
      }])
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    // Add product options (sizes)
    if (sizes.length > 0) {
      const sizeOptions = sizes.map((size: string) => ({
        id: uuidv4(),
        product_id: product.id,
        option_type: 'size',
        option_value: size
      }))

      const { error: sizesError } = await supabase
        .from('product_options')
        .insert(sizeOptions)

      if (sizesError) {
        console.error('Error adding sizes:', sizesError)
      }
    }

    // Add product options (colors)  
    if (colors.length > 0) {
      const colorOptions = colors.map((color: string) => ({
        id: uuidv4(),
        product_id: product.id,
        option_type: 'color',
        option_value: color
      }))

      const { error: colorsError } = await supabase
        .from('product_options')
        .insert(colorOptions)

      if (colorsError) {
        console.error('Error adding colors:', colorsError)
      }
    }

    // Add shipping method associations
    if (shipping_methods.length > 0) {
      const shippingAssociations = shipping_methods.map((methodId: string, index: number) => ({
        id: uuidv4(),
        product_id: product.id,
        shipping_method_id: methodId,
        is_default: index === 0 // First one is default
      }))

      const { error: shippingError } = await supabase
        .from('product_shipping_methods')
        .insert(shippingAssociations)

      if (shippingError) {
        console.error('Error adding shipping methods:', shippingError)
      }
    }

    // Return created product with relations
    const { data: fullProduct } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        sizes:product_options!inner(option_value),
        colors:product_options!inner(option_value),
        shipping_methods:product_shipping_methods(
          is_default,
          shipping_method:shipping_methods(*)
        )
      `)
      .eq('id', product.id)
      .single()

    return NextResponse.json({ product: fullProduct }, { status: 201 })

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}