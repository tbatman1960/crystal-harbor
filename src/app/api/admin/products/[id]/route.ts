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

    // Fetch shipping methods separately
    const { data: shippingMethods } = await supabase
      .from('product_shipping_methods')
      .select(`
        is_default,
        shipping_method:shipping_methods(*)
      `)
      .eq('product_id', id)

    // Separate sizes and colors
    const sizes = options?.filter(opt => opt.option_type === 'size') || []
    const colors = options?.filter(opt => opt.option_type === 'color') || []

    console.log('Product fetched successfully:', product?.name)

    return NextResponse.json({
      product: {
        ...product,
        sizes: sizes.map(s => ({ id: s.id, value: s.option_value })),
        colors: colors.map(c => ({ id: c.id, value: c.option_value })),
        pricing_tiers: pricingTiers || [],
        shipping_methods: shippingMethods || []
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
      shipping_methods = []
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

    // Update shipping method associations
    await supabase
      .from('product_shipping_methods')
      .delete()
      .eq('product_id', id)

    if (shipping_methods.length > 0) {
      const shippingAssociations = shipping_methods.map((methodId: string, index: number) => ({
        id: uuidv4(),
        product_id: id,
        shipping_method_id: methodId,
        is_default: index === 0
      }))

      const { error: shippingError } = await supabase
        .from('product_shipping_methods')
        .insert(shippingAssociations)

      if (shippingError) {
        console.error('Error updating shipping methods:', shippingError)
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
        pricing_tiers(*),
        product_shipping_methods(
          is_default,
          shipping_method:shipping_methods(*)
        )
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