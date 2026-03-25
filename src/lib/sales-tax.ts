interface TaxCalculationInput {
  subtotal: number
  shipping_cost: number
  shipping_address: {
    state: string
    postal_code: string
    country: string
  }
}

interface TaxCalculationResult {
  tax_amount: number
  tax_rate: number
  taxable_amount: number
  tax_jurisdiction: string
  exempt_reason?: string
}

// Indiana flat state sales tax rate — no county/local variations
const INDIANA_TAX_RATE = 0.07

/**
 * Calculate sales tax for an order.
 * Only Indiana orders are taxed (single nexus state, flat 7%).
 * Shipping IS taxable in Indiana for tangible personal property.
 */
export function calculateSalesTax(input: TaxCalculationInput): TaxCalculationResult {
  const { subtotal, shipping_cost, shipping_address } = input

  // Only collect tax for Indiana orders
  if (shipping_address.country !== 'US' || shipping_address.state !== 'IN') {
    return {
      tax_amount: 0,
      tax_rate: 0,
      taxable_amount: 0,
      tax_jurisdiction: 'No nexus',
      exempt_reason: 'Out of state — no nexus'
    }
  }

  // Taxable amount = subtotal + shipping (both taxable in IN)
  const taxableAmount = subtotal + shipping_cost

  if (taxableAmount <= 0) {
    return {
      tax_amount: 0,
      tax_rate: 0,
      taxable_amount: 0,
      tax_jurisdiction: 'Indiana',
      exempt_reason: 'Zero taxable amount'
    }
  }

  const taxAmount = Math.round(taxableAmount * INDIANA_TAX_RATE * 100) / 100

  return {
    tax_amount: taxAmount,
    tax_rate: INDIANA_TAX_RATE,
    taxable_amount: taxableAmount,
    tax_jurisdiction: 'Indiana'
  }
}

/**
 * Format tax amount for display
 */
export function formatTaxDisplay(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * Format tax rate for display
 */
export function formatTaxRateDisplay(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}
