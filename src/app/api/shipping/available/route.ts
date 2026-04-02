import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { calculateOptimalPacking, cartItemsToPackingItems } from '@/lib/packing'
import { getShippingRates } from '@/lib/carriers'

/**
 * POST /api/shipping/available
 * 
 * Given cart items and destination zip, returns shipping options using
 * the new package-based packing system with carrier API rates and fallback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, destination_zip } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 })
    }

    if (!destination_zip) {
      return NextResponse.json({ error: 'Destination zip code is required' }, { status: 400 })
    }

    // Fetch product details including new packing data
    const productIds = items.map((i: any) => i.product_id).filter(Boolean)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, packing_units, packed_weight_lbs')
      .in('id', productIds)

    if (productsError) {
      console.error('Error fetching products for shipping:', productsError)
      return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 })
    }

    // Fetch available package types
    const { data: packageTypes, error: packagesError } = await supabase
      .from('shipping_packages')
      .select('*')
      .eq('active', true)
      .order('sort_order')

    if (packagesError || !packageTypes || packageTypes.length === 0) {
      console.error('Error fetching package types:', packagesError)
      return NextResponse.json({ error: 'No shipping packages configured' }, { status: 500 })
    }

    // Get origin zip from settings
    const { data: settings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['shipping_origin_zip', 'ship_from_zip'])

    const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || [])
    const originZip = settingsMap.get('shipping_origin_zip') || 
                     settingsMap.get('ship_from_zip') || 
                     '46143'

    // Convert cart items to packing items
    const packingItems = cartItemsToPackingItems(items, products)

    if (packingItems.length === 0) {
      return NextResponse.json({ error: 'No valid products found for shipping calculation' }, { status: 400 })
    }

    // Calculate optimal packing
    const packingResult = calculateOptimalPacking(packingItems, packageTypes)

    if (packingResult.boxes.length === 0) {
      return NextResponse.json({ error: 'Unable to calculate shipping - no suitable packages found' }, { status: 400 })
    }

    // Get shipping rates from carriers or fallback
    const shippingRates = await getShippingRates(
      packingResult.boxes,
      originZip,
      destination_zip
    )

    // Convert to the expected format for frontend
    const options = shippingRates.rates.map(rate => ({
      method_id: rate.service.toLowerCase().replace(/\s+/g, '_'),
      name: rate.service,
      description: `${rate.service} (Ships in ${packingResult.total_packages} package${packingResult.total_packages !== 1 ? 's' : ''})`,
      cost: rate.total_cost,
      estimated_delivery: rate.estimated_days === 1 
        ? 'Next business day'
        : rate.estimated_days === 2 
          ? '2 business days'
          : `${rate.estimated_days} business days`,
      type: 'package_based',
      source: shippingRates.source,
      packages: packingResult.boxes.map(box => ({
        package_type: box.package_type.name,
        utilization: Math.round(box.utilization * 100),
        weight: box.gross_weight,
        dimensions: `${box.package_type.length_inches}"×${box.package_type.width_inches}"×${box.package_type.height_inches}"`
      })),
      breakdown: rate.per_package
    }))

    return NextResponse.json({ 
      options,
      packing_summary: {
        total_packages: packingResult.total_packages,
        total_weight: Number(packingResult.total_weight.toFixed(2)),
        total_units: Number(packingResult.total_units.toFixed(2))
      },
      source: shippingRates.source,
      origin_zip: originZip
    })

  } catch (error) {
    console.error('Error calculating shipping options:', error)
    return NextResponse.json({ error: 'Failed to calculate shipping' }, { status: 500 })
  }
}
