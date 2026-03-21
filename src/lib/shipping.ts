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

// Product weight estimates (in pounds)
const PRODUCT_WEIGHTS: { [key: string]: number } = {
  'custom-t-shirt': 0.5,
  'custom-fleece-blanket': 2.0, 
  'custom-vinyl-banner': 1.5,
  'custom-polyester-flag': 0.8
}

// Category shipping multipliers
const CATEGORY_MULTIPLIERS: { [key: string]: number } = {
  't-shirts': 1.0,
  'blankets': 1.5,
  'banners': 1.8,
  'flags': 1.2
}

// Shipping tiers based on total weight
const SHIPPING_TIERS = [
  { maxWeight: 2, baseRate: 8.99, name: 'Standard' },
  { maxWeight: 5, baseRate: 12.99, name: 'Standard' },
  { maxWeight: 10, baseRate: 18.99, name: 'Heavy Item' },
  { maxWeight: 20, baseRate: 28.99, name: 'Bulk Shipping' },
  { maxWeight: Infinity, baseRate: 45.99, name: 'Freight' }
]

export function calculateShipping(items: ShippingItem[]): ShippingCalculation {
  if (!items || items.length === 0) {
    return {
      cost: 0,
      method: 'No Items',
      estimatedDays: 'N/A',
      breakdown: {
        baseShipping: 0,
        quantityAdjustment: 0,
        weightAdjustment: 0,
        categoryMultiplier: 0
      }
    }
  }

  let totalWeight = 0
  let highestCategoryMultiplier = 1.0
  let totalQuantity = 0

  // Calculate total weight and find highest category multiplier
  items.forEach(item => {
    const productSlug = item.product_name.toLowerCase().replace(/\s+/g, '-')
    const itemWeight = PRODUCT_WEIGHTS[productSlug] || 1.0 // Default 1 lb per item
    const categoryMultiplier = CATEGORY_MULTIPLIERS[item.category_slug] || 1.0
    
    totalWeight += itemWeight * item.quantity
    totalQuantity += item.quantity
    
    if (categoryMultiplier > highestCategoryMultiplier) {
      highestCategoryMultiplier = categoryMultiplier
    }
  })

  // Find appropriate shipping tier
  const tier = SHIPPING_TIERS.find(tier => totalWeight <= tier.maxWeight) || SHIPPING_TIERS[SHIPPING_TIERS.length - 1]
  
  let baseShipping = tier.baseRate
  
  // Quantity adjustments
  let quantityAdjustment = 0
  if (totalQuantity > 10) {
    quantityAdjustment = Math.min((totalQuantity - 10) * 1.50, 15.00) // Cap at $15
  }
  
  // Weight-based adjustments (for very heavy orders)
  let weightAdjustment = 0
  if (totalWeight > 20) {
    weightAdjustment = (totalWeight - 20) * 2.00 // $2 per pound over 20 lbs
  }
  
  // Apply category multiplier to base shipping
  const categoryAdjustment = baseShipping * (highestCategoryMultiplier - 1)
  
  const totalCost = Math.round((baseShipping + quantityAdjustment + weightAdjustment + categoryAdjustment) * 100) / 100

  // Determine estimated delivery days based on weight and quantity
  let estimatedDays = '5-7 business days'
  if (totalQuantity >= 100) {
    estimatedDays = '10-14 business days' // Large orders need more time
  } else if (totalWeight > 10) {
    estimatedDays = '7-10 business days' // Heavy items
  }

  return {
    cost: totalCost,
    method: tier.name,
    estimatedDays,
    breakdown: {
      baseShipping,
      quantityAdjustment,
      weightAdjustment,
      categoryMultiplier: categoryAdjustment
    }
  }
}

// Helper function to format shipping breakdown for display
export function formatShippingBreakdown(calculation: ShippingCalculation): string {
  const { breakdown } = calculation
  let details = [`Base ${calculation.method}: $${breakdown.baseShipping.toFixed(2)}`]
  
  if (breakdown.quantityAdjustment > 0) {
    details.push(`High Quantity: +$${breakdown.quantityAdjustment.toFixed(2)}`)
  }
  
  if (breakdown.weightAdjustment > 0) {
    details.push(`Heavy Items: +$${breakdown.weightAdjustment.toFixed(2)}`)
  }
  
  if (breakdown.categoryMultiplier > 0) {
    details.push(`Category Adjustment: +$${breakdown.categoryMultiplier.toFixed(2)}`)
  }
  
  return details.join(' • ')
}

// Simple function for backwards compatibility
export function getShippingCost(items: ShippingItem[]): number {
  return calculateShipping(items).cost
}