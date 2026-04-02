// ============================================
// SHIPPING V3 — Package-based shipping calculation
// ============================================

export interface ShippingCalculation {
  cost: number
  method: string
  estimatedDays: string
  source: 'carrier' | 'fallback'
  packages?: Array<{
    package_type: string
    utilization: number
    weight: number
    dimensions: string
  }>
  breakdown: {
    total_packages: number
    total_weight: number
    total_units: number
    carrier_used?: string
  }
}

export interface ShippingItem {
  product_id?: string
  product_name: string
  category_slug?: string
  quantity: number
  unit_price: number
  line_total: number
}

/**
 * Calculate shipping costs using the new package-based system.
 * This function calls the /api/shipping/available endpoint which uses
 * the packing algorithm and carrier API integration.
 */
export async function calculateShipping(
  items: ShippingItem[],
  destinationZip?: string
): Promise<ShippingCalculation> {
  if (!items || items.length === 0) {
    return {
      cost: 0,
      method: 'No Items',
      estimatedDays: 'N/A',
      source: 'fallback',
      breakdown: { 
        total_packages: 0, 
        total_weight: 0, 
        total_units: 0 
      }
    }
  }

  try {
    // Call the new shipping API
    const response = await fetch('/api/shipping/available', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity
        })),
        destination_zip: destinationZip || '90210' // Default for estimation
      })
    })

    if (!response.ok) {
      console.error('Shipping API error:', response.statusText)
      return getClientSideFallback(items)
    }

    const data = await response.json()

    // Return the first (cheapest) shipping option
    if (data.options && data.options.length > 0) {
      const option = data.options[0]
      return {
        cost: option.cost,
        method: option.name,
        estimatedDays: option.estimated_delivery,
        source: data.source || 'carrier',
        packages: option.packages,
        breakdown: {
          total_packages: data.packing_summary?.total_packages || 1,
          total_weight: data.packing_summary?.total_weight || 0,
          total_units: data.packing_summary?.total_units || 0,
          carrier_used: option.source
        }
      }
    }

    return getClientSideFallback(items)

  } catch (error) {
    console.error('Error calculating shipping:', error)
    return getClientSideFallback(items)
  }
}

/**
 * Synchronous client-side fallback when API is unavailable
 */
export function calculateShippingSync(items: ShippingItem[]): ShippingCalculation {
  return getClientSideFallback(items)
}

/**
 * Get a reasonable client-side estimate when the API is unavailable
 */
function getClientSideFallback(items: ShippingItem[]): ShippingCalculation {
  if (!items || items.length === 0) {
    return {
      cost: 0,
      method: 'No Items',
      estimatedDays: 'N/A',
      source: 'fallback',
      breakdown: { total_packages: 0, total_weight: 0, total_units: 0 }
    }
  }

  // Simple fallback logic based on categories and quantities
  const categoryWeights: { [key: string]: number } = {
    't-shirts': 0.5,
    'blankets': 3.0,
    'banners': 2.0,
    'flags': 0.5
  }

  let totalWeight = 0
  let totalItems = 0

  for (const item of items) {
    const weight = categoryWeights[item.category_slug || ''] || 1.0
    totalWeight += weight * item.quantity
    totalItems += item.quantity
  }

  // Estimate packages needed (rough approximation)
  const estimatedPackages = Math.ceil(totalItems / 10) // Assume ~10 items per package

  // Base rate + weight-based pricing
  const baseCost = 7.99 * estimatedPackages
  const weightSurcharge = Math.max(0, (totalWeight - 5) * 0.50) // $0.50 per lb over 5 lbs
  const totalCost = baseCost + weightSurcharge

  return {
    cost: Math.round(totalCost * 100) / 100,
    method: 'Standard Shipping (Estimated)',
    estimatedDays: totalItems >= 50 ? '7-10 business days' : '5-7 business days',
    source: 'fallback',
    breakdown: {
      total_packages: estimatedPackages,
      total_weight: Math.round(totalWeight * 100) / 100,
      total_units: totalItems
    }
  }
}

/**
 * Format shipping calculation for display
 */
export function formatShippingBreakdown(calculation: ShippingCalculation): string {
  const packageText = calculation.breakdown.total_packages > 1 
    ? `${calculation.breakdown.total_packages} packages` 
    : '1 package'
  
  const sourceText = calculation.source === 'carrier' ? ' (Carrier rates)' : ' (Estimated)'
  
  return `${calculation.method}: $${calculation.cost.toFixed(2)} - Ships in ${packageText}${sourceText}`
}

/**
 * Get shipping cost (legacy compatibility)
 */
export async function getShippingCost(
  items: ShippingItem[], 
  destinationZip?: string
): Promise<number> {
  const calculation = await calculateShipping(items, destinationZip)
  return calculation.cost
}

/**
 * Synchronous shipping cost (uses fallback calculation)
 */
export function getShippingCostSync(items: ShippingItem[]): number {
  const calculation = calculateShippingSync(items)
  return calculation.cost
}

/**
 * Get available shipping options for checkout
 */
export async function getShippingOptions(
  items: ShippingItem[],
  destinationZip: string
): Promise<Array<{
  method_id: string
  name: string
  description: string
  cost: number
  estimated_delivery: string
  source: string
}>> {
  try {
    const response = await fetch('/api/shipping/available', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity
        })),
        destination_zip: destinationZip
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get shipping options')
    }

    const data = await response.json()
    return data.options || []

  } catch (error) {
    console.error('Error getting shipping options:', error)
    
    // Return fallback option
    const fallback = getClientSideFallback(items)
    return [{
      method_id: 'standard_shipping',
      name: fallback.method,
      description: formatShippingBreakdown(fallback),
      cost: fallback.cost,
      estimated_delivery: fallback.estimatedDays,
      source: 'fallback'
    }]
  }
}