import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { calculateOptimalPacking, PackingItem, PackageType } from '@/lib/packing'
import { getShippingRates } from '@/lib/carriers'

/**
 * POST /api/admin/shipping/test-calculate
 * 
 * Test endpoint that accepts packing data directly (no product_id lookup needed).
 * Used by the admin test calculator.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, destination_zip } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (!destination_zip) {
      return NextResponse.json({ error: 'Destination zip code is required' }, { status: 400 })
    }

    // Items come directly with packing data
    const packingItems: PackingItem[] = items.map((item: any) => ({
      product_name: item.product_name,
      quantity: item.quantity || 1,
      packing_units: item.packing_units || 1.0,
      weight_lbs: item.packed_weight_lbs || 0.5,
    }))

    // Fetch available package types
    const { data: packageTypes, error: packagesError } = await supabase
      .from('shipping_packages')
      .select('*')
      .eq('active', true)
      .order('sort_order')

    if (packagesError || !packageTypes || packageTypes.length === 0) {
      return NextResponse.json({ error: 'No shipping packages configured' }, { status: 500 })
    }

    // Get origin zip
    const { data: settings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['shipping_origin_zip', 'ship_from_zip'])

    const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || [])
    const originZip = settingsMap.get('shipping_origin_zip') || settingsMap.get('ship_from_zip') || '46143'

    // Calculate packing
    const packingResult = calculateOptimalPacking(packingItems, packageTypes as PackageType[])

    if (packingResult.boxes.length === 0) {
      return NextResponse.json({ error: 'Unable to calculate — no suitable packages found' }, { status: 400 })
    }

    // Get rates
    const shippingRates = await getShippingRates(packingResult.boxes, originZip, destination_zip)

    // Build response
    const rates = shippingRates.rates.map(rate => ({
      service: rate.service,
      total_cost: rate.total_cost,
      estimated_days: rate.estimated_days,
      per_package: rate.per_package,
    }))

    return NextResponse.json({
      rates,
      source: shippingRates.source,
      packing: {
        total_packages: packingResult.total_packages,
        total_units: Number(packingResult.total_units.toFixed(2)),
        total_weight: Number(packingResult.total_weight.toFixed(2)),
        boxes: packingResult.boxes.map(box => ({
          package_name: box.package_type.name,
          capacity: box.package_type.capacity_units,
          units_used: Number(box.total_units.toFixed(2)),
          utilization: Math.round(box.utilization * 100),
          content_weight: Number(box.total_weight.toFixed(2)),
          gross_weight: Number(box.gross_weight.toFixed(2)),
          dimensions: `${box.package_type.length_inches}"×${box.package_type.width_inches}"×${box.package_type.height_inches}"`,
          fallback_rate: box.package_type.fallback_rate,
          fallback_cost: Number((box.utilization * box.package_type.fallback_rate).toFixed(2)),
        }))
      },
      origin_zip: originZip,
      destination_zip: destination_zip,
    })

  } catch (error) {
    console.error('Error in test calculation:', error)
    return NextResponse.json({ error: 'Test calculation failed' }, { status: 500 })
  }
}
