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
        product_options(*)
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
      enable_volume_pricing = false,
      sizes = [],
      colors = [],
      custom_options = {},
      size_class = 'small',
      shipping_method = 'flat_rate',
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
        size_class: size_class || 'small',
        shipping_method: shipping_method || 'flat_rate',
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

    // Add custom options (keyed by option_type)
    if (custom_options && typeof custom_options === 'object') {
      const customRows: Array<{
        id: string
        product_id: string
        option_type: string
        option_value: string
        price_adjustment: number
      }> = []

      for (const [optionType, values] of Object.entries(custom_options)) {
        if (Array.isArray(values)) {
          values.forEach((item: any) => {
            customRows.push({
              id: uuidv4(),
              product_id: product.id,
              option_type: optionType,
              option_value: typeof item === 'string' ? item : item.value,
              price_adjustment: typeof item === 'object' ? (item.price_adjustment || 0) : 0
            })
          })
        }
      }

      if (customRows.length > 0) {
        const { error: customError } = await supabase
          .from('product_options')
          .insert(customRows)

        if (customError) {
          console.error('Error adding custom options:', customError)
        }
      }
    }

    // Auto-generate volume pricing tiers based on base price
    if (enable_volume_pricing) {
      const price = parseFloat(base_price)
      const tiers = [
        { tier_name: 'Tier 1', min_quantity: 1, max_quantity: 49, discount_percentage: 0 },
        { tier_name: 'Tier 2', min_quantity: 50, max_quantity: 249, discount_percentage: 18 },
        { tier_name: 'Tier 3', min_quantity: 250, max_quantity: null, discount_percentage: 32 },
      ]

      const tierRows = tiers.map(t => ({
        id: uuidv4(),
        product_id: product.id,
        tier_name: t.tier_name,
        min_quantity: t.min_quantity,
        max_quantity: t.max_quantity,
        price_per_unit: Math.round(price * (1 - t.discount_percentage / 100) * 100) / 100,
        discount_percentage: t.discount_percentage,
      }))

      const { error: tiersError } = await supabase
        .from('pricing_tiers')
        .insert(tierRows)

      if (tiersError) {
        console.error('Error creating pricing tiers:', tiersError)
      }
    }

    // Return created product
    return NextResponse.json({ product }, { status: 201 })

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}