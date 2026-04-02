import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { calculateFlatRate, calculateUSPSRate } from '@/lib/shipping-methods'

/**
 * POST /api/shipping/available
 * 
 * Given cart items and a destination zip, returns shipping cost per product
 * using the product's assigned shipping method (flat_rate, usps, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, destination_zip } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 })
    }

    // Fetch product details including size_class and shipping_method
    const productIds = items.map((i: any) => i.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, size_class, shipping_method')
      .in('id', productIds)

    if (productsError) {
      console.error('Error fetching products for shipping:', productsError)
      return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 })
    }

    // Get ship-from zip
    const { data: zipSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'ship_from_zip')
      .single()
    const shipFromZip = zipSetting?.value || '46143'

    let totalCost = 0
    const breakdown: any[] = []

    for (const cartItem of items) {
      const product = products?.find((p: any) => p.id === cartItem.product_id)
      const sizeClass = product?.size_class || 'small'
      const shippingMethod = product?.shipping_method || 'flat_rate'
      const quantity = cartItem.quantity || 1

      let cost = 0
      let serviceName = 'Flat Rate Shipping'

      if (shippingMethod === 'flat_rate') {
        cost = await calculateFlatRate(sizeClass, quantity)
        serviceName = 'Standard Shipping'
      } else if (shippingMethod === 'usps') {
        const result = await calculateUSPSRate(sizeClass, quantity, destination_zip || '', shipFromZip)
        cost = result.cost
        serviceName = result.service
      } else {
        // fedex, ups — not yet implemented, fall back to flat rate
        cost = await calculateFlatRate(sizeClass, quantity)
        serviceName = 'Standard Shipping'
      }

      totalCost += cost
      breakdown.push({
        product_id: product?.id,
        product_name: product?.name || 'Unknown Product',
        quantity,
        size_class: sizeClass,
        shipping_method: shippingMethod,
        cost: Math.round(cost * 100) / 100
      })
    }

    // Return as a single shipping option (product setting determines method, no user choice)
    const options = [{
      method_id: 'calculated',
      name: 'Shipping',
      description: breakdown.length > 1
        ? `Combined shipping for ${breakdown.length} items`
        : breakdown[0]?.product_name || 'Shipping',
      cost: Math.round(totalCost * 100) / 100,
      estimated_delivery: '5-7 business days',
      type: 'combined',
      breakdown
    }]

    return NextResponse.json({ options })

  } catch (error) {
    console.error('Error calculating shipping options:', error)
    return NextResponse.json({ error: 'Failed to calculate shipping' }, { status: 500 })
  }
}
