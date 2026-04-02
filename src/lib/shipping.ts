// ============================================
// SHIPPING V2 — Wrapper for cart/checkout compatibility
// ============================================

export interface ShippingCalculation {
  cost: number
  method: string
  estimatedDays: string
  breakdown: {
    baseShipping: number
    quantityAdjustment: number
    weightAdjustment: number
    categoryMultiplier: number
  }
}

export interface ShippingItem {
  product_name: string
  category_slug: string
  quantity: number
  unit_price: number
  line_total: number
}

/**
 * Client-side shipping calculation.
 * Calls the /api/shipping/calculate endpoint which uses the new
 * size-class + quantity-bracket system.
 * 
 * This function is kept for backwards compatibility with cart/checkout.
 * It makes a synchronous estimate using a simple lookup since the real
 * calculation happens server-side via the API.
 */
export function calculateShipping(items: ShippingItem[]): ShippingCalculation {
  if (!items || items.length === 0) {
    return {
      cost: 0,
      method: 'No Items',
      estimatedDays: 'N/A',
      breakdown: { baseShipping: 0, quantityAdjustment: 0, weightAdjustment: 0, categoryMultiplier: 0 }
    }
  }

  // Client-side fallback estimate based on quantity and category
  // The real calculation happens server-side via API using DB-backed tiers
  const sizeClassMap: { [key: string]: string } = {
    't-shirts': 'small',
    'blankets': 'large',
    'banners': 'large',
    'flags': 'medium'
  }

  // Approximate flat rates for client-side estimation
  const fallbackRates: { [sizeClass: string]: { [bracket: string]: number } } = {
    'small':  { '1-5': 7.99, '6-24': 10.99, '25+': 15.99 },
    'medium': { '1-5': 9.99, '6-24': 14.99, '25+': 21.99 },
    'large':  { '1-5': 12.99, '6-24': 19.99, '25+': 29.99 }
  }

  let totalCost = 0

  for (const item of items) {
    const sizeClass = sizeClassMap[item.category_slug] || 'small'
    const rates = fallbackRates[sizeClass]
    let rate = rates['1-5']
    if (item.quantity >= 25) rate = rates['25+']
    else if (item.quantity >= 6) rate = rates['6-24']
    totalCost += rate
  }

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)

  return {
    cost: Math.round(totalCost * 100) / 100,
    method: 'Flat Rate',
    estimatedDays: totalQuantity >= 100 ? '10-14 business days' : '5-7 business days',
    breakdown: { baseShipping: totalCost, quantityAdjustment: 0, weightAdjustment: 0, categoryMultiplier: 0 }
  }
}

export function formatShippingBreakdown(calculation: ShippingCalculation): string {
  return `Flat Rate Shipping: $${calculation.cost.toFixed(2)}`
}

export function getShippingCost(items: ShippingItem[]): number {
  return calculateShipping(items).cost
}
