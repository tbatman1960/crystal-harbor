import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface RouteParams {
  params: { id: string }
}

// GET /api/admin/products/[id] - Get single product with full details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    console.log('Fetching product with ID:', id)

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    // Fetch product options separately
    const { data: options } = await supabase
      .from('product_options')
      .select('*')
      .eq('product_id', id)
      .order('display_order')

    // Fetch pricing tiers
    const { data: pricingTiers } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('product_id', id)
      .order('min_quantity')

    // Separate options by type
    const allOptions = options || []
    const sizes = allOptions.filter(opt => opt.option_type === 'size')
    const colors = allOptions.filter(opt => opt.option_type === 'color')
    
    // Group custom options (non-size/color) by type, include description
    const custom_options: Record<string, { description: string; values: Array<{ id: string; value: string; price_adjustment: number }> }> = {}
    allOptions
      .filter(opt => opt.option_type !== 'size' && opt.option_type !== 'color')
      .forEach(opt => {
        if (!custom_options[opt.option_type]) {
          custom_options[opt.option_type] = { description: opt.option_description || '', values: [] }
        }
        custom_options[opt.option_type].values.push({
          id: opt.id,
          value: opt.option_value,
          price_adjustment: opt.price_adjustment || 0
        })
      })

    console.log('Product fetched successfully:', product?.name)

    return NextResponse.json({
      product: {
        ...product,
        sizes: sizes.map(s => ({ id: s.id, value: s.option_value, price_adjustment: s.price_adjustment || 0 })),
        colors: colors.map(c => ({ id: c.id, value: c.option_value, price_adjustment: c.price_adjustment || 0 })),
        custom_options,
        pricing_tiers: pricingTiers || []
      }
    })

  } catch (error) {
    console.error('Error in product API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      name,
      description,
      category_id,
      base_price,
      material,
      active,
      weight_lbs,
      length_inches,
      width_inches,
      height_inches,
      regenerate_pricing_tiers = false,
      sizes = [],
      colors = [],
      custom_options = {},
      size_class,
      shipping_method,
    } = body

    // Validate required fields
    if (!name || !category_id || base_price === undefined) {
      return NextResponse.json(
        { error: 'Name, category, and base price are required' },
        { status: 400 }
      )
    }

    // Generate new slug if name changed
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
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
        ...(size_class !== undefined && { size_class }),
        ...(shipping_method !== undefined && { shipping_method }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (productError) {
      console.error('Error updating product:', productError)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    // Update product options - delete existing and recreate
    await supabase
      .from('product_options')
      .delete()
      .eq('product_id', id)

    // Add new sizes
    if (sizes.length > 0) {
      const sizeOptions = sizes.map((size: string) => ({
        id: uuidv4(),
        product_id: id,
        option_type: 'size',
        option_value: size
      }))

      const { error: sizesError } = await supabase
        .from('product_options')
        .insert(sizeOptions)

      if (sizesError) {
        console.error('Error updating sizes:', sizesError)
      }
    }

    // Add new colors
    if (colors.length > 0) {
      const colorOptions = colors.map((color: string) => ({
        id: uuidv4(),
        product_id: id,
        option_type: 'color',
        option_value: color
      }))

      const { error: colorsError } = await supabase
        .from('product_options')
        .insert(colorOptions)

      if (colorsError) {
        console.error('Error updating colors:', colorsError)
      }
    }

    // Add custom options (keyed by option_type)
    // custom_options format: { "Finish": { description: "...", values: [{ value: "Matte", price_adjustment: 0 }, ...] }, ... }
    if (custom_options && typeof custom_options === 'object') {
      const customRows: Array<{
        id: string
        product_id: string
        option_type: string
        option_value: string
        option_description: string
        price_adjustment: number
      }> = []

      for (const [optionType, data] of Object.entries(custom_options)) {
        const optionData = data as any
        const description = optionData.description || ''
        const values = Array.isArray(optionData) ? optionData : (optionData.values || [])
        
        if (Array.isArray(values)) {
          values.forEach((item: any) => {
            customRows.push({
              id: uuidv4(),
              product_id: id,
              option_type: optionType,
              option_value: typeof item === 'string' ? item : item.value,
              option_description: description,
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

    // Regenerate pricing tiers if requested
    if (regenerate_pricing_tiers && base_price) {
      // Delete existing tiers
      await supabase.from('pricing_tiers').delete().eq('product_id', id)

      const price = parseFloat(base_price)
      const tiers = [
        { tier_name: 'Tier 1', min_quantity: 1, max_quantity: 49, discount_percentage: 0 },
        { tier_name: 'Tier 2', min_quantity: 50, max_quantity: 249, discount_percentage: 18 },
        { tier_name: 'Tier 3', min_quantity: 250, max_quantity: null, discount_percentage: 32 },
      ]

      const tierRows = tiers.map(t => ({
        id: uuidv4(),
        product_id: id,
        tier_name: t.tier_name,
        min_quantity: t.min_quantity,
        max_quantity: t.max_quantity,
        price_per_unit: Math.round(price * (1 - t.discount_percentage / 100) * 100) / 100,
        discount_percentage: t.discount_percentage,
      }))

      const { error: tiersError } = await supabase.from('pricing_tiers').insert(tierRows)
      if (tiersError) console.error('Error regenerating pricing tiers:', tiersError)
    }

    // Return updated product with relations
    const { data: fullProduct } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        product_options(*),
        pricing_tiers(*)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({ product: fullProduct })

  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    // Check if product exists
    const { data: existing } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete product (cascade will handle related records)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      deleted_product: existing 
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}