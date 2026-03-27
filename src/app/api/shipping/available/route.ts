import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { getUSPSRates } from '@/lib/usps'

/**
 * POST /api/shipping/available
 * 
 * Given cart items and a destination zip, returns all available shipping options with prices.
 * 
 * Body: {
 *   items: Array<{ product_id: string; quantity: number }>,
 *   destination_zip: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, destination_zip } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 })
    }

    // Fetch product details (weights, dimensions) for all cart items
    const productIds = items.map((i: any) => i.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, weight_lbs, length_inches, width_inches, height_inches, category_id')
      .in('id', productIds)

    if (productsError) {
      console.error('Error fetching products for shipping:', productsError)
      return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 })
    }

    // Calculate total weight and find max dimensions (for package estimation)
    let totalWeight = 0
    let maxLength = 0, maxWidth = 0, totalHeight = 0

    for (const cartItem of items) {
      const product = products?.find((p: any) => p.id === cartItem.product_id)
      const qty = cartItem.quantity || 1
      
      // Use DB weight or fallback defaults
      const weight = product?.weight_lbs || 1.0
      totalWeight += weight * qty

      // For dimensions, use max L/W across items and sum heights
      const l = product?.length_inches || 10
      const w = product?.width_inches || 8
      const h = product?.height_inches || 2
      
      maxLength = Math.max(maxLength, l)
      maxWidth = Math.max(maxWidth, w)
      totalHeight += h * qty
    }

    // Cap height at reasonable max
    totalHeight = Math.min(totalHeight, 36)

    // Fetch all active shipping methods from DB
    const { data: methods, error: methodsError } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (methodsError) {
      console.error('Error fetching shipping methods:', methodsError)
      return NextResponse.json({ error: 'Failed to fetch shipping methods' }, { status: 500 })
    }

    // Get ship-from zip from site settings or env
    const { data: originSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'ship_from_zip')
      .single()
    
    const originZip = originSetting?.value || process.env.SHIP_FROM_ZIP || '46143'

    // Build shipping options
    const options: any[] = []

    for (const method of (methods || [])) {
      switch (method.method_type) {
        case 'free': {
          options.push({
            method_id: method.id,
            name: method.name,
            description: method.description,
            cost: 0,
            estimated_delivery: formatDays(method.estimated_days_min, method.estimated_days_max),
            type: 'free',
          })
          break
        }

        case 'flat_rate': {
          let cost = method.flat_rate_cost || 0
          // Check free shipping threshold
          if (method.min_order_for_free_shipping) {
            const subtotal = items.reduce((sum: number, i: any) => sum + (i.line_total || 0), 0)
            if (subtotal >= method.min_order_for_free_shipping) {
              cost = 0
            }
          }
          options.push({
            method_id: method.id,
            name: method.name,
            description: method.description,
            cost: Math.round(cost * 100) / 100,
            estimated_delivery: formatDays(method.estimated_days_min, method.estimated_days_max),
            type: 'flat_rate',
          })
          break
        }

        case 'weight_based': {
          if (method.weight_tiers && Array.isArray(method.weight_tiers)) {
            // Sort tiers by max_weight ascending
            const tiers = [...method.weight_tiers].sort((a: any, b: any) => a.max_weight - b.max_weight)
            const tier = tiers.find((t: any) => totalWeight <= t.max_weight)
            if (tier) {
              options.push({
                method_id: method.id,
                name: method.name,
                description: method.description || `${tier.name || 'Weight-based'} (${totalWeight.toFixed(1)} lbs)`,
                cost: Math.round(tier.cost * 100) / 100,
                estimated_delivery: formatDays(method.estimated_days_min, method.estimated_days_max),
                type: 'weight_based',
              })
            }
          }
          break
        }

        case 'calculated': {
          // Only process USPS carrier for now
          if (method.carrier_code === 'usps' && destination_zip) {
            const { rates, isMock, error } = await getUSPSRates({
              originZip,
              destinationZip: destination_zip,
              weightLbs: totalWeight,
              lengthInches: maxLength,
              widthInches: maxWidth,
              heightInches: totalHeight,
            })

            if (error) {
              console.warn('USPS rate fetch warning:', error)
            }

            for (const rate of rates) {
              options.push({
                method_id: method.id,
                name: rate.serviceName,
                description: isMock ? 'Estimated rate' : undefined,
                cost: rate.price,
                estimated_delivery: rate.estimatedDays,
                type: 'calculated',
                carrier: 'USPS',
                service_code: rate.serviceCode,
                is_mock: isMock,
              })
            }
          } else if (!destination_zip && method.carrier_code === 'usps') {
            // No zip yet — show placeholder
            options.push({
              method_id: method.id,
              name: 'USPS Calculated Shipping',
              description: 'Enter your ZIP code to see USPS rates',
              cost: null,
              estimated_delivery: 'Enter ZIP for estimate',
              type: 'calculated',
              carrier: 'USPS',
              needs_zip: true,
            })
          }
          break
        }
      }
    }

    // If no methods configured at all, provide a default flat rate fallback
    if (options.length === 0) {
      options.push({
        method_id: 'default_fallback',
        name: 'Standard Shipping',
        description: 'Default shipping rate',
        cost: 9.99,
        estimated_delivery: '5-7 business days',
        type: 'flat_rate',
        is_fallback: true,
      })
    }

    return NextResponse.json({
      options: options.sort((a, b) => (a.cost ?? 999) - (b.cost ?? 999)),
      package_info: {
        total_weight_lbs: Math.round(totalWeight * 100) / 100,
        dimensions: { length: maxLength, width: maxWidth, height: totalHeight },
      }
    })

  } catch (error) {
    console.error('Error calculating shipping options:', error)
    return NextResponse.json({ error: 'Failed to calculate shipping' }, { status: 500 })
  }
}

function formatDays(min: number, max: number): string {
  if (!min && !max) return '5-7 business days'
  if (min === max) return `${min} business days`
  return `${min}-${max} business days`
}
